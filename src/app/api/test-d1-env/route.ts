import { NextRequest, NextResponse } from 'next/server';
import { isD1Configured } from '@/lib/cloudflare-d1-client';

export async function GET(request: NextRequest) {
  const env = {
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ? '✅ 설정됨' : '❌ 없음',
    CLOUDFLARE_D1_DATABASE_ID: process.env.CLOUDFLARE_D1_DATABASE_ID ? '✅ 설정됨' : '❌ 없음',
    CLOUDFLARE_API_KEY: process.env.CLOUDFLARE_API_KEY ? '✅ 설정됨' : '❌ 없음',
    CLOUDFLARE_EMAIL: process.env.CLOUDFLARE_EMAIL ? '✅ 설정됨' : '❌ 없음',
    CLOUDFLARE_D1_API_TOKEN: process.env.CLOUDFLARE_D1_API_TOKEN ? '✅ 설정됨' : '❌ 없음',
  };

  const isConfigured = isD1Configured();

  return NextResponse.json({
    message: 'Cloudflare D1 환경 변수 확인',
    isD1Configured: isConfigured,
    environmentVariables: env,
    recommendation: isConfigured 
      ? '✅ 모든 환경 변수가 설정되었습니다!' 
      : '❌ 환경 변수를 확인하세요. ACCOUNT_ID, DATABASE_ID, 그리고 (API_KEY + EMAIL) 또는 (D1_API_TOKEN)이 필요합니다.',
  });
}
