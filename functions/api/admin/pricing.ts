interface Env {
  DB: D1Database;
}

interface PricingPlan {
  id?: number;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxStudents: number;
  maxTeachers: number;
  features: string;
  isPopular: number;
  isActive: number;
  htmlContent?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    // 요금제 테이블이 없으면 생성
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS pricing_plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          monthlyPrice REAL NOT NULL,
          yearlyPrice REAL NOT NULL,
          maxStudents INTEGER DEFAULT 10,
          maxTeachers INTEGER DEFAULT 2,
          features TEXT,
          isPopular INTEGER DEFAULT 0,
          isActive INTEGER DEFAULT 1,
          htmlContent TEXT,
          createdAt TEXT DEFAULT (datetime('now')),
          updatedAt TEXT DEFAULT (datetime('now'))
        )
      `).run();
      console.log("✅ Pricing plans table checked/created");
    } catch (e) {
      console.log("⚠️ Pricing plans table already exists or error:", e);
    }

    // 특정 요금제 조회
    if (id) {
      const plan = await DB.prepare(`
        SELECT * FROM pricing_plans WHERE id = ?
      `).bind(id).first();

      if (!plan) {
        return new Response(JSON.stringify({
          success: false,
          error: "Pricing plan not found"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        plan: {
          ...plan,
          features: plan.features ? JSON.parse(plan.features) : []
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 모든 요금제 조회
    const plansResult = await DB.prepare(`
      SELECT * FROM pricing_plans ORDER BY monthlyPrice ASC
    `).all();

    const plans = (plansResult.results || []).map((plan: any) => ({
      ...plan,
      features: plan.features ? JSON.parse(plan.features) : []
    }));

    // 각 요금제별 구독 중인 학원 수 조회
    const statsPromises = plans.map(async (plan: any) => {
      const result = await DB.prepare(`
        SELECT COUNT(*) as count
        FROM academy
        WHERE subscriptionPlan = ? AND isActive = 1
      `).bind(plan.name).first();

      return {
        planId: plan.id,
        planName: plan.name,
        activeAcademies: result?.count || 0
      };
    });

    const stats = await Promise.all(statsPromises);

    return new Response(JSON.stringify({
      success: true,
      plans,
      stats
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Pricing API error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to fetch pricing plans",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// 요금제 생성
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json() as PricingPlan;

    const { name, description, monthlyPrice, yearlyPrice, maxStudents, maxTeachers, features, isPopular, htmlContent } = body;

    // 필수 필드 검증
    if (!name || monthlyPrice === undefined || yearlyPrice === undefined) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required fields: name, monthlyPrice, yearlyPrice"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // features를 JSON 문자열로 변환
    const featuresJson = Array.isArray(features) ? JSON.stringify(features) : features;

    const result = await DB.prepare(`
      INSERT INTO pricing_plans (name, description, monthlyPrice, yearlyPrice, maxStudents, maxTeachers, features, isPopular, htmlContent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name,
      description || '',
      monthlyPrice,
      yearlyPrice,
      maxStudents || 10,
      maxTeachers || 2,
      featuresJson,
      isPopular ? 1 : 0,
      htmlContent || ''
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: "Pricing plan created successfully",
      planId: result.meta.last_row_id
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Create pricing plan error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to create pricing plan",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// 요금제 수정
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing plan ID"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json() as PricingPlan;

    const { name, description, monthlyPrice, yearlyPrice, maxStudents, maxTeachers, features, isPopular, isActive, htmlContent } = body;

    // features를 JSON 문자열로 변환
    const featuresJson = Array.isArray(features) ? JSON.stringify(features) : features;

    await DB.prepare(`
      UPDATE pricing_plans
      SET name = ?, description = ?, monthlyPrice = ?, yearlyPrice = ?, 
          maxStudents = ?, maxTeachers = ?, features = ?, isPopular = ?, 
          isActive = ?, htmlContent = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(
      name,
      description || '',
      monthlyPrice,
      yearlyPrice,
      maxStudents || 10,
      maxTeachers || 2,
      featuresJson,
      isPopular ? 1 : 0,
      isActive ? 1 : 0,
      htmlContent || '',
      id
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: "Pricing plan updated successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Update pricing plan error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to update pricing plan",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// 요금제 삭제
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing plan ID"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 소프트 삭제 (isActive = 0)
    await DB.prepare(`
      UPDATE pricing_plans
      SET isActive = 0, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    return new Response(JSON.stringify({
      success: true,
      message: "Pricing plan deleted successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Delete pricing plan error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to delete pricing plan",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
