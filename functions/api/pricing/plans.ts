// 요금제 목록 조회 API
export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  
  try {
    const { results } = await env.DB.prepare(
      `SELECT * FROM pricing_plans WHERE isActive = 1 ORDER BY \`order\` ASC`
    ).all();
    
    return new Response(
      JSON.stringify({
        success: true,
        plans: results || []
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error fetching pricing plans:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch pricing plans',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
