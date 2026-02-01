import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Node.js Runtime 명시
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PUBLIC API - 인증 없이 모든 사용자 조회
 * /api/public/all-users
 */
export async function GET(request: NextRequest) {
  console.log("🔥 PUBLIC API: /api/public/all-users");
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        grade: true,
        studentCode: true,
        studentId: true,
        points: true,
        aiChatEnabled: true,
        aiHomeworkEnabled: true,
        aiStudyEnabled: true,
        approved: true,
        academyId: true,
        academy: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
