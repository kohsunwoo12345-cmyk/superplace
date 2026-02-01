import { NextRequest, NextResponse } from 'next/server';
import { createWorkerDBClient } from '@/lib/worker-db-client';
import { getServerSession } from 'next-auth';

/**
 * GET /api/cloudflare/d1/users
 * 
 * Cloudflare D1에서 사용자 데이터 가져오기
 * - 학생 (role = 'STUDENT')
 * - 학원장 (role = 'DIRECTOR')
 * 
 * Query Parameters:
 * - role: STUDENT | DIRECTOR | TEACHER | SUPER_ADMIN (optional, filter by role)
 * - academyId: string (optional, filter by academy)
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const academyId = searchParams.get('academyId');

    // Cloudflare Worker DB Client 생성
    const workerDB = createWorkerDBClient();

    // SQL 쿼리 구성
    let sql = `
      SELECT 
        id,
        email,
        name,
        phone,
        role,
        grade,
        academyId,
        studentCode,
        studentId,
        parentPhone,
        approved,
        aiChatEnabled,
        aiHomeworkEnabled,
        aiStudyEnabled,
        points,
        createdAt,
        updatedAt
      FROM User
      WHERE 1=1
    `;

    const params: any[] = [];

    // 역할 필터
    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }

    // 학원 필터
    if (academyId) {
      sql += ` AND academyId = ?`;
      params.push(academyId);
    }

    // 정렬
    sql += ` ORDER BY createdAt DESC`;

    // 쿼리 실행
    const users = await workerDB.query(sql, params);

    // 역할별 통계
    const stats = {
      total: users.length,
      students: users.filter((u: any) => u.role === 'STUDENT').length,
      directors: users.filter((u: any) => u.role === 'DIRECTOR').length,
      teachers: users.filter((u: any) => u.role === 'TEACHER').length,
    };

    return NextResponse.json({
      success: true,
      message: `Cloudflare D1에서 ${users.length}명의 사용자를 가져왔습니다.`,
      users,
      stats,
    });
  } catch (error: any) {
    console.error('Cloudflare D1 사용자 조회 오류:', error);
    
    // Cloudflare Worker 연결 오류 처리
    if (error.message.includes('CLOUDFLARE_WORKER_URL')) {
      return NextResponse.json(
        { 
          error: 'Cloudflare Worker 연결 설정이 필요합니다.',
          details: 'CLOUDFLARE_WORKER_URL과 CLOUDFLARE_WORKER_TOKEN을 환경 변수에 설정하세요.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Cloudflare D1 사용자 데이터를 가져오는 데 실패했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cloudflare/d1/users
 * 
 * Cloudflare D1에 새 사용자 추가
 * 
 * Body:
 * {
 *   "email": "student@example.com",
 *   "password": "hashed_password",
 *   "name": "홍길동",
 *   "role": "STUDENT",
 *   "phone": "010-1234-5678",
 *   "grade": "3학년",
 *   "academyId": "academy_id",
 *   "approved": true
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인 (SUPER_ADMIN 또는 DIRECTOR만 가능)
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'DIRECTOR') {
      return NextResponse.json(
        { error: '권한이 없습니다. SUPER_ADMIN 또는 DIRECTOR만 사용자를 추가할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name, role, phone, grade, academyId, approved } = body;

    // 필수 필드 검증
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다: email, password, name, role' },
        { status: 400 }
      );
    }

    // Cloudflare Worker DB Client 생성
    const workerDB = createWorkerDBClient();

    // 중복 이메일 확인
    const existingUser = await workerDB.queryFirst(
      `SELECT id FROM User WHERE email = ?`,
      [email]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다.' },
        { status: 409 }
      );
    }

    // 새 사용자 추가
    const sql = `
      INSERT INTO User (
        id, email, password, name, role, phone, grade, academyId, approved, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
      )
    `;

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await workerDB.write(sql, [
      userId,
      email,
      password,
      name,
      role,
      phone || null,
      grade || null,
      academyId || null,
      approved ? 1 : 0,
    ]);

    return NextResponse.json({
      success: true,
      message: `사용자가 Cloudflare D1에 추가되었습니다: ${email}`,
      userId,
    });
  } catch (error: any) {
    console.error('Cloudflare D1 사용자 추가 오류:', error);
    return NextResponse.json(
      { 
        error: 'Cloudflare D1에 사용자를 추가하는 데 실패했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
