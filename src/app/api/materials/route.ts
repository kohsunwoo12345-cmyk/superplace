import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/materials
 * 학습 자료 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { role, academyId } = session.user;
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");
    const grade = searchParams.get("grade");
    const category = searchParams.get("category");

    // 학생인 경우: 자신의 학원 자료만
    // 학원장/선생님: 자신의 학원 자료만
    // 관리자: 모든 자료
    const materials = await prisma.learningMaterial.findMany({
      where: {
        academyId: role === "SUPER_ADMIN" ? undefined : academyId,
        isPublished: true,
        ...(subject && { subject }),
        ...(grade && { grade }),
        ...(category && { category }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        _count: {
          select: {
            progress: true,
          },
        },
      },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({
      success: true,
      materials,
    });
  } catch (error) {
    console.error("❌ 학습 자료 조회 오류:", error);
    return NextResponse.json({ error: "학습 자료 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

/**
 * POST /api/materials
 * 학습 자료 생성
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { role, academyId, id: userId } = session.user;

    // 권한 확인 (학원장, 선생님, 관리자만 생성 가능)
    if (role !== "DIRECTOR" && role !== "TEACHER" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const {
      title,
      description,
      subject,
      grade,
      category,
      contentType,
      contentUrl,
      content,
      duration,
      difficulty,
      tags,
      isPublished,
    } = await request.json();

    if (!title || !subject || !grade || !category || !contentType) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    // contentType에 따라 content 또는 contentUrl 필수
    if (contentType === "text" && !content) {
      return NextResponse.json(
        { error: "텍스트 콘텐츠를 입력해주세요." },
        { status: 400 }
      );
    }

    if ((contentType === "video" || contentType === "pdf" || contentType === "link") && !contentUrl) {
      return NextResponse.json(
        { error: "URL을 입력해주세요." },
        { status: 400 }
      );
    }

    const material = await prisma.learningMaterial.create({
      data: {
        academyId: academyId || "",
        title,
        description,
        subject,
        grade,
        category,
        contentType,
        contentUrl,
        content,
        duration: duration ? parseInt(duration) : null,
        difficulty: difficulty || "MEDIUM",
        tags: tags ? JSON.stringify(tags) : null,
        isPublished: isPublished !== undefined ? isPublished : true,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "학습 자료가 생성되었습니다.",
      material,
    });
  } catch (error) {
    console.error("❌ 학습 자료 생성 오류:", error);
    return NextResponse.json({ error: "학습 자료 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}

/**
 * DELETE /api/materials?id=xxx
 * 학습 자료 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { role, id: userId } = session.user;
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get("id");

    if (!materialId) {
      return NextResponse.json({ error: "자료 ID가 필요합니다." }, { status: 400 });
    }

    // 자료 조회
    const material = await prisma.learningMaterial.findUnique({
      where: { id: materialId },
      select: { createdById: true },
    });

    if (!material) {
      return NextResponse.json({ error: "자료를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인 (작성자 또는 관리자만 삭제 가능)
    if (material.createdById !== userId && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    await prisma.learningMaterial.delete({
      where: { id: materialId },
    });

    return NextResponse.json({
      success: true,
      message: "학습 자료가 삭제되었습니다.",
    });
  } catch (error) {
    console.error("❌ 학습 자료 삭제 오류:", error);
    return NextResponse.json({ error: "학습 자료 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
