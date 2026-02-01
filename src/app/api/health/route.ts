import { NextResponse } from "next/server";

/**
 * 최소한의 헬스체크 API
 * Vercel 배포 및 환경 변수 확인
 */
export async function GET() {
  try {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL?.length || 0,
        hasCloudflareAccountId: !!process.env.CLOUDFLARE_ACCOUNT_ID,
        hasCloudflareD1DatabaseId: !!process.env.CLOUDFLARE_D1_DATABASE_ID,
        hasCloudflareApiKey: !!process.env.CLOUDFLARE_API_KEY,
        hasCloudflareEmail: !!process.env.CLOUDFLARE_EMAIL,
        hasNextauthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextauthUrl: !!process.env.NEXTAUTH_URL,
      },
      deployment: {
        vercelEnv: process.env.VERCEL_ENV,
        vercelUrl: process.env.VERCEL_URL,
        vercelRegion: process.env.VERCEL_REGION,
      },
    };

    return NextResponse.json({
      success: true,
      message: "시스템 정상",
      ...health,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "시스템 오류",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
