// API: 요금제 관리 (관리자 전용)
// GET /api/admin/pricing-plans - 요금제 목록 조회
// POST /api/admin/pricing-plans - 요금제 생성
// PUT /api/admin/pricing-plans/[id] - 요금제 수정
// DELETE /api/admin/pricing-plans/[id] - 요금제 삭제

interface Env {
  DB: D1Database;
}

interface PricingPlanRequest {
  name: string;
  description: string;
  pricing_1month: number;
  pricing_6months: number;
  pricing_12months: number;
  maxStudents: number;
  maxTeachers: number;
  maxHomeworkChecks: number;
  maxAIAnalysis: number;
  maxAIGrading: number;
  maxCapabilityAnalysis: number;
  maxConceptAnalysis: number;
  maxSimilarProblems: number;
  maxLandingPages: number;
  features: string; // JSON stringified array
  isPopular: boolean;
  color: string;
  order: number;
  isActive: boolean;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // pricing_plans 테이블 생성 (6개월 요금 포함)
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS pricing_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        
        pricing_1month INTEGER NOT NULL,
        pricing_6months INTEGER NOT NULL,
        pricing_12months INTEGER NOT NULL,
        
        maxStudents INTEGER DEFAULT -1,
        maxTeachers INTEGER DEFAULT -1,
        maxHomeworkChecks INTEGER DEFAULT -1,
        maxAIAnalysis INTEGER DEFAULT -1,
        maxAIGrading INTEGER DEFAULT -1,
        maxCapabilityAnalysis INTEGER DEFAULT -1,
        maxConceptAnalysis INTEGER DEFAULT -1,
        maxSimilarProblems INTEGER DEFAULT -1,
        maxLandingPages INTEGER DEFAULT -1,
        
        features TEXT,
        isPopular INTEGER DEFAULT 0,
        color TEXT DEFAULT '#3B82F6',
        \`order\` INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1,
        
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 요금제 목록 조회
    const result = await db.prepare(`
      SELECT * FROM pricing_plans ORDER BY \`order\` ASC, createdAt DESC
    `).all();

    const plans = (result.results || []).map((plan: any) => ({
      ...plan,
      pricing: {
        '1month': plan.pricing_1month,
        '6months': plan.pricing_6months,
        '12months': plan.pricing_12months,
      },
      limits: {
        maxStudents: plan.maxStudents,
        maxTeachers: plan.maxTeachers,
        maxHomeworkChecks: plan.maxHomeworkChecks,
        maxAIAnalysis: plan.maxAIAnalysis,
        maxAIGrading: plan.maxAIGrading,
        maxCapabilityAnalysis: plan.maxCapabilityAnalysis,
        maxConceptAnalysis: plan.maxConceptAnalysis,
        maxSimilarProblems: plan.maxSimilarProblems,
        maxLandingPages: plan.maxLandingPages,
      },
      features: plan.features ? JSON.parse(plan.features) : [],
      isPopular: plan.isPopular === 1,
      isActive: plan.isActive === 1,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        plans,
        count: plans.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("요금제 목록 조회 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "요금제 목록 조회 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data: PricingPlanRequest = await context.request.json();
    
    if (!data.name || data.pricing_1month === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "필수 정보가 누락되었습니다",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const planId = `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await db
      .prepare(`
        INSERT INTO pricing_plans (
          id, name, description,
          pricing_1month, pricing_6months, pricing_12months,
          maxStudents, maxTeachers, maxHomeworkChecks,
          maxAIAnalysis, maxAIGrading, maxCapabilityAnalysis,
          maxConceptAnalysis, maxSimilarProblems, maxLandingPages,
          features, isPopular, color, \`order\`, isActive
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        planId,
        data.name,
        data.description || '',
        data.pricing_1month,
        data.pricing_6months,
        data.pricing_12months,
        data.maxStudents || -1,
        data.maxTeachers || -1,
        data.maxHomeworkChecks || -1,
        data.maxAIAnalysis || -1,
        data.maxAIGrading || -1,
        data.maxCapabilityAnalysis || -1,
        data.maxConceptAnalysis || -1,
        data.maxSimilarProblems || -1,
        data.maxLandingPages || -1,
        data.features || '[]',
        data.isPopular ? 1 : 0,
        data.color || '#3B82F6',
        data.order || 0,
        data.isActive ? 1 : 0
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "요금제가 생성되었습니다",
        planId,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("요금제 생성 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "요금제 생성 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
