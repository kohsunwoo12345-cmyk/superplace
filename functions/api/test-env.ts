interface Env {
  GOOGLE_GEMINI_API_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { GOOGLE_GEMINI_API_KEY } = context.env;

  return new Response(
    JSON.stringify({
      hasKey: !!GOOGLE_GEMINI_API_KEY,
      keyLength: GOOGLE_GEMINI_API_KEY?.length || 0,
      keyPrefix: GOOGLE_GEMINI_API_KEY?.substring(0, 10) || "undefined",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
# Force redeploy for env vars - Wed Feb  4 19:58:00 UTC 2026
# Note: Preview 환경에 GOOGLE_GEMINI_API_KEY 설정 필요
