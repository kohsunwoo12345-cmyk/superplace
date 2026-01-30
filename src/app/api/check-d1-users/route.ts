import { NextResponse } from 'next/server';
import { executeD1Query, isD1Configured } from '@/lib/cloudflare-d1-client';

export async function GET() {
  try {
    console.log('🔍 D1 데이터베이스 상세 조회...');
    
    // D1 설정 확인
    if (!isD1Configured()) {
      return NextResponse.json({
        success: false,
        error: 'Cloudflare D1이 설정되지 않았습니다.',
      }, { status: 500 });
    }

    // 1. 전체 사용자 수 확인
    const countResult = await executeD1Query(`SELECT COUNT(*) as total FROM User`);
    const totalUsers = countResult[0]?.total || 0;

    // 2. 모든 사용자 조회 (최대 50명)
    const allUsers = await executeD1Query(`
      SELECT 
        id, email, name, role, grade, studentCode, 
        approved, createdAt, updatedAt
      FROM User 
      ORDER BY createdAt DESC 
      LIMIT 50
    `);

    // 3. 역할별 통계
    const roleStats = await executeD1Query(`
      SELECT role, COUNT(*) as count 
      FROM User 
      GROUP BY role
    `);

    // 4. 최근 생성된 사용자 (최근 7일)
    const recentUsers = await executeD1Query(`
      SELECT 
        id, email, name, role, createdAt
      FROM User 
      WHERE createdAt >= datetime('now', '-7 days')
      ORDER BY createdAt DESC
    `);

    // 5. 테이블 구조 확인
    const tableInfo = await executeD1Query(`
      PRAGMA table_info(User)
    `);

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers,
        hasUsers: totalUsers > 0,
        recentUsersCount: recentUsers.length,
      },
      statistics: {
        byRole: roleStats.reduce((acc: any, row: any) => {
          acc[row.role] = row.count;
          return acc;
        }, {}),
      },
      users: allUsers.map((u: any) => ({
        email: u.email,
        name: u.name,
        role: u.role,
        grade: u.grade,
        studentCode: u.studentCode,
        approved: u.approved,
        createdAt: u.createdAt,
      })),
      recentUsers: recentUsers.map((u: any) => ({
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
      })),
      tableStructure: tableInfo,
    });
  } catch (error: any) {
    console.error('❌ D1 조회 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5),
      }
    }, { status: 500 });
  }
}
