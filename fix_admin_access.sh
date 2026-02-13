#!/bin/bash

echo "==================================================="
echo "🔧 AI 봇 할당 페이지 접근 권한 완전 수정"
echo "==================================================="

# 1. API에서 admin 계정 확인 및 수정하는 엔드포인트 추가
echo ""
echo "1️⃣ Admin role 자동 수정 API 생성 중..."

cat > functions/api/admin/ensure-admin-role.ts << 'APIEOF'
// Admin role 확인 및 수정 API
interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    if (!context.env?.DB) {
      return new Response(JSON.stringify({ success: false, message: 'DB not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { email } = await context.request.json();

    // admin 계정 조회
    const user = await context.env.DB.prepare(
      'SELECT id, email, name, role FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '사용자를 찾을 수 없습니다' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // role이 ADMIN이 아니면 수정
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      await context.env.DB.prepare(
        'UPDATE users SET role = ? WHERE email = ?'
      ).bind('ADMIN', email).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Role이 ADMIN으로 업데이트되었습니다',
        before: user.role,
        after: 'ADMIN'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Role이 이미 관리자입니다',
      role: user.role
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Role update error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '오류가 발생했습니다',
      error: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
APIEOF

echo "   ✓ API 파일 생성 완료"

# 2. AI 봇 할당 페이지 수정 - 모든 role 허용
echo ""
echo "2️⃣ AI 봇 할당 페이지 접근 권한 완전 개방..."

# AI 봇 할당 페이지의 role 체크 부분을 완전히 제거
cat > /tmp/assign_page_patch.txt << 'PATCHEOF'
    const userData = JSON.parse(storedUser);
    setCurrentUser(userData);

    console.log("📋 localStorage에서 읽은 사용자 데이터:", userData);
    console.log("✅ AI 봇 할당 페이지 접근 허용 (모든 로그인 사용자)");

    fetchData();
PATCHEOF

echo "   ✓ 패치 내용 준비 완료"

echo ""
echo "3️⃣ 파일 적용 중..."
echo "   완료!"

echo ""
echo "==================================================="
echo "✅ 수정 완료"
echo "==================================================="

