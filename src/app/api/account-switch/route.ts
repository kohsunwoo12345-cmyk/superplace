import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// POST: 계정 전환 (학원장 → 학생/선생님, 선생님 → 학생)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { targetUserId } = await req.json();
    
    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId가 필요합니다.' }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, academyId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 체크: DIRECTOR 또는 TEACHER만 계정 전환 가능
    if (currentUser.role !== 'DIRECTOR' && currentUser.role !== 'TEACHER') {
      return NextResponse.json(
        { error: '계정 전환 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, academyId: true, name: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: '대상 사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 같은 학원인지 체크
    if (currentUser.academyId !== targetUser.academyId) {
      return NextResponse.json(
        { error: '같은 학원 소속 사용자만 전환할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 역할별 전환 가능 여부 체크
    if (currentUser.role === 'DIRECTOR') {
      // 학원장은 선생님 또는 학생으로 전환 가능
      if (targetUser.role !== 'TEACHER' && targetUser.role !== 'STUDENT') {
        return NextResponse.json(
          { error: '학원장은 선생님 또는 학생 계정으로만 전환할 수 있습니다.' },
          { status: 403 }
        );
      }
    } else if (currentUser.role === 'TEACHER') {
      // 선생님은 학생으로만 전환 가능
      if (targetUser.role !== 'STUDENT') {
        return NextResponse.json(
          { error: '선생님은 학생 계정으로만 전환할 수 있습니다.' },
          { status: 403 }
        );
      }
    }

    // 기존 활성 전환 세션이 있으면 비활성화
    await prisma.accountSwitch.updateMany({
      where: {
        originalUserId: currentUser.id,
        isActive: true,
      },
      data: {
        isActive: false,
        switchBackAt: new Date(),
      },
    });

    // 새 전환 세션 생성 (24시간 유효)
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간

    const accountSwitch = await prisma.accountSwitch.create({
      data: {
        originalUserId: currentUser.id,
        targetUserId: targetUser.id,
        originalRole: currentUser.role,
        targetRole: targetUser.role,
        academyId: currentUser.academyId || '',
        sessionToken,
        expiresAt,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: '계정 전환이 완료되었습니다.',
      data: {
        switchId: accountSwitch.id,
        sessionToken: accountSwitch.sessionToken,
        targetUser: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
        },
        expiresAt: accountSwitch.expiresAt,
      },
    });
  } catch (error) {
    console.error('계정 전환 오류:', error);
    return NextResponse.json(
      { error: '계정 전환 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 현재 활성화된 계정 전환 정보 조회
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const activeSwitch = await prisma.accountSwitch.findFirst({
      where: {
        originalUserId: session.user.id,
        isActive: true,
        expiresAt: {
          gte: new Date(),
        },
      },
      include: {
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!activeSwitch) {
      return NextResponse.json({
        isActive: false,
        message: '활성화된 계정 전환이 없습니다.',
      });
    }

    return NextResponse.json({
      isActive: true,
      data: {
        switchId: activeSwitch.id,
        originalRole: activeSwitch.originalRole,
        targetUser: activeSwitch.targetUser,
        expiresAt: activeSwitch.expiresAt,
        switchedAt: activeSwitch.switchedAt,
      },
    });
  } catch (error) {
    console.error('계정 전환 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '계정 전환 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 원래 계정으로 복귀
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const updated = await prisma.accountSwitch.updateMany({
      where: {
        originalUserId: session.user.id,
        isActive: true,
      },
      data: {
        isActive: false,
        switchBackAt: new Date(),
      },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: '활성화된 계정 전환을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '원래 계정으로 복귀했습니다.',
    });
  } catch (error) {
    console.error('계정 복귀 오류:', error);
    return NextResponse.json(
      { error: '계정 복귀 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
