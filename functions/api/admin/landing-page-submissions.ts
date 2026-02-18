interface Env {
  DB: D1Database;
}

// GET: 제출 목록 조회 (또는 Excel 다운로드)
// POST: 새 제출 접수
// DELETE: 제출 삭제

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const landingPageId = url.searchParams.get('landingPageId');
    const format = url.searchParams.get('format'); // 'json' or 'excel'

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let query = `
      SELECT 
        s.*,
        lp.title as landingPageTitle,
        lp.slug as landingPageSlug
      FROM landing_page_submissions s
      LEFT JOIN landing_pages lp ON s.landing_page_id = lp.id
    `;

    const params = [];
    if (landingPageId) {
      query += ` WHERE s.landing_page_id = ?`;
      params.push(parseInt(landingPageId));
    }

    query += ` ORDER BY s.submitted_at DESC`;

    const result = await DB.prepare(query).bind(...params).all();
    const submissions = result.results || [];

    // Excel 다운로드
    if (format === 'excel') {
      // CSV 형식으로 생성 (Excel에서 열 수 있음)
      const headers = ['ID', '랜딩페이지', '이름', '이메일', '연락처', '메시지', '제출일시', '추가데이터'];
      const rows = submissions.map((sub: any) => [
        sub.id,
        sub.landingPageTitle || sub.landingPageSlug || '',
        sub.name || '',
        sub.email || '',
        sub.phone || '',
        sub.message || '',
        sub.submitted_at || '',
        sub.additional_data || ''
      ]);

      // CSV 생성
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // UTF-8 BOM 추가 (Excel에서 한글 깨짐 방지)
      const bom = '\uFEFF';
      const csvWithBom = bom + csv;

      return new Response(csvWithBom, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="landing-submissions-${Date.now()}.csv"`
        },
      });
    }

    // JSON 응답
    return new Response(JSON.stringify({ submissions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Submissions fetch error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json() as {
      landingPageId: number;
      name: string;
      email: string;
      phone?: string;
      message?: string;
      additionalData?: any;
    };

    if (!body.landingPageId || !body.name || !body.email) {
      return new Response(JSON.stringify({ 
        error: "landingPageId, name, and email are required" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 제출 저장
    const result = await DB.prepare(`
      INSERT INTO landing_page_submissions (
        landing_page_id, name, email, phone, message, 
        additional_data, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      body.landingPageId,
      body.name,
      body.email,
      body.phone || '',
      body.message || '',
      body.additionalData ? JSON.stringify(body.additionalData) : ''
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      id: result.meta.last_row_id 
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Submission creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await DB.prepare(`
      DELETE FROM landing_page_submissions WHERE id = ?
    `).bind(parseInt(id)).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Submission deletion error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
