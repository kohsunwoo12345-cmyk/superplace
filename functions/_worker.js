export default {
  async fetch(request, env) {
    // This file configures the Functions build
    // External modules that should not be bundled
    return new Response('Not used - configuration only', { status: 404 });
  }
}

export const config = {
  // Mark Prisma-related modules as external
  external: [
    '.prisma/client',
    '.prisma/client/default',
    '@prisma/client',
    '@next-auth/prisma-adapter'
  ]
};
