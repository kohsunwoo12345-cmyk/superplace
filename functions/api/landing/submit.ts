interface Env {
  DB: D1Database;
}

// POST: 랜딩페이지 폼 제출

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      });
    }

    const body = await context.request.json() as {
      landingPageId: number | string;
      name: string;
      email: string;
      phone?: string;
      message?: string;
      [key: string]: any; // 추가 필드 허용
    };

    const landingPageId = typeof body.landingPageId === 'string' 
      ? parseInt(body.landingPageId) 
      : body.landingPageId;

    if (!landingPageId || !body.name || !body.email) {
      return new Response(JSON.stringify({ 
        error: "landingPageId, name, and email are required" 
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      });
    }

    // 랜딩페이지 존재 확인
    const landingPage = await DB.prepare(`
      SELECT id, is_active FROM landing_pages WHERE id = ?
    `).bind(landingPageId).first();

    if (!landingPage) {
      return new Response(JSON.stringify({ error: "Landing page not found" }), {
        status: 404,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      });
    }

    if (!landingPage.is_active) {
      return new Response(JSON.stringify({ error: "Landing page is inactive" }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      });
    }

    // 추가 데이터 수집 (기본 필드 제외)
    const additionalData: Record<string, any> = {};
    const basicFields = ['landingPageId', 'name', 'email', 'phone', 'message'];
    
    for (const [key, value] of Object.entries(body)) {
      if (!basicFields.includes(key)) {
        additionalData[key] = value;
      }
    }

    // 제출 저장
    const result = await DB.prepare(`
      INSERT INTO landing_page_submissions (
        landing_page_id, name, email, phone, message, 
        additional_data, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      landingPageId,
      body.name,
      body.email,
      body.phone || '',
      body.message || '',
      Object.keys(additionalData).length > 0 ? JSON.stringify(additionalData) : ''
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      id: result.meta.last_row_id,
      message: "제출이 완료되었습니다."
    }), {
      status: 201,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  } catch (error: any) {
    console.error("Form submission error:", error);
    return new Response(JSON.stringify({ 
      error: "제출 중 오류가 발생했습니다.",
      details: error.message 
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }
};

// OPTIONS: CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
