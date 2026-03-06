// Kakao Alimtalk Bulk Send Preparation API
// 엑셀 업로드 시 학생 이메일로 최신 랜딩페이지 URL 자동 매칭

export async function onRequest(context: any) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { recipients, academyId } = await request.json();

    if (!recipients || !Array.isArray(recipients)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Recipients array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const db = env.DB;
    const enrichedRecipients = [];

    // 각 수신자에 대해 학생 정보 및 최신 리포트 조회
    for (const recipient of recipients) {
      const { studentEmail, parentName, parentPhone } = recipient;

      if (!studentEmail || !parentPhone) {
        // 학생 이메일 또는 학부모 전화번호가 없는 경우 스킵
        enrichedRecipients.push({
          ...recipient,
          status: 'MISSING_INFO',
          error: '학생 이메일 또는 학부모 전화번호가 누락되었습니다.'
        });
        continue;
      }

      try {
        // 1. 사용자(학생) 정보 조회 - 역할 상관없이 이메일로 조회
        const userQuery = `
          SELECT 
            u.id AS userId,
            u.email,
            u.name,
            u.phone,
            u.academyId
          FROM users u
          WHERE u.email = ?
          LIMIT 1
        `;

        const user = await db.prepare(userQuery).bind(studentEmail).first();

        if (!user) {
          enrichedRecipients.push({
            ...recipient,
            status: 'NOT_FOUND',
            error: '해당 이메일의 학생을 찾을 수 없습니다.'
          });
          continue;
        }

        // 2. 가장 최근 랜딩페이지 조회
        const reportQuery = `
          SELECT *
          FROM landing_pages
          WHERE userId = ?
          ORDER BY id DESC
          LIMIT 1
        `;

        const report = await db.prepare(reportQuery).bind(user.userId).first();

        if (!report) {
          enrichedRecipients.push({
            ...recipient,
            studentId: user.userId,
            studentName: user.name,
            status: 'NO_REPORT',
            error: '해당 학생의 리포트가 없습니다.'
          });
          continue;
        }

        // 3. 랜딩페이지 URL 생성
        const landingPageUrl = `https://superplacestudy.pages.dev/landing/${report.id}`;
        
        // 4. 학생 ID를 포함한 고유 URL 생성
        const uniqueUrl = `${landingPageUrl}?studentId=${user.userId}&ref=${Date.now()}`;

        // 5. 성공적으로 매칭된 수신자 정보
        enrichedRecipients.push({
          studentId: user.userId,
          studentEmail: user.email,
          studentName: user.name,
          parentName: parentName || '학부모',
          parentPhone: parentPhone.replace(/[^0-9]/g, ''),
          landingPageUrl: uniqueUrl,
          reportId: report.id,
          reportTitle: report.title,
          reportCreatedAt: report.createdAt,
          status: 'READY'
        });

      } catch (err: any) {
        console.error('Error processing recipient:', err);
        enrichedRecipients.push({
          ...recipient,
          status: 'ERROR',
          error: err.message
        });
      }
    }

    // 통계 계산
    const stats = {
      total: recipients.length,
      ready: enrichedRecipients.filter(r => r.status === 'READY').length,
      notFound: enrichedRecipients.filter(r => r.status === 'NOT_FOUND').length,
      noReport: enrichedRecipients.filter(r => r.status === 'NO_REPORT').length,
      missingInfo: enrichedRecipients.filter(r => r.status === 'MISSING_INFO').length,
      error: enrichedRecipients.filter(r => r.status === 'ERROR').length
    };

    return new Response(
      JSON.stringify({
        success: true,
        recipients: enrichedRecipients,
        stats
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Bulk prepare error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to prepare bulk send'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
