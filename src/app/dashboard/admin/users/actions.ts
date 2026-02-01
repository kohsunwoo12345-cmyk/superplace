'use server';

import { prisma } from '@/lib/prisma';

export async function getUsersAction() {
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
        points: true,
        approved: true,
        academy: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        aiChatEnabled: true,
        aiHomeworkEnabled: true,
        aiStudyEnabled: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, users };
  } catch (error: any) {
    console.error('getUsersAction error:', error);
    return { success: false, error: error.message, users: [] };
  }
}
