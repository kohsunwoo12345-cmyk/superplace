import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Only admins can respond to contacts
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "DIRECTOR") {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { response, status } = body;

    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: {
        response,
        status: status || "IN_PROGRESS",
        respondedBy: session.user.id,
        respondedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: "답변이 저장되었습니다",
        contact,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact response error:", error);
    return NextResponse.json(
      {
        error: "답변 저장 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
