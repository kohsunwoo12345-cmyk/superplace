import { NextResponse } from 'next/server';

export async function GET() {
  // 모든 CLOUDFLARE 관련 환경 변수 확인
  const envVars = {
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_D1_DATABASE_ID: process.env.CLOUDFLARE_D1_DATABASE_ID,
    CLOUDFLARE_D1_API_TOKEN: process.env.CLOUDFLARE_D1_API_TOKEN,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_API_KEY: process.env.CLOUDFLARE_API_KEY,
    CLOUDFLARE_EMAIL: process.env.CLOUDFLARE_EMAIL,
    CLOUDFLARE_SITE_URL: process.env.CLOUDFLARE_SITE_URL,
    CLOUDFLARE_SYNC_API_KEY: process.env.CLOUDFLARE_SYNC_API_KEY,
  };

  // 값이 있는지 확인 (실제 값은 노출하지 않음)
  const status = Object.entries(envVars).reduce((acc, [key, value]) => {
    acc[key] = {
      exists: !!value,
      length: value ? value.length : 0,
      firstChars: value ? value.substring(0, 4) + '...' : null,
    };
    return acc;
  }, {} as Record<string, any>);

  // 모든 환경 변수 키 목록 (CLOUDFLARE로 시작하는 것만)
  const allCloudflareKeys = Object.keys(process.env)
    .filter(key => key.startsWith('CLOUDFLARE'))
    .sort();

  return NextResponse.json({
    message: 'Cloudflare 환경 변수 상세 디버깅',
    expectedVariables: status,
    allCloudflareEnvKeys: allCloudflareKeys,
    totalCloudflareVars: allCloudflareKeys.length,
  });
}
