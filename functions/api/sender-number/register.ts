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

    // 사용자 정보 조회 (User 테이블 먼저, 없으면 users 테이블)
    let user = await db
      .prepare('SELECT id, email, role, name FROM User WHERE email = ?')
      .bind(tokenData.email)
      .first();

    if (!user) {
      user = await db
        .prepare('SELECT id, email, role, name FROM users WHERE email = ?')
        .bind(tokenData.email)
        .first();
    }

    if (!user) {
      console.error('❌ User not found:', tokenData.email);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    console.log('✅ User found:', user.email);

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

    const requestId = `snr_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    console.log('📤 파일 업로드 시작...', {
      telecom: `${telecomCertificate?.name} (${Math.round(telecomCertificate.size / 1024)}KB)`,
      business: `${businessRegistration?.name} (${Math.round(businessRegistration.size / 1024)}KB)`,
      service: `${serviceAgreement?.name} (${Math.round(serviceAgreement.size / 1024)}KB)`,
      privacy: `${privacyAgreement?.name} (${Math.round(privacyAgreement.size / 1024)}KB)`,
    });

    // R2에 파일 업로드하는 함수
    const uploadToR2 = async (file: File, key: string): Promise<string> => {
      const arrayBuffer = await file.arrayBuffer();
      
      // R2 버킷이 설정되어 있으면 업로드
      if (env.SENDER_NUMBER_BUCKET) {
        await env.SENDER_NUMBER_BUCKET.put(key, arrayBuffer, {
          httpMetadata: {
            contentType: file.type,
          },
        });
        console.log(`✅ R2 업로드 성공: ${key}`);
        return `/api/files/sender-number/${key}`;
      } else {
        // R2 버킷이 없으면 placeholder 반환
        console.warn('⚠️ R2 버킷이 설정되지 않음, placeholder 사용');
        return `placeholder_${requestId}_${key}`;
      }
    };

    // 각 파일을 R2에 업로드
    const fileUrls: any = {};
    try {
      // 실제 MIME 타입에서 확장자 추출 (파일명이 아닌 실제 타입 기반)
      const getExtensionFromMimeType = (file: File): string => {
        const mimeType = file.type.toLowerCase();
        
        // 이미지 파일
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
        if (mimeType.includes('png')) return 'png';
        if (mimeType.includes('gif')) return 'gif';
        if (mimeType.includes('webp')) return 'webp';
        
        // 문서 파일
        if (mimeType.includes('pdf')) return 'pdf';
        if (mimeType.includes('msword') || mimeType.includes('wordprocessingml')) return 'docx';
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'xlsx';
        
        // 기본값: 파일명에서 추출 시도
        const fileNameExt = file.name.split('.').pop()?.toLowerCase();
        if (fileNameExt && ['jpg', 'jpeg', 'png', 'pdf', 'gif', 'webp', 'docx', 'xlsx'].includes(fileNameExt)) {
          return fileNameExt;
        }
        
        // 그래도 없으면 jpg 기본값 (대부분 이미지일 가능성)
        return 'jpg';
      };
      
      const telecomExt = getExtensionFromMimeType(telecomCertificate);
      const businessExt = getExtensionFromMimeType(businessRegistration);
      const serviceExt = getExtensionFromMimeType(serviceAgreement);
      const privacyExt = getExtensionFromMimeType(privacyAgreement);
      
      console.log('📝 파일 확장자 감지:', {
        telecom: `${telecomCertificate.name} → .${telecomExt} (${telecomCertificate.type})`,
        business: `${businessRegistration.name} → .${businessExt} (${businessRegistration.type})`,
        service: `${serviceAgreement.name} → .${serviceExt} (${serviceAgreement.type})`,
        privacy: `${privacyAgreement.name} → .${privacyExt} (${privacyAgreement.type})`
      });
      
      fileUrls.telecomCertificate = await uploadToR2(
        telecomCertificate,
        `${requestId}/telecom.${telecomExt}`
      );
      
      fileUrls.businessRegistration = await uploadToR2(
        businessRegistration,
        `${requestId}/business.${businessExt}`
      );
      
      fileUrls.serviceAgreement = await uploadToR2(
        serviceAgreement,
        `${requestId}/service.${serviceExt}`
      );
      
      fileUrls.privacyAgreement = await uploadToR2(
        privacyAgreement,
        `${requestId}/privacy.${privacyExt}`
      );
      
      console.log('✅ 모든 파일 업로드 완료');
    } catch (error) {
      console.error('❌ 파일 업로드 실패:', error);
      return new Response(
        JSON.stringify({ error: "파일 업로드 중 오류가 발생했습니다." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
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
