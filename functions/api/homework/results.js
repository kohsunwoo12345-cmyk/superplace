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

    // academyId 필터 (관리자가 아닌 경우)
    let academyFilter = '';
    if (!isAdmin && academyId && (role === 'DIRECTOR' || role === 'TEACHER')) {
      academyFilter = `AND (CAST(u1.academyId AS TEXT) = '${academyId}' OR CAST(u2.academyId AS TEXT) = '${academyId}')`;
      console.log('🔒 학원 필터 적용:', academyFilter);
    }

    // userId 필터 (특정 학생의 숙제만 조회) - TEXT 타입으로 비교
    let userFilter = '';
    if (userId) {
      userFilter = `AND hs.userId = '${userId}'`;
      console.log('👤 학생 필터 적용:', userFilter);
    }

    // 숙제 제출 결과 조회 - gradingResult JSON 사용
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
        hs.gradingResult,
        hs.gradedAt
      FROM homework_submissions_v2 hs
      LEFT JOIN User u1 ON u1.id = hs.userId
      LEFT JOIN users u2 ON u2.id = hs.userId
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

    // 각 제출에 대한 이미지 조회 (배치 처리)
    const submissionIds = results.map(r => r.submissionId);
    const imagesMap = {};
    
    if (submissionIds.length > 0) {
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
          
          for (const img of imagesResult.results || []) {
            if (!imagesMap[img.submissionId]) {
              imagesMap[img.submissionId] = [];
            }
            imagesMap[img.submissionId].push(img.imageData);
          }
        } catch (imgError) {
          console.error(`❌ 이미지 조회 실패:`, imgError.message);
        }
      }
      
      console.log(`✅ 이미지 조회 완료: ${Object.keys(imagesMap).length}개 제출`);
    }

    // gradingResult JSON 파싱 및 통계 계산
    let gradedCount = 0;
    let totalScore = 0;

    const formattedResults = results.map(r => {
      let gradingData = null;
      
      // gradingResult JSON 파싱
      if (r.gradingResult && r.status === 'graded') {
        try {
          const parsed = JSON.parse(r.gradingResult);
          
          // Worker에서 반환하는 형식: [{subject, grading: {...}}]
          if (Array.isArray(parsed) && parsed.length > 0) {
            const firstResult = parsed[0];
            const grading = firstResult.grading || {};
            
            // 점수 계산
            const totalQuestions = grading.totalQuestions || 0;
            const correctAnswers = grading.correctAnswers || 0;
            const score = totalQuestions > 0 
              ? Math.round((correctAnswers / totalQuestions) * 100) 
              : 0;
            
            gradingData = {
              score: score,
              subject: firstResult.subject || 'other',
              totalQuestions: totalQuestions,
              correctAnswers: correctAnswers,
              feedback: grading.overallFeedback || '',
              strengths: grading.strengths || '',
              improvements: grading.improvements || '',
              detailedResults: grading.detailedResults || [],
              weaknessTypes: grading.weaknessTypes || [],
              studyDirection: grading.studyDirection || '',
              gradedAt: r.gradedAt || null
            };
            
            // 통계용
            gradedCount++;
            totalScore += score;
          }
        } catch (parseError) {
          console.error(`❌ gradingResult 파싱 실패 (${r.submissionId}):`, parseError.message);
        }
      }

      return {
        submission: {
          id: r.submissionId,
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
          imageCount: (imagesMap[r.submissionId] || []).length
        },
        grading: gradingData
      };
    });

    const avgScore = gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0;

    return Response.json({
      success: true,
      statistics: {
        total: results.length,
        graded: gradedCount,
        pending: results.length - gradedCount,
        averageScore: avgScore
      },
      results: formattedResults
    }, { status: 200 });

  } catch (error) {
    console.error('❌ 숙제 결과 조회 에러:', error);
    return Response.json({ 
      success: false, 
      error: "서버 오류가 발생했습니다",
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
