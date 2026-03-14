// Debug: Check Current Sender Number Requests
// GET /api/debug/list-sender-requests

export async function onRequest(context: { request: Request; env: any }) {
  const { env } = context;
  
  try {
    const db = env.DB;
    
    // 최근 10개 신청 조회
    const requests = await db
      .prepare('SELECT * FROM sender_number_requests ORDER BY createdAt DESC LIMIT 10')
      .all();
    
    console.log('📋 총 신청 수:', requests.results?.length || 0);
    
    const detailedResults = requests.results?.map((req: any) => {
      return {
        id: req.id,
        userId: req.userId,
        userName: req.userName,
        companyName: req.companyName,
        senderNumbers: req.senderNumbers,
        status: req.status,
        files: {
          telecom: req.telecomCertificateUrl,
          business: req.businessRegistrationUrl,
          service: req.serviceAgreementUrl,
          privacy: req.privacyAgreementUrl
        },
        createdAt: req.createdAt,
        approvedAt: req.approvedAt
      };
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        count: detailedResults?.length || 0,
        requests: detailedResults
      }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error('❌ 오류:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
