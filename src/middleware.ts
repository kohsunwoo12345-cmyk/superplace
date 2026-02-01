import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // API 호출, static 파일, 이미지 등은 로깅하지 않음
  const shouldSkip =
    request.nextUrl.pathname.startsWith('/api/admin/access-logs') ||
    request.nextUrl.pathname.startsWith('/api/admin/activity-logs') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|woff|woff2|ttf)$/);

  if (shouldSkip) {
    return NextResponse.next();
  }

  // 사용자 세션 확인
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 접속 로그 기록 (비동기로 처리하여 응답 지연 방지)
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname === '/') {
    // 백그라운드에서 로그 기록
    fetch(new URL('/api/admin/access-logs', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: token?.sub || null,
        sessionId: token?.sessionId || `guest-${Date.now()}`,
        path: request.nextUrl.pathname,
        method: request.method,
        activityType: request.nextUrl.pathname === '/' ? 'home_visit' : 'page_view',
      }),
    }).catch((err) => {
      // 로깅 실패해도 사용자 요청은 계속 처리
      console.error('접속 로그 기록 실패:', err);
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
