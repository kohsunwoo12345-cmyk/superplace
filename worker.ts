import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

// This is a placeholder file for Cloudflare Workers compatibility
// OpenNext will handle the actual build process

export default {
  async fetch(request: Request, env: any, ctx: any) {
    // This will be handled by OpenNext
    return new Response('OK');
  },
};
