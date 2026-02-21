import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// JWT 토큰에서 사용자 정보 추출
async function getUserFromToken(token: string, secret: string): Promise<any> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // 토큰에서 사용자 정보 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token, env.JWT_SECRET);

    // FormData 파싱
    const formData = await request.formData();
    const phoneNumber = formData.get('phoneNumber') as string;
    const purpose = formData.get('purpose') as string;
    const verificationDoc = formData.get('verificationDoc') as File;
    const businessCert = formData.get('businessCert') as File;

    // 입력 검증
    if (!phoneNumber || !verificationDoc) {
      return new Response(JSON.stringify({ 
        error: 'Required fields missing',
        message: '전화번호와 통신서비스이용증명원은 필수입니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 전화번호 포맷 검증
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid phone number',
        message: '전화번호 형식이 올바르지 않습니다. (010-1234-5678)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 중복 확인
    const existing = await env.DB.prepare(`
      SELECT id FROM SenderNumber WHERE phoneNumber = ?
    `).bind(phoneNumber).first();

    if (existing) {
      return new Response(JSON.stringify({ 
        error: 'Duplicate phone number',
        message: '이미 등록된 전화번호입니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('📞 발신번호 등록 시작:', phoneNumber);

    // 파일 저장 (실제로는 Cloudflare R2 또는 S3에 저장해야 함)
    // 여기서는 base64로 인코딩하여 URL 생성 (간단한 구현)
    let verificationDocUrl = '';
    let businessCertUrl = '';

    if (verificationDoc) {
      const verificationBuffer = await verificationDoc.arrayBuffer();
      const verificationBase64 = btoa(String.fromCharCode(...new Uint8Array(verificationBuffer)));
      verificationDocUrl = `data:${verificationDoc.type};base64,${verificationBase64}`;
      console.log('✅ 통신서비스이용증명원 업로드:', verificationDoc.name);
    }

    if (businessCert) {
      const businessBuffer = await businessCert.arrayBuffer();
      const businessBase64 = btoa(String.fromCharCode(...new Uint8Array(businessBuffer)));
      businessCertUrl = `data:${businessCert.type};base64,${businessBase64}`;
      console.log('✅ 사업자등록증 업로드:', businessCert.name);
    }

    // DB에 저장
    const numberId = `sender_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO SenderNumber (
        id, userId, phoneNumber, purpose,
        verificationDocUrl, businessCertUrl,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `).bind(
      numberId,
      user.id || user.userId,
      phoneNumber,
      purpose || '',
      verificationDocUrl,
      businessCertUrl,
      now,
      now
    ).run();

    console.log('✅ 발신번호 등록 완료:', numberId);

    return new Response(JSON.stringify({ 
      success: true,
      numberId,
      message: '발신번호 등록 신청이 완료되었습니다. 관리자 승인까지 1-2 영업일이 소요됩니다.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Failed to register sender number:', error);
    return new Response(JSON.stringify({ 
      error: 'Registration failed',
      message: error.message || '발신번호 등록에 실패했습니다.',
      details: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
