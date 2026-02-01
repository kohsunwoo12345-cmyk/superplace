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

    const { userId, botId, duration, durationUnit } = await request.json();

    if (!userId || !botId) {
      return NextResponse.json(
        { error: 'userId와 botId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 만료일 계산 (duration과 durationUnit이 있는 경우)
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

    // 봇이 실제로 존재하는지 확인
    const bot = await prisma.aIBot.findUnique({
      where: { botId },
      select: { id: true, botId: true, name: true },
    });

    if (!bot) {
      return NextResponse.json(
        { error: '해당 봇을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 대상 사용자가 학원장인지 확인
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true, email: true },
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
          grantedByRole: 'SUPER_ADMIN',
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
