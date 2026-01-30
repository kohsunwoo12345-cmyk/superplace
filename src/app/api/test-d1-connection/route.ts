import { NextResponse } from 'next/server';
import { getD1Users } from '@/lib/cloudflare-d1-client';

export async function GET() {
  try {
    console.log('🔍 D1 연결 테스트 시작...');
    
    // D1에서 사용자 조회 시도
    const users = await getD1Users();
    
    console.log(`✅ D1에서 ${users.length}명의 사용자를 가져왔습니다.`);
    
    return NextResponse.json({
      success: true,
      message: 'D1 연결 성공!',
      userCount: users.length,
      sampleUser: users.length > 0 ? {
        id: users[0].id,
        email: users[0].email,
        name: users[0].name,
        role: users[0].role,
      } : null,
    });
  } catch (error: any) {
    console.error('❌ D1 연결 실패:', error);
    
    return NextResponse.json({
      success: false,
      message: 'D1 연결 실패',
      error: error.message,
      details: {
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3),
      }
    }, { status: 500 });
  }
}
