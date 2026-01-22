import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 관리자가 학원장으로부터 AI 봇 회수
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const { userId, botId } = await request.json();

    if (!userId || !botId) {
      return NextResponse.json(
        { error: 'userId와 botId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 할당 찾기
    const assignment = await prisma.botAssignment.findUnique({
      where: {
        userId_botId: {
          userId,
          botId,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: '해당 할당을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 비활성화
    await prisma.botAssignment.update({
      where: { id: assignment.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'AI 봇 할당이 취소되었습니다.' });
  } catch (error) {
    console.error('Error revoking bot:', error);
    return NextResponse.json(
      { error: 'AI 봇 회수에 실패했습니다.' },
      { status: 500 }
    );
  }
}
