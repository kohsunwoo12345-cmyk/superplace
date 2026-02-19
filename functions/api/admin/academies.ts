// Cloudflare Pages Function
// GET /api/admin/academies - 모든 학원 및 학원장 목록 조회

import { getUserFromAuth } from '../../_lib/auth';

export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    // 인증 확인
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Unauthorized" 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = getUserFromAuth(request);
    if (!user) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Invalid token" 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('📊 Fetching academies for user:', user.userId || user.id);

    // Academy 테이블에서 모든 학원 조회
    const academiesResult = await env.DB.prepare(`
      SELECT 
        a.id,
        a.name,
        a.address,
        a.phone,
        a.email,
        a.isActive,
        a.createdAt,
        u.name as directorName,
        u.email as directorEmail,
        u.phoneNumber as directorPhone,
        (SELECT COUNT(*) FROM User WHERE academyId = a.id AND role = 'STUDENT') as studentCount,
        (SELECT COUNT(*) FROM User WHERE academyId = a.id AND role = 'TEACHER') as teacherCount,
        (SELECT COUNT(*) FROM User WHERE academyId = a.id AND role = 'DIRECTOR') as directorCount
      FROM Academy a
      LEFT JOIN User u ON a.directorId = u.id
      ORDER BY a.createdAt DESC
    `).all();

    console.log('✅ Found academies:', academiesResult.results?.length || 0);
    console.log('📋 Raw academy data:', JSON.stringify(academiesResult.results?.slice(0, 3), null, 2));

    const academies = (academiesResult.results || []).map(academy => ({
      id: academy.id,
      name: academy.name,
      address: academy.address || '',
      phone: academy.phone || '',
      email: academy.email || '',
      directorName: academy.directorName || '학원장 미지정',
      directorEmail: academy.directorEmail || '',
      directorPhone: academy.directorPhone || '',
      studentCount: academy.studentCount || 0,
      teacherCount: academy.teacherCount || 0,
      directorCount: academy.directorCount || 0,
      isActive: Boolean(academy.isActive),
      createdAt: academy.createdAt
    }));

    return new Response(JSON.stringify({
      success: true,
      academies: academies,
      total: academies.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Error fetching academies:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to fetch academies",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
