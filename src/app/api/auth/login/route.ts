export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
  isStudentLogin?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const data: LoginRequest = await request.json();

    // Cloudflare Functions로 프록시
    const cloudflareUrl = process.env.CLOUDFLARE_SITE_URL || 'https://superplace-academy.pages.dev';
    
    console.log('🔄 Proxying login request to Cloudflare Functions:', cloudflareUrl);
    
    const response = await fetch(`${cloudflareUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('Login proxy error:', error);

    return NextResponse.json(
      {
        success: false,
        message: '로그인 처리 중 오류가 발생했습니다',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
