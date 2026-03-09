/**
 * Cloudflare Pages Functions - Sandbox Durable Object Export
 * 
 * Pages Functions에서 Durable Objects를 사용하려면
 * 이 파일에서 export해야 합니다.
 */

import { Sandbox } from '@cloudflare/sandbox';

// Sandbox Durable Object을 export
export { Sandbox };

// Pages Functions의 기본 export는 유지됨
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // Pages Functions는 functions/ 디렉토리에서 처리됨
    // 이 파일은 Durable Objects export용
    return new Response('Use /api endpoints', { status: 404 });
  }
};
