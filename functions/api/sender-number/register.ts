// Sender Number Registration API
// POST /api/sender-number/register

interface Env {
  DB: D1Database;
  SENDER_NUMBER_BUCKET: R2Bucket;
}

// 토큰 파싱 함수 (3개 또는 5개 파트 지원)
function parseToken(authHeader: string | null): { id: string; email: string; role: string; academyId?: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length < 3) {
    return null;
  }
  
  // 3개 파트 토큰: ID|email|role
  // 5개 파트 토큰: ID|email|role|academyId|timestamp (신규 로그인)
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2],
    academyId: parts.length >= 4 ? parts[3] : undefined
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

    console.log('🔍 발신번호 신청 - 사용자 조회 시작:', {
      id: tokenData.id,
      email: tokenData.email,
      role: tokenData.role,
      academyId: tokenData.academyId
    });

    // 사용자 정보 조회 - email 기반 (가장 확실한 방법)
    let user = await db
      .prepare('SELECT id, email, role, name, academyId FROM users WHERE email = ?')
      .bind(tokenData.email)
      .first();

    console.log('📊 users 테이블 조회 결과 (email):', user);

    // email로 못 찾으면 id로 시도
    if (!user) {
      console.log('⚠️ email로 못 찾음, id로 재시도:', tokenData.id);
      user = await db
        .prepare('SELECT id, email, role, name, academyId FROM users WHERE id = ?')
        .bind(tokenData.id)
        .first();
      console.log('📊 users 테이블 조회 결과 (id):', user);
    }

    if (!user) {
      console.error('❌ User not found in DB:', {
        email: tokenData.email,
        id: tokenData.id,
        role: tokenData.role
      });
      return new Response(JSON.stringify({ 
        error: "User not found",
        details: "사용자 정보를 데이터베이스에서 찾을 수 없습니다. 로그아웃 후 다시 로그인 해주세요.",
        debugInfo: {
          tokenEmail: tokenData.email,
          tokenId: tokenData.id,
          timestamp: new Date().toISOString()
        }
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    console.log('✅ User found:', { id: user.id, email: user.email, role: user.role });

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

    // 파일 내용에서 실제 타입 감지 (매직 넘버 기반)
    const detectFileTypeFromContent = (buffer: ArrayBuffer): string => {
      const arr = new Uint8Array(buffer).slice(0, 4);
      const header = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join(' ').toUpperCase();
      
      // JPEG: FF D8 FF
      if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
        return 'image/jpeg';
      }
      
      // PNG: 89 50 4E 47
      if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
        return 'image/png';
      }
      
      // PDF: 25 50 44 46 (%PDF)
      if (arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46) {
        return 'application/pdf';
      }
      
      // GIF: 47 49 46 38
      if (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x38) {
        return 'image/gif';
      }
      
      console.warn(`⚠️ 알 수 없는 파일 타입, 헤더: ${header}`);
      return 'application/octet-stream';
    };
    
    // R2에 파일 업로드하는 함수
    const uploadToR2 = async (file: File, key: string): Promise<string> => {
      const arrayBuffer = await file.arrayBuffer();
      
      // 파일 내용에서 실제 MIME 타입 감지
      const actualContentType = detectFileTypeFromContent(arrayBuffer);
      console.log(`🔍 파일 타입 감지: ${file.name} → ${actualContentType} (브라우저: ${file.type})`);
      
      // R2 버킷이 설정되어 있으면 업로드
      if (env.SENDER_NUMBER_BUCKET) {
        await env.SENDER_NUMBER_BUCKET.put(key, arrayBuffer, {
          httpMetadata: {
            contentType: actualContentType, // 실제 감지된 타입 사용
          },
        });
        console.log(`✅ R2 업로드 성공: ${key} (${actualContentType})`);
        return `/api/files/sender-number/${key}`;
      } else {
        // R2 버킷이 없으면 placeholder 반환
        console.warn('⚠️ R2 버킷이 설정되지 않음, placeholder 사용');
        return `placeholder_${requestId}_${key}`;
      }
    };

    // 파일 내용에서 확장자 추출 (매직 넘버 기반)
    const getExtensionFromContent = async (file: File): Promise<string> => {
      const buffer = await file.arrayBuffer();
      const arr = new Uint8Array(buffer).slice(0, 4);
      
      // 매직 넘버로 실제 파일 타입 확인
      if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
        return 'jpg'; // JPEG
      }
      if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
        return 'png'; // PNG
      }
      if (arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46) {
        return 'pdf'; // PDF
      }
      if (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x38) {
        return 'gif'; // GIF
      }
      
      // fallback: 파일명에서 추출
      const fileNameExt = file.name.split('.').pop()?.toLowerCase();
      if (fileNameExt && ['jpg', 'jpeg', 'png', 'pdf', 'gif', 'webp'].includes(fileNameExt)) {
        return fileNameExt;
      }
      
      return 'bin'; // 알 수 없는 파일
    };
    
    // 각 파일을 R2에 업로드
    const fileUrls: any = {};
    try {
      // 파일 내용 기반으로 확장자 감지
      const telecomExt = await getExtensionFromContent(telecomCertificate);
      const businessExt = await getExtensionFromContent(businessRegistration);
      const serviceExt = await getExtensionFromContent(serviceAgreement);
      const privacyExt = await getExtensionFromContent(privacyAgreement);
      
      console.log('📝 파일 확장자 감지 (매직 넘버 기반):', {
        telecom: `${telecomCertificate.name} → .${telecomExt} (브라우저: ${telecomCertificate.type})`,
        business: `${businessRegistration.name} → .${businessExt} (브라우저: ${businessRegistration.type})`,
        service: `${serviceAgreement.name} → .${serviceExt} (브라우저: ${serviceAgreement.type})`,
        privacy: `${privacyAgreement.name} → .${privacyExt} (브라우저: ${privacyAgreement.type})`
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
// Force redeploy - Sat Mar 14 17:07:07 UTC 2026
