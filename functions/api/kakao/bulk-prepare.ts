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
        // 1. 학생 정보 조회 (uniqueEmail 사용)
        const studentQuery = `
          SELECT 
            s.id,
            s.uniqueEmail,
            u.name AS studentName,
            s.parentPhone,
            s.academyId
          FROM students s
          LEFT JOIN users u ON s.userId = u.id
          WHERE s.uniqueEmail = ? 
            AND s.status = 'ACTIVE'
            ${academyId ? 'AND s.academyId = ?' : ''}
          LIMIT 1
        `;

        const studentParams = academyId ? [studentEmail, academyId] : [studentEmail];
        const student = await db.prepare(studentQuery).bind(...studentParams).first();

        if (!student) {
          enrichedRecipients.push({
            ...recipient,
            status: 'NOT_FOUND',
            error: '해당 이메일의 학생을 찾을 수 없습니다.'
          });
          continue;
        }

        // 2. 가장 최근 리포트(랜딩페이지) 조회
        const reportQuery = `
          SELECT 
            id,
            landingPageId,
            landingPageUrl,
            title,
            createdAt
          FROM student_reports
          WHERE studentId = ? 
            AND isActive = 1
          ORDER BY createdAt DESC
          LIMIT 1
        `;

        const report = await db.prepare(reportQuery).bind(student.id).first();

        if (!report) {
          enrichedRecipients.push({
            ...recipient,
            studentId: student.id,
            studentName: student.studentName,
            status: 'NO_REPORT',
            error: '해당 학생의 리포트가 없습니다.'
          });
          continue;
        }

        // 3. 학생 ID를 포함한 고유 URL 생성
        const uniqueUrl = `${report.landingPageUrl}${report.landingPageUrl.includes('?') ? '&' : '?'}studentId=${student.id}&ref=${Date.now()}`;

        // 4. 성공적으로 매칭된 수신자 정보
        enrichedRecipients.push({
          studentId: student.id,
          studentEmail: student.uniqueEmail,
          studentName: student.studentName,
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
