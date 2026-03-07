// Sender Number Registration API
// POST /api/sender-number/register

interface Env {
  DB: D1Database;
  SENDER_NUMBER_BUCKET: R2Bucket;
}

// 토큰 파싱 함수
function parseToken(authHeader: string | null): { id: string; email: string; role: string } | null {
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

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tokenData = parseToken(authHeader);
    if (!tokenData) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = env.DB;

    // 사용자 정보 조회
    const user = await db
      .prepare('SELECT id, email, role, name FROM users WHERE email = ?')
      .bind(tokenData.email)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // FormData 파싱
    const formData = await request.formData();
    
    const companyName = formData.get('companyName') as string;
    const businessNumber = formData.get('businessNumber') as string;
    const address = formData.get('address') as string;
    const senderNumbers = formData.get('senderNumbers') as string;
    const representativeName = formData.get('representativeName') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;

    // 파일들
    const telecomCertificate = formData.get('telecomCertificate') as File;
    const businessRegistration = formData.get('businessRegistration') as File;
    const serviceAgreement = formData.get('serviceAgreement') as File;
    const privacyAgreement = formData.get('privacyAgreement') as File;

    if (!companyName || !businessNumber || !senderNumbers) {
      return new Response(
        JSON.stringify({ error: "필수 항목이 누락되었습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!telecomCertificate || !businessRegistration || !serviceAgreement || !privacyAgreement) {
      return new Response(
        JSON.stringify({ error: "4개의 필수 서류를 모두 첨부해주세요." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // R2에 파일 업로드 (또는 임시로 DB에 저장)
    const requestId = `snr_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // 파일을 Blob으로 저장 (간단한 방법)
    const fileUrls: any = {};
    
    // R2 버킷이 있으면 업로드, 없으면 임시 URL 생성
    if (env.SENDER_NUMBER_BUCKET) {
      try {
        // 파일 업로드 로직
        const uploadFile = async (file: File, key: string) => {
          const arrayBuffer = await file.arrayBuffer();
          await env.SENDER_NUMBER_BUCKET.put(key, arrayBuffer, {
            httpMetadata: {
              contentType: file.type,
            },
          });
          return `/api/files/sender-number/${key}`;
        };

        fileUrls.telecomCertificate = await uploadFile(telecomCertificate, `${requestId}_telecom.${telecomCertificate.name.split('.').pop()}`);
        fileUrls.businessRegistration = await uploadFile(businessRegistration, `${requestId}_business.${businessRegistration.name.split('.').pop()}`);
        fileUrls.serviceAgreement = await uploadFile(serviceAgreement, `${requestId}_service.${serviceAgreement.name.split('.').pop()}`);
        fileUrls.privacyAgreement = await uploadFile(privacyAgreement, `${requestId}_privacy.${privacyAgreement.name.split('.').pop()}`);
      } catch (uploadError) {
        console.error('파일 업로드 실패:', uploadError);
        // R2 실패 시 대체 방법 사용
        fileUrls.telecomCertificate = `placeholder_${requestId}_telecom`;
        fileUrls.businessRegistration = `placeholder_${requestId}_business`;
        fileUrls.serviceAgreement = `placeholder_${requestId}_service`;
        fileUrls.privacyAgreement = `placeholder_${requestId}_privacy`;
      }
    } else {
      // R2 버킷이 없을 때 임시 처리
      fileUrls.telecomCertificate = `placeholder_${requestId}_telecom`;
      fileUrls.businessRegistration = `placeholder_${requestId}_business`;
      fileUrls.serviceAgreement = `placeholder_${requestId}_service`;
      fileUrls.privacyAgreement = `placeholder_${requestId}_privacy`;
    }

    // DB에 신청 정보 저장
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO sender_number_requests (
        id, userId, userName, companyName, businessNumber, address,
        senderNumbers, representativeName, phone, email,
        telecomCertificateUrl, businessRegistrationUrl,
        serviceAgreementUrl, privacyAgreementUrl,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `).bind(
      requestId,
      user.id,
      user.name || user.email,
      companyName,
      businessNumber,
      address || '',
      senderNumbers,
      representativeName || '',
      phone || '',
      email || '',
      fileUrls.telecomCertificate,
      fileUrls.businessRegistration,
      fileUrls.serviceAgreement,
      fileUrls.privacyAgreement,
      now,
      now
    ).run();

    console.log('✅ 발신번호 등록 신청 완료:', requestId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "발신번호 등록 신청이 완료되었습니다.",
        requestId: requestId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("발신번호 등록 신청 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "발신번호 등록 신청 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
