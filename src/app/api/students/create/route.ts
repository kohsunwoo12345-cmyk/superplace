import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ActivityType, ResourceType } from "@/lib/activity-logger";
import { generateUniqueStudentCode, generateUniqueStudentId } from "@/lib/student-code";

const createStudentSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
  name: z.string().min(2, "이름은 최소 2자 이상이어야 합니다"),
  phone: z.string().optional(),
  parentPhone: z.string().optional(),
  school: z.string().optional(),
  grade: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // 학원장 또는 관리자만 학생 생성 가능
    const director = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        academy: true,
      },
    });

    if (!director || (director.role !== "DIRECTOR" && director.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "학원장 권한이 필요합니다" }, { status: 403 });
    }

    if (!director.academyId && director.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "학원 정보를 찾을 수 없습니다" }, { status: 404 });
    }

    const body = await req.json();
    console.log("📝 Create student request:", JSON.stringify(body, null, 2));
    
    const validatedData = createStudentSchema.parse(body);

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 존재하는 이메일입니다" },
        { status: 400 }
      );
    }

    // 학원의 학생 수 제한 확인
    if (director.academy) {
      const studentCount = await prisma.user.count({
        where: {
          academyId: director.academyId,
          role: "STUDENT",
        },
      });

      if (studentCount >= director.academy.maxStudents) {
        return NextResponse.json(
          { 
            error: `학생 정원이 가득 찼습니다. 현재: ${studentCount}/${director.academy.maxStudents}명`,
            currentCount: studentCount,
            maxCount: director.academy.maxStudents,
          },
          { status: 400 }
        );
      }
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // 고유 학생 코드 생성 (5자리)
    const studentCode = await generateUniqueStudentCode();
    console.log("🔢 Generated student code:", studentCode);

    // 고유 학번 생성 (STU-001, STU-002, ...)
    const studentId = await generateUniqueStudentId(director.academyId);
    console.log("🆔 Generated student ID:", studentId);

    // 학생 계정 생성 (자동 승인)
    const student = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        phone: validatedData.phone,
        parentPhone: validatedData.parentPhone,
        school: validatedData.school,
        grade: validatedData.grade,
        role: "STUDENT",
        academyId: director.academyId,
        studentId, // 학번 할당
        studentCode, // 학생 코드 할당
        approved: true, // 학원장이 직접 생성하므로 자동 승인
        approvedBy: director.id,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        grade: true,
        studentId: true,
        studentCode: true, // 학생 코드 포함
        approved: true,
        createdAt: true,
      },
    });

    console.log("✅ Student created:", student.id, "Student ID:", student.studentId, "Code:", student.studentCode);

    // 학생 추가 활동 로그 기록
    try {
      await prisma.activityLog.create({
        data: {
          userId: director.id,
          action: ActivityType.STUDENT_ADD,
          resource: ResourceType.STUDENTS,
          resourceId: student.id,
          description: `${director.name || director.email}님이 학생 '${student.name}'을(를) 추가했습니다. (학번: ${student.studentId}, 학생코드: ${student.studentCode})`,
          metadata: {
            studentEmail: student.email,
            studentName: student.name,
            studentId: student.studentId,
            studentCode: student.studentCode,
            grade: student.grade,
            school: validatedData.school,
          },
        },
      });
    } catch (logError) {
      console.error('학생 추가 활동 로그 기록 실패:', logError);
      // 로그 실패해도 학생 생성은 계속 진행
    }

    return NextResponse.json(
      { 
        message: "학생 계정이 생성되었습니다.",
        student,
        studentId: student.studentId, // 학번 반환
        studentCode: student.studentCode, // 학생 코드 반환
      },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Create student error:", error);
    return NextResponse.json(
      { 
        error: "학생 계정 생성 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
