// 요금제 관리 API (관리자용 - CRUD)
export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  
  try {
    const method = request.method;
    
    // POST: 요금제 생성
    if (method === 'POST') {
      const data = await request.json();
      
      const id = `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      await env.DB.prepare(`
        INSERT INTO pricing_plans (
          id, name, description, 
          price_1month, price_6months, price_12months,
          max_students, max_teachers, max_homework_checks, 
          max_ai_analysis, max_ai_grading,
          max_capability_analysis, max_concept_analysis,
          max_similar_problems, max_landing_pages,
          features, isPopular, color, \`order\`, isActive,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        data.name,
        data.description || '',
        data.pricing['1month'],
        data.pricing['6months'],
        data.pricing['12months'],
        data.limits.maxStudents,
        data.limits.maxTeachers || 5,
        data.limits.maxHomeworkChecks,
        data.limits.maxAIAnalysis,
        data.limits.maxAIGrading || 100,
        data.limits.maxCapabilityAnalysis || 50,
        data.limits.maxConceptAnalysis || 50,
        data.limits.maxSimilarProblems,
        data.limits.maxLandingPages,
        JSON.stringify(data.features || []),
        data.isPopular ? 1 : 0,
        data.color || '#3b82f6',
        data.order || 0,
        data.isActive !== false ? 1 : 0,
        now,
        now
      ).run();
      
      return new Response(
        JSON.stringify({
          success: true,
          planId: id,
          message: 'Pricing plan created successfully'
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // PUT: 요금제 수정
    if (method === 'PUT') {
      const data = await request.json();
      const planId = data.id;
      
      if (!planId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Plan ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const now = new Date().toISOString();
      
      await env.DB.prepare(`
        UPDATE pricing_plans SET
          name = ?,
          description = ?,
          price_1month = ?,
          price_6months = ?,
          price_12months = ?,
          max_students = ?,
          max_teachers = ?,
          max_homework_checks = ?,
          max_ai_analysis = ?,
          max_ai_grading = ?,
          max_capability_analysis = ?,
          max_concept_analysis = ?,
          max_similar_problems = ?,
          max_landing_pages = ?,
          features = ?,
          isPopular = ?,
          color = ?,
          \`order\` = ?,
          isActive = ?,
          updatedAt = ?
        WHERE id = ?
      `).bind(
        data.name,
        data.description || '',
        data.pricing['1month'],
        data.pricing['6months'],
        data.pricing['12months'],
        data.limits.maxStudents,
        data.limits.maxTeachers || 5,
        data.limits.maxHomeworkChecks,
        data.limits.maxAIAnalysis,
        data.limits.maxAIGrading || 100,
        data.limits.maxCapabilityAnalysis || 50,
        data.limits.maxConceptAnalysis || 50,
        data.limits.maxSimilarProblems,
        data.limits.maxLandingPages,
        JSON.stringify(data.features || []),
        data.isPopular ? 1 : 0,
        data.color || '#3b82f6',
        data.order || 0,
        data.isActive !== false ? 1 : 0,
        now,
        planId
      ).run();
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Pricing plan updated successfully'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // DELETE: 요금제 삭제 (비활성화)
    if (method === 'DELETE') {
      const url = new URL(request.url);
      const planId = url.searchParams.get('id');
      
      if (!planId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Plan ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const now = new Date().toISOString();
      
      await env.DB.prepare(`
        UPDATE pricing_plans SET isActive = 0, updatedAt = ? WHERE id = ?
      `).bind(now, planId).run();
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Pricing plan deleted successfully'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Error managing pricing plan:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to manage pricing plan',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
