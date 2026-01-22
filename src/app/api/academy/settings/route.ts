import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 학원 정보 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // DIRECTOR 또는 SUPER_ADMIN만 접근 가능
    if (session.user.role !== 'DIRECTOR' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // SUPER_ADMIN이 아닌 경우 자신의 학원만 조회 가능
    if (session.user.role === 'DIRECTOR' && !session.user.academyId) {
      return NextResponse.json({ error: 'Academy not found' }, { status: 404 });
    }

    const academyId = session.user.academyId;

    const academy = await prisma.academy.findUnique({
      where: { id: academyId },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!academy) {
      return NextResponse.json({ error: 'Academy not found' }, { status: 404 });
    }

    // 초대 코드 생성 (academyId의 앞 8자를 대문자로)
    const inviteCode = academy.id.slice(0, 8).toUpperCase();

    return NextResponse.json({
      ...academy,
      inviteCode,
    });
  } catch (error) {
    console.error('Error fetching academy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academy' },
      { status: 500 }
    );
  }
}

// PATCH: 학원 정보 수정
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // DIRECTOR 또는 SUPER_ADMIN만 수정 가능
    if (session.user.role !== 'DIRECTOR' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!session.user.academyId) {
      return NextResponse.json({ error: 'Academy not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, address, phone, email, naverPlaceUrl, naverBlogUrl } = body;

    // 입력 검증
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Academy name is required' },
        { status: 400 }
      );
    }

    const academy = await prisma.academy.update({
      where: { id: session.user.academyId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        naverPlaceUrl: naverPlaceUrl?.trim() || null,
        naverBlogUrl: naverBlogUrl?.trim() || null,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    // 초대 코드 추가
    const inviteCode = academy.id.slice(0, 8).toUpperCase();

    return NextResponse.json({
      ...academy,
      inviteCode,
    });
  } catch (error) {
    console.error('Error updating academy:', error);
    return NextResponse.json(
      { error: 'Failed to update academy' },
      { status: 500 }
    );
  }
}
