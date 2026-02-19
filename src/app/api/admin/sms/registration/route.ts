import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 내 등록 신청 조회
export async function GET(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext();
    const db = env.DB;

    // 인증 확인
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "인증 토큰이 필요합니다" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // 토큰 검증
    const session = await db
      .prepare("SELECT * FROM Session WHERE token = ? AND expiresAt > datetime('now')")
      .bind(token)
      .first();

    if (!session) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다" }, { status: 401 });
    }

    // 사용자의 등록 신청 조회
    const registrations = await db
      .prepare(`
        SELECT * FROM SMSRegistration 
        WHERE createdById = ? 
        ORDER BY createdAt DESC
      `)
      .bind(session.userId)
      .all();

    return NextResponse.json({
      success: true,
      registrations: registrations.results || [],
    });
  } catch (error: unknown) {
    console.error("SMS 등록 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 새 등록 신청
export async function POST(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext();
    const db = env.DB;
    const r2 = env.SMS_DOCUMENTS;

    // 인증 확인
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "인증 토큰이 필요합니다" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // 토큰 검증
    const session = await db
      .prepare("SELECT * FROM Session WHERE token = ? AND expiresAt > datetime('now')")
      .bind(token)
      .first();

    if (!session) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다" }, { status: 401 });
    }

    // FormData 파싱
    const formData = await request.formData();
    
    const phone_number = formData.get("phone_number") as string;
    const company_name = formData.get("company_name") as string;
    const business_number = formData.get("business_number") as string || "";
    const representative_name = formData.get("representative_name") as string;
    const representative_phone = formData.get("representative_phone") as string;

    // 필수 입력 검증
    if (!phone_number || !company_name || !representative_name || !representative_phone) {
      return NextResponse.json({ error: "필수 입력 항목을 모두 입력해주세요" }, { status: 400 });
    }

    // 파일 업로드 처리
    const uploadFile = async (file: File | null, prefix: string) => {
      if (!file) return null;
      
      const filename = `${prefix}_${Date.now()}_${file.name}`;
      const arrayBuffer = await file.arrayBuffer();
      
      await r2.put(filename, arrayBuffer, {
        httpMetadata: {
          contentType: file.type,
        },
      });
      
      // R2 public URL 생성 (Cloudflare 설정에 따라 다를 수 있음)
      return `https://pub-YOUR_ACCOUNT_HASH.r2.dev/${filename}`;
    };

    const telecom_certificate = formData.get("telecom_certificate") as File | null;
    const employment_certificate = formData.get("employment_certificate") as File | null;
    const usage_agreement = formData.get("usage_agreement") as File | null;
    const proxy_application = formData.get("proxy_application") as File | null;

    const telecom_certificate_url = await uploadFile(telecom_certificate, "telecom");
    const employment_certificate_url = await uploadFile(employment_certificate, "employment");
    const usage_agreement_url = await uploadFile(usage_agreement, "agreement");
    const proxy_application_url = await uploadFile(proxy_application, "proxy");

    // DB에 저장
    const registrationId = generateId();
    const now = new Date().toISOString();

    await db
      .prepare(`
        INSERT INTO SMSRegistration (
          id, phone_number, company_name, business_number,
          representative_name, representative_phone,
          telecom_certificate_url, employment_certificate_url,
          usage_agreement_url, proxy_application_url,
          status, createdById, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
      `)
      .bind(
        registrationId,
        phone_number,
        company_name,
        business_number,
        representative_name,
        representative_phone,
        telecom_certificate_url,
        employment_certificate_url,
        usage_agreement_url,
        proxy_application_url,
        session.userId,
        now,
        now
      )
      .run();

    return NextResponse.json({
      success: true,
      message: "등록 신청이 완료되었습니다",
      registrationId,
    });
  } catch (error: unknown) {
    console.error("SMS 등록 신청 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
