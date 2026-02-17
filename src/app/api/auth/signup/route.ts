export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'DIRECTOR' | 'TEACHER' | 'STUDENT';
  academyName?: string;
  academyCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: SignupRequest = await request.json();

    // Cloudflare Functions로 프록시
    const cloudflareUrl = process.env.CLOUDFLARE_SITE_URL || 'https://superplace-academy.pages.dev';
    
    console.log('🔄 Proxying signup request to Cloudflare Functions:', cloudflareUrl);
    
    const response = await fetch(`${cloudflareUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('Signup proxy error:', error);

    return NextResponse.json(
      {
        success: false,
        message: '회원가입 처리 중 오류가 발생했습니다',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
