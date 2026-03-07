// Debug API: Get all sender number requests
// GET /api/debug/sender-number-requests

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    // Get all sender number requests (no auth required for debugging)
    const requests = await env.DB.prepare('SELECT * FROM sender_number_requests ORDER BY createdAt DESC').all();

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: requests.results?.length || 0,
        requests: requests.results || []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
