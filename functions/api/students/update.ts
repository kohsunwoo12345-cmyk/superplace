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
      school, 
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

    console.log('📝 학생 정보 수정:', { studentId, name, phone, school, grade });

    // users 테이블 업데이트 시도
    let updated = false;
    
    try {
      // users 테이블 업데이트
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
      
      if (updateFields.length > 0) {
        updateValues.push(studentId);
        await env.DB.prepare(`
          UPDATE users 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `).bind(...updateValues).run();
        
        console.log('✅ users 테이블 업데이트 성공');
        updated = true;
      }
    } catch (e) {
      console.log('⚠️ users 테이블 업데이트 실패, User 테이블 시도');
      
      // User 테이블 시도
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
        
        if (updateFields.length > 0) {
          updateValues.push(studentId);
          await env.DB.prepare(`
            UPDATE User 
            SET ${updateFields.join(', ')}
            WHERE id = ?
          `).bind(...updateValues).run();
          
          console.log('✅ User 테이블 업데이트 성공');
          updated = true;
        }
      } catch (e2) {
        console.error('❌ User 테이블 업데이트도 실패');
      }
    }

    // students 테이블 업데이트 (school, grade)
    if (school !== undefined || grade !== undefined || diagnostic_memo !== undefined) {
      try {
        // students 테이블이 있는지 확인
        const existingStudent = await env.DB.prepare(`
          SELECT id FROM students WHERE user_id = ?
        `).bind(studentId).first();

        console.log('🔍 existingStudent:', existingStudent);

        if (existingStudent) {
          // 업데이트
          const updateFields = [];
          const updateValues = [];
          
          if (school !== undefined) {
            updateFields.push('school = ?');
            updateValues.push(school);
          }
          if (grade !== undefined) {
            updateFields.push('grade = ?');
            updateValues.push(grade);
          }
          if (diagnostic_memo !== undefined) {
            updateFields.push('diagnostic_memo = ?');
            updateValues.push(diagnostic_memo);
          }
          
          if (updateFields.length > 0) {
            updateValues.push(studentId);
            const updateQuery = `UPDATE students SET ${updateFields.join(', ')} WHERE user_id = ?`;
            console.log('📝 UPDATE 쿼리:', updateQuery);
            console.log('📝 VALUES:', updateValues);
            
            const result = await env.DB.prepare(updateQuery).bind(...updateValues).run();
            
            console.log('✅ students 테이블 업데이트 성공:', result);
            updated = true;  // ← 이 줄 추가!
          }
        } else {
          // 삽입
          console.log('⚠️ students 레코드 없음 - 새로 생성');
          console.log('📝 INSERT VALUES:', { studentId, school, grade });
          
          const insertResult = await env.DB.prepare(`
            INSERT INTO students (user_id, school, grade, status, created_at)
            VALUES (?, ?, ?, 'ACTIVE', datetime('now'))
          `).bind(studentId, school || null, grade || null).run();
          
          console.log('✅ students 테이블 삽입 성공:', insertResult);
          updated = true;  // ← 이 줄 추가!
        }
      } catch (e: any) {
        console.error('❌ students 테이블 업데이트 실패:', e.message);
        console.error('❌ Stack:', e.stack);
        // 에러를 반환하지 않고 계속 진행
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
          await env.DB.prepare(`
            INSERT INTO ClassStudent (studentId, classId, enrolledAt)
            VALUES (?, ?, datetime('now'))
          `).bind(studentId, classId).run();
        }
        
        console.log('✅ 반 정보 업데이트 성공');
        updated = true;  // ← 이 줄 추가!
      } catch (e) {
        console.log('⚠️ 반 정보 업데이트 실패 (무시):', e);
      }
    }

    if (!updated) {
      return Response.json({ 
        success: false, 
        error: "업데이트 실패" 
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
