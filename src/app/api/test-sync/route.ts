import { NextResponse } from 'next/server';
import { getD1Users } from '@/lib/cloudflare-d1-client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('🔍 동기화 테스트 시작...');
    
    // Step 1: D1에서 사용자 가져오기
    const d1Users = await getD1Users();
    console.log(`✅ D1에서 ${d1Users.length}명의 사용자를 가져왔습니다.`);
    
    // Step 2: 로컬 DB 사용자 수 확인
    const localUserCount = await prisma.user.count();
    console.log(`📊 로컬 DB에 ${localUserCount}명의 사용자가 있습니다.`);
    
    // Step 3: 동기화 시뮬레이션 (실제 저장하지 않음)
    let wouldCreate = 0;
    let wouldUpdate = 0;
    const syncDetails = [];
    
    for (const d1User of d1Users) {
      const existingUser = await prisma.user.findUnique({
        where: { email: d1User.email },
      });
      
      if (existingUser) {
        wouldUpdate++;
        syncDetails.push({
          email: d1User.email,
          action: 'UPDATE',
          name: d1User.name,
          role: d1User.role,
        });
      } else {
        wouldCreate++;
        syncDetails.push({
          email: d1User.email,
          action: 'CREATE',
          name: d1User.name,
          role: d1User.role,
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: '동기화 테스트 완료',
      d1Stats: {
        totalUsers: d1Users.length,
        sampleUsers: d1Users.slice(0, 3).map(u => ({
          email: u.email,
          name: u.name,
          role: u.role,
        })),
      },
      localStats: {
        totalUsers: localUserCount,
      },
      syncSimulation: {
        wouldCreate,
        wouldUpdate,
        total: wouldCreate + wouldUpdate,
        details: syncDetails,
      },
    });
  } catch (error: any) {
    console.error('❌ 동기화 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
