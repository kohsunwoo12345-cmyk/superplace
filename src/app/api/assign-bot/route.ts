import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * 역할별 봇 할당 API
 * - SUPER_ADMIN: 학원장에게 할당
 * - DIRECTOR: 선생님/학생에게 할당 (같은 학원)
 * - TEACHER: 담당 학생에게 할당
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { userId, botId, duration, durationUnit } = await request.json();

    if (!userId || !botId) {
      return NextResponse.json(
        { error: 'userId와 botId가 필요합니다.' },
        { status: 400 }
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

    // 봇 존재 확인
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

    // 대상 사용자 조회
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        role: true, 
        name: true, 
        email: true,
        academyId: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: '대상 사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 역할별 권한 체크
    const grantorRole = session.user.role;
    const targetRole = targetUser.role;

    // SUPER_ADMIN은 학원장에게만 할당 가능
    if (grantorRole === 'SUPER_ADMIN') {
      if (targetRole !== 'DIRECTOR') {
        return NextResponse.json(
          { error: '관리자는 학원장에게만 봇을 할당할 수 있습니다.' },
          { status: 403 }
        );
      }
    }
    // DIRECTOR는 같은 학원의 선생님/학생에게 할당 가능
    else if (grantorRole === 'DIRECTOR') {
      const grantor = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { academyId: true },
      });

      if (!grantor?.academyId || grantor.academyId !== targetUser.academyId) {
        return NextResponse.json(
          { error: '같은 학원의 사용자에게만 할당할 수 있습니다.' },
          { status: 403 }
        );
      }

      if (targetRole !== 'TEACHER' && targetRole !== 'STUDENT') {
        return NextResponse.json(
          { error: '학원장은 선생님과 학생에게만 할당할 수 있습니다.' },
          { status: 403 }
        );
      }

      // 학원장이 이 봇을 할당받았는지 확인
      const directorAssignment = await prisma.botAssignment.findFirst({
        where: {
          userId: session.user.id,
          botId,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      });

      if (!directorAssignment) {
        return NextResponse.json(
          { error: '먼저 관리자로부터 이 봇을 할당받아야 합니다.' },
          { status: 403 }
        );
      }
    }
    // TEACHER는 담당 학생에게만 할당 가능
    else if (grantorRole === 'TEACHER') {
      if (targetRole !== 'STUDENT') {
        return NextResponse.json(
          { error: '선생님은 학생에게만 할당할 수 있습니다.' },
          { status: 403 }
        );
      }

      const grantor = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { academyId: true },
      });

      if (!grantor?.academyId || grantor.academyId !== targetUser.academyId) {
        return NextResponse.json(
          { error: '같은 학원의 학생에게만 할당할 수 있습니다.' },
          { status: 403 }
        );
      }

      // 선생님이 이 봇을 할당받았는지 확인
      const teacherAssignment = await prisma.botAssignment.findFirst({
        where: {
          userId: session.user.id,
          botId,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      });

      if (!teacherAssignment) {
        return NextResponse.json(
          { error: '먼저 학원장으로부터 이 봇을 할당받아야 합니다.' },
          { status: 403 }
        );
      }
    }
    // STUDENT는 할당 권한 없음
    else {
      return NextResponse.json(
        { error: '할당 권한이 없습니다.' },
        { status: 403 }
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
          grantedById: session.user.id,
          grantedByRole: grantorRole,
        },
      });
    } else {
      // 새로 생성
      await prisma.botAssignment.create({
        data: {
          userId,
          botId,
          grantedById: session.user.id,
          grantedByRole: grantorRole,
          isActive: true,
          expiresAt: expiresAt,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'AI 봇이 성공적으로 할당되었습니다.',
      assignment: {
        userId,
        botId,
        expiresAt,
      }
    });
  } catch (error) {
    console.error('Error assigning bot:', error);
    return NextResponse.json(
      { error: 'AI 봇 할당에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 할당 취소 API
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const botId = searchParams.get('botId');

    if (!userId || !botId) {
      return NextResponse.json(
        { error: 'userId와 botId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 할당 조회
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
        { error: '할당 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 체크: 할당한 사람이거나 상위 권한자만 취소 가능
    if (assignment.grantedById !== session.user.id && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: '할당 취소 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 비활성화
    await prisma.botAssignment.update({
      where: { id: assignment.id },
      data: { isActive: false },
    });

    return NextResponse.json({ 
      success: true, 
      message: '할당이 취소되었습니다.' 
    });
  } catch (error) {
    console.error('Error revoking bot assignment:', error);
    return NextResponse.json(
      { error: '할당 취소에 실패했습니다.' },
      { status: 500 }
    );
  }
}
