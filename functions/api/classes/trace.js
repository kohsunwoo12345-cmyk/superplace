// 실시간 클래스 생성/조회 추적 API
// 모든 단계를 상세히 로깅하고 문제를 정확히 파악

function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length < 3) {
    return null;
  }
  
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2]
  };
}

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    if (!db) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const report = {
      timestamp: new Date().toISOString(),
      step1_userLookup: {},
      step2_allClasses: {},
      step3_filtering: {},
      step4_finalResult: {},
      debug: {}
    };

    // STEP 1: 사용자 조회
    console.log('==== STEP 1: USER LOOKUP ====');
    let user = await db.prepare('SELECT * FROM User WHERE email = ?').bind(tokenData.email).first();
    
    if (!user) {
      user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(tokenData.email).first();
    }

    report.step1_userLookup = {
      found: !!user,
      email: tokenData.email,
      table: user ? (await db.prepare('SELECT * FROM User WHERE email = ?').bind(tokenData.email).first() ? 'User' : 'users') : null,
      role: user?.role,
      academyId: user?.academyId || user?.academy_id,
      fullData: user
    };

    if (!user) {
      report.error = 'User not found';
      return new Response(JSON.stringify(report, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userAcademyId = user.academyId || user.academy_id;
    const userRole = user.role?.toUpperCase();

    // STEP 2: 모든 클래스 조회
    console.log('==== STEP 2: ALL CLASSES ====');
    const allClassesQuery = await db.prepare(`
      SELECT 
        c.*,
        u.name as teacher_name,
        a.name as academy_name
      FROM classes c
      LEFT JOIN User u ON c.teacher_id = u.id
      LEFT JOIN Academy a ON c.academy_id = a.id
      ORDER BY c.created_at DESC
    `).all();

    const allClasses = allClassesQuery.results || [];
    
    report.step2_allClasses = {
      total: allClasses.length,
      classes: allClasses.map(cls => ({
        id: cls.id,
        name: cls.class_name,
        academy_id: cls.academy_id,
        academy_id_type: typeof cls.academy_id,
        created_at: cls.created_at,
        teacher_id: cls.teacher_id,
        academy_name: cls.academy_name
      }))
    };

    // STEP 3: 필터링 로직
    console.log('==== STEP 3: FILTERING ====');
    let matchedClasses = [];
    
    if (userRole === 'SUPER_ADMIN') {
      matchedClasses = allClasses;
      report.step3_filtering = {
        method: 'SUPER_ADMIN - no filtering',
        matched: allClasses.length
      };
    } else if (userRole === 'ADMIN' || userRole === 'DIRECTOR' || userRole === 'TEACHER') {
      if (!userAcademyId) {
        report.step3_filtering = {
          error: 'No academyId assigned to user',
          userAcademyId: null
        };
      } else {
        const filterDetails = [];
        
        matchedClasses = allClasses.filter(cls => {
          const clsAcademyId = cls.academy_id;
          
          // 모든 비교 방법 시도
          const stringMatch = String(clsAcademyId) === String(userAcademyId);
          const looseMatch = clsAcademyId == userAcademyId;
          const strictMatch = clsAcademyId === userAcademyId;
          
          const matched = stringMatch || looseMatch || strictMatch;
          
          filterDetails.push({
            classId: cls.id,
            className: cls.class_name,
            class_academy_id: clsAcademyId,
            class_academy_id_type: typeof clsAcademyId,
            user_academyId: userAcademyId,
            user_academyId_type: typeof userAcademyId,
            stringMatch,
            looseMatch,
            strictMatch,
            finalMatch: matched
          });
          
          return matched;
        });
        
        report.step3_filtering = {
          method: `${userRole} - academy filtering`,
          userAcademyId,
          userAcademyIdType: typeof userAcademyId,
          totalClasses: allClasses.length,
          matchedClasses: matchedClasses.length,
          filterDetails
        };
      }
    } else if (userRole === 'STUDENT') {
      // 학생은 등록된 클래스만
      const enrolledQuery = await db.prepare(`
        SELECT DISTINCT c.*, u.name as teacher_name, a.name as academy_name
        FROM classes c
        INNER JOIN class_students cs ON c.id = cs.classId
        LEFT JOIN User u ON c.teacher_id = u.id
        LEFT JOIN Academy a ON c.academy_id = a.id
        WHERE cs.studentId = ?
        ORDER BY c.created_at DESC
      `).bind(user.id).all();
      
      matchedClasses = enrolledQuery.results || [];
      report.step3_filtering = {
        method: 'STUDENT - enrolled classes only',
        userId: user.id,
        matched: matchedClasses.length
      };
    }

    // STEP 4: 최종 결과
    report.step4_finalResult = {
      success: true,
      count: matchedClasses.length,
      classes: matchedClasses.map(cls => ({
        id: cls.id,
        name: cls.class_name,
        grade: cls.grade,
        academyId: cls.academy_id,
        teacherId: cls.teacher_id,
        color: cls.color,
        createdAt: cls.created_at,
        teacherName: cls.teacher_name,
        academyName: cls.academy_name
      }))
    };

    // 디버그 정보
    report.debug = {
      allClassesAcademyIds: [...new Set(allClasses.map(c => c.academy_id))],
      userAcademyId,
      typeComparison: {
        userAcademyIdType: typeof userAcademyId,
        classAcademyIdTypes: [...new Set(allClasses.map(c => typeof c.academy_id))]
      }
    };

    return new Response(JSON.stringify(report, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Trace error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
