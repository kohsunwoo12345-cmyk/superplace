// 숙제 제출 결과 조회 API
// GET /api/homework/results

// 인라인 토큰 디코딩 함수
function decodeToken(token) {
  try {
    let parts = token.split('|');
    if (parts.length === 5) {
      const [userId, email, role, academyId, timestamp] = parts;
      const tokenTime = parseInt(timestamp);
      if (Date.now() - tokenTime > 24 * 60 * 60 * 1000) throw new Error('Token expired');
      return { userId, id: userId, email, role, academyId: academyId || null, timestamp: tokenTime };
    }
    if (parts.length === 4) {
      const [userId, email, role, timestamp] = parts;
      const tokenTime = parseInt(timestamp);
      if (Date.now() - tokenTime > 24 * 60 * 60 * 1000) throw new Error('Token expired');
      return { userId, id: userId, email, role, academyId: null, timestamp: tokenTime };
    }
    throw new Error('Invalid token format');
  } catch (error) {
    return null;
  }
}

function getUserFromAuth(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return decodeToken(authHeader.substring(7));
}

export async function onRequestGet(context) {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    
    if (!DB) {
      return Response.json({ 
        success: false, 
        error: "Database not configured" 
      }, { status: 500 });
    }

    // 인증 확인
    const userPayload = getUserFromAuth(context.request);
    
    if (!userPayload) {
      return Response.json({ 
        success: false, 
        error: "인증이 필요합니다" 
      }, { status: 401 });
    }

    const date = url.searchParams.get('date');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const userId = url.searchParams.get('userId'); // 특정 학생 필터
    const role = userPayload.role?.toUpperCase();
    const academyId = userPayload.academyId;

    console.log('📊 숙제 결과 조회:', { date, startDate, endDate, userId, role, academyId });

    // 관리자 여부 확인
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    // 날짜 필터 조건 생성
    let dateFilter = '';
    if (date) {
      dateFilter = `AND SUBSTR(hs.submittedAt, 1, 10) = '${date}'`;
    } else if (startDate && endDate) {
      dateFilter = `AND SUBSTR(hs.submittedAt, 1, 10) BETWEEN '${startDate}' AND '${endDate}'`;
    } else {
      // 기본값: 오늘 (한국 시간)
      const now = new Date();
      const kstOffset = 9 * 60;
      const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
      const today = kstDate.toISOString().split('T')[0];
      console.log('🇰🇷 한국 시간 기준 오늘:', today);
      dateFilter = `AND SUBSTR(hs.submittedAt, 1, 10) = '${today}'`;
    }

    // academyId 필터 (관리자가 아닌 경우) - DIRECTOR와 TEACHER는 자신의 학원 학생만 조회
    let academyFilter = '';
    if (!isAdmin && academyId && (role === 'DIRECTOR' || role === 'TEACHER')) {
      // TEXT 타입과 INTEGER 타입 모두 비교
      academyFilter = `AND (CAST(u1.academyId AS TEXT) = '${academyId}' OR CAST(u2.academyId AS TEXT) = '${academyId}' OR u1.academyId = '${academyId}' OR u2.academyId = '${academyId}')`;
      console.log('🔒 학원 필터 적용:', academyFilter);
    }

    // userId 필터 (특정 학생의 숙제만 조회)
    let userFilter = '';
    if (userId) {
      userFilter = `AND hs.userId = ${parseInt(userId)}`;
      console.log('👤 학생 필터 적용:', userFilter);
    }

    // 숙제 제출 및 채점 결과 조회 - User와 users 테이블 모두 조회
    // 최소 컬럼만 조회 (gradingResult, gradedAt은 제외 - 테이블에 없을 수 있음)
    const query = `
      SELECT 
        hs.id as submissionId,
        hs.userId,
        COALESCE(u1.name, u2.name) as userName,
        COALESCE(u1.email, u2.email) as userEmail,
        COALESCE(u1.academyId, CAST(u2.academyId AS TEXT)) as academyId,
        COALESCE(u1.grade, u2.grade) as grade,
        hs.submittedAt,
        hs.code,
        hs.imageUrl,
        hs.status,
        hg.id as gradingId,
        hg.score,
        hg.subject,
        hg.totalQuestions,
        hg.correctAnswers
      FROM homework_submissions_v2 hs
      LEFT JOIN User u1 ON u1.id = hs.userId
      LEFT JOIN users u2 ON u2.id = hs.userId
      LEFT JOIN homework_gradings_v2 hg ON hg.submissionId = hs.id
      WHERE 1=1
        ${dateFilter}
        ${academyFilter}
        ${userFilter}
      ORDER BY hs.submittedAt DESC
    `;

    console.log('🔍 실행할 쿼리:', query);

    const result = await DB.prepare(query).all();
    const results = result.results || [];

    console.log(`✅ 조회 결과: ${results.length}건`);

    // 각 제출에 대한 이미지 조회 (배치 처리로 SQL 변수 제한 회피)
    const submissionIds = results.map(r => r.submissionId);
    const imagesMap = {};
    
    if (submissionIds.length > 0) {
      // SQLite는 최대 999개의 변수만 지원하므로 배치 처리
      const BATCH_SIZE = 500;
      const batches = [];
      for (let i = 0; i < submissionIds.length; i += BATCH_SIZE) {
        batches.push(submissionIds.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`📷 이미지 조회 시작: ${batches.length}개 배치, 총 ${submissionIds.length}개 제출`);
      
      for (const batch of batches) {
        const placeholders = batch.map(() => '?').join(',');
        const imagesQuery = `
          SELECT submissionId, imageData, imageIndex
          FROM homework_images
          WHERE submissionId IN (${placeholders})
          ORDER BY submissionId, imageIndex
        `;
        
        try {
          const imagesResult = await DB.prepare(imagesQuery).bind(...batch).all();
          
          // submissionId별로 이미지 그룹화
          for (const img of imagesResult.results || []) {
            if (!imagesMap[img.submissionId]) {
              imagesMap[img.submissionId] = [];
            }
            imagesMap[img.submissionId].push(img.imageData);
          }
        } catch (imgError) {
          console.error(`❌ 이미지 조회 실패 (배치):`, imgError.message);
          // 이미지 조회 실패는 무시하고 계속 진행
        }
      }
      
      console.log(`✅ 이미지 조회 완료: ${Object.keys(imagesMap).length}개 제출에 대한 이미지`);
    }

    // 통계 계산
    const totalSubmissions = results.length;
    const gradedCount = results.filter(r => r.gradingId).length;
    const normalizeScore = (s) => {
      if (s === null || s === undefined) return 0;
      if (s > 0 && s <= 1) return Math.round(s * 100);
      return Math.round(s);
    };
    const avgScore = gradedCount > 0
      ? Math.round(results.reduce((sum, r) => sum + normalizeScore(r.score), 0) / gradedCount)
      : 0;

    // 결과 포맷팅 - homework_gradings_v2 데이터만 사용
    const formattedResults = results.map(r => {
      // homework_gradings_v2 데이터 사용 (없으면 null)
      const gradingData = r.gradingId ? {
        id: r.gradingId,
        score: (function(s) {
          if (s === null || s === undefined) return 0;
          if (s > 0 && s <= 1) return Math.round(s * 100);
          return Math.round(s);
        })(r.score),
        subject: r.subject || 'other',
        totalQuestions: r.totalQuestions || 0,
        correctAnswers: r.correctAnswers || 0,
        feedback: '', // homework_gradings_v2에서 가져올 예정
        strengths: '',
        improvements: '',
        problemAnalysis: [],
        weaknessTypes: [],
        detailedResults: [],
        studyDirection: '',
        gradedAt: null
      } : null;

      return {
        submissionId: r.submissionId,
        userId: r.userId,
        userName: r.userName,
        userEmail: r.userEmail,
        academyId: r.academyId,
        grade: r.grade,
        submittedAt: r.submittedAt,
        code: r.code,
        imageUrl: r.imageUrl,
        status: r.status || 'pending',
        images: imagesMap[r.submissionId] || [],
        imageCount: (imagesMap[r.submissionId] || []).length,
        grading: gradingData
      };
    });

    return Response.json({
      success: true,
      statistics: {
        total: totalSubmissions,
        graded: gradedCount,
        pending: totalSubmissions - gradedCount,
        averageScore: avgScore
      },
      results: formattedResults
    }, { status: 200 });

  } catch (error) {
    console.error('❌ 숙제 결과 조회 에러:', error);
    return Response.json({ 
      success: false, 
      error: "서버 오류가 발생했습니다",
      message: error.message 
    }, { status: 500 });
  }
}
