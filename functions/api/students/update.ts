// 학생 정보 수정 API
// PUT /api/students/update

import { decodeToken } from '../../_lib/auth';

interface Env {
  DB: D1Database;
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return Response.json({ 
      success: false, 
      error: "Database not configured" 
    }, { status: 500 });
  }

  try {
    // 인증 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ 
        success: false, 
        error: "인증 토큰이 필요합니다" 
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = decodeToken(token);
    
    if (!payload) {
      return Response.json({ 
        success: false, 
        error: "유효하지 않은 토큰입니다" 
      }, { status: 401 });
    }

    // 권한 확인 (DIRECTOR, ADMIN, SUPER_ADMIN)
    const role = payload.role?.toUpperCase();
    if (!['DIRECTOR', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return Response.json({ 
        success: false, 
        error: "권한이 없습니다" 
      }, { status: 403 });
    }

    // 요청 데이터 파싱
    const data = await request.json();
    const { 
      studentId, 
      name, 
      phone, 
      email, 
      grade, 
      diagnostic_memo,
      password,
      classIds 
    } = data;

    if (!studentId) {
      return Response.json({ 
        success: false, 
        error: "학생 ID가 필요합니다" 
      }, { status: 400 });
    }

    console.log('📝 학생 정보 수정:', { studentId, name, phone, grade });

    // users 테이블 업데이트 시도
    let updated = false;
    
    try {
      // users 테이블 업데이트 (name, phone, email, password, school, grade 포함)
      const updateFields = [];
      const updateValues = [];
      
      if (name) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      if (phone) {
        updateFields.push('phone = ?');
        updateValues.push(phone);
      }
      if (email) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }
      if (password) {
        updateFields.push('password = ?');
        updateValues.push(password);
      }
      if (grade !== undefined) {
        updateFields.push('grade = ?');
        updateValues.push(grade);
      }
      
      if (updateFields.length > 0) {
        updateValues.push(studentId);
        const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        console.log('📝 UPDATE users:', query);
        console.log('📝 VALUES:', updateValues);
        await env.DB.prepare(query).bind(...updateValues).run();
        
        console.log('✅ users 테이블 업데이트 성공');
        updated = true;
      }
    } catch (e: any) {
      console.log('⚠️ users 테이블 업데이트 실패:', e.message);
    }
    
    // User 테이블 시도 (users 실패 시)
    if (!updated) {
      try {
        const updateFields = [];
        const updateValues = [];
        
        if (name) {
          updateFields.push('name = ?');
          updateValues.push(name);
        }
        if (phone) {
          updateFields.push('phone = ?');
          updateValues.push(phone);
        }
        if (email) {
          updateFields.push('email = ?');
          updateValues.push(email);
        }
        if (password) {
          updateFields.push('password = ?');
          updateValues.push(password);
        }
        if (grade !== undefined) {
          updateFields.push('grade = ?');
          updateValues.push(grade);
        }
        
        if (updateFields.length > 0) {
          updateValues.push(studentId);
          const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
          console.log('📝 UPDATE User:', query);
          console.log('📝 VALUES:', updateValues);
          await env.DB.prepare(query).bind(...updateValues).run();
          
          console.log('✅ User 테이블 업데이트 성공');
          updated = true;
        }
      } catch (e2: any) {
        console.error('❌ User 테이블 업데이트도 실패:', e2.message);
      }
    }

    // 반 정보 업데이트
    if (classIds && Array.isArray(classIds)) {
      try {
        // 기존 반 정보 삭제
        await env.DB.prepare(`
          DELETE FROM ClassStudent WHERE studentId = ?
        `).bind(studentId).run();

        // 새로운 반 정보 삽입 (최대 3개)
        for (const classId of classIds.slice(0, 3)) {
          const csId = `cs-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          console.log(`  - Adding student ${studentId} to class ${classId} with id ${csId}`);
          await env.DB.prepare(`
            INSERT INTO ClassStudent (id, studentId, classId, enrolledAt)
            VALUES (?, ?, ?, datetime('now'))
          `).bind(csId, studentId, classId).run();
        }
        
        console.log('✅ 반 정보 업데이트 성공');
        updated = true;
      } catch (e) {
        console.log('⚠️ 반 정보 업데이트 실패 (무시):', e);
      }
    }

    if (!updated) {
      console.error('❌ 최종 updated 상태: false');
      console.error('❌ 제공된 필드:', { name, phone, email, password, grade, diagnostic_memo, classIds });
      return Response.json({ 
        success: false, 
        error: "업데이트 실패",
        debug: {
          updated,
          hasUserUpdate: !!(name || phone || email || password),
          hasStudentUpdate: !!(grade !== undefined || diagnostic_memo !== undefined),
          hasClassUpdate: !!(classIds && Array.isArray(classIds))
        }
      }, { status: 500 });
    }

    return Response.json({ 
      success: true,
      message: "학생 정보가 수정되었습니다"
    }, { status: 200 });

  } catch (error: any) {
    console.error("학생 정보 수정 오류:", error);
    return Response.json({
      success: false,
      error: error.message || "학생 정보 수정 실패"
    }, { status: 500 });
  }
};
// 1771717552
