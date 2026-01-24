import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 전체 대화 목록 조회 (관리자 전용)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관리자만 접근 가능
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 모든 대화 조회
    const conversations = await prisma.botConversation.findMany({
      orderBy: {
        lastMessageAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('대화 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '대화 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
