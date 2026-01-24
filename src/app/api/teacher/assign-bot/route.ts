import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 선생님이 학생에게 AI 봇 할당
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: '선생님만 학생에게 봇을 할당할 수 있습니다.' },
        { status: 403 }
      );
    }

    const { userId, botId, duration, durationUnit } = await request.json();

    if (!userId || !botId) {
      return NextResponse.json(
        { error: 'userId와 botId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 대상 사용자가 학생인지 확인
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, academyId: true },
    });

    if (!targetUser || targetUser.role !== 'STUDENT') {
      return NextResponse.json(
        { error: '대상 사용자가 학생이 아닙니다.' },
        { status: 400 }
      );
    }

    // 선생님과 학생이 같은 학원인지 확인
    if (targetUser.academyId !== session.user.academyId) {
      return NextResponse.json(
        { error: '같은 학원의 학생에게만 할당할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 선생님이 이 봇을 할당받았는지 확인
    const teacherAssignment = await prisma.botAssignment.findUnique({
      where: {
        userId_botId: {
          userId: session.user.id,
          botId,
        },
      },
    });

    if (!teacherAssignment || !teacherAssignment.isActive) {
      return NextResponse.json(
        { error: '선생님께 할당되지 않은 봇은 학생에게 할당할 수 없습니다.' },
        { status: 403 }
      );
    }

    // 만료일 계산
    let expiresAt: Date | null = null;
    if (duration && durationUnit) {
      const now = new Date();
      switch (durationUnit) {
        case 'days':
          expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
          break;
        case 'weeks':
          expiresAt = new Date(now.getTime() + duration * 7 * 24 * 60 * 60 * 1000);
          break;
        case 'months':
          expiresAt = new Date(now.setMonth(now.getMonth() + duration));
          break;
        case 'years':
          expiresAt = new Date(now.setFullYear(now.getFullYear() + duration));
          break;
        default:
          expiresAt = null;
      }
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
      // 이미 있으면 활성화 및 만료일 업데이트
      await prisma.botAssignment.update({
        where: { id: existing.id },
        data: { 
          isActive: true,
          expiresAt: expiresAt,
        },
      });
    } else {
      // 새로 생성
      await prisma.botAssignment.create({
        data: {
          userId,
          botId,
          grantedById: session.user.id,
          grantedByRole: 'TEACHER',
          isActive: true,
          expiresAt: expiresAt,
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
