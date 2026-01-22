import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 관리자가 학원장에게 AI 봇 할당
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

    // 대상 사용자가 학원장인지 확인
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!targetUser || targetUser.role !== 'DIRECTOR') {
      return NextResponse.json(
        { error: '대상 사용자가 학원장이 아닙니다.' },
        { status: 400 }
      );
    }

    // 이미 할당되어 있는지 확인
    const existing = await prisma.botAssignment.findUnique({
      where: {
        userId_botId: {
          userId,
          botId,
        },
      },
    });

    if (existing) {
      // 이미 있으면 활성화만
      await prisma.botAssignment.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    } else {
      // 새로 생성
      await prisma.botAssignment.create({
        data: {
          userId,
          botId,
          grantedById: session.user.id,
          grantedByRole: 'SUPER_ADMIN',
          isActive: true,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'AI 봇이 성공적으로 할당되었습니다.' });
  } catch (error) {
    console.error('Error assigning bot:', error);
    return NextResponse.json(
      { error: 'AI 봇 할당에 실패했습니다.' },
      { status: 500 }
    );
  }
}
