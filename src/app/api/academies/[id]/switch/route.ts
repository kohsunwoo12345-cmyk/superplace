import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST: 학원장 계정으로 전환
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 [SWITCH] 학원 계정 전환 요청:', params.id);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // SUPER_ADMIN만 가능
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, name: true },
    });

    if (currentUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const academyId = params.id;

    // 해당 학원의 학원장 계정 찾기
    const director = await prisma.user.findFirst({
      where: {
        academyId: academyId,
        role: 'DIRECTOR',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        academyId: true,
      },
    });

    if (!director) {
      return NextResponse.json({ error: '학원장 계정을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 계정 전환 기록 생성
    await prisma.accountSwitch.create({
      data: {
        originalUserId: currentUser.id,
        targetUserId: director.id,
        reason: `관리자 ${currentUser.name}가 학원 관리를 위해 학원장 계정으로 전환`,
      },
    });

    console.log('✅ [SWITCH] 계정 전환 성공:', currentUser.name, '→', director.name);

    return NextResponse.json({
      success: true,
      message: '학원장 계정으로 전환되었습니다.',
      targetUser: {
        id: director.id,
        name: director.name,
        email: director.email,
        role: director.role,
      },
      redirectUrl: '/dashboard',
    });

  } catch (error: any) {
    console.error('❌ [SWITCH] 오류:', error);
    return NextResponse.json(
      {
        error: '계정 전환 중 오류가 발생했습니다.',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
