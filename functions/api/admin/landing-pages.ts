interface Env {
  DB: D1Database;
}

// GET: 랜딩페이지 목록 조회
// POST: 새 랜딩페이지 생성
// PUT: 랜딩페이지 수정
// DELETE: 랜딩페이지 삭제

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    const folderId = url.searchParams.get('folderId');

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 단일 랜딩페이지 조회
    if (id) {
      const landingPage = await DB.prepare(`
        SELECT 
          lp.*,
          u.name as studentName,
          u.email as studentEmail,
          f.name as folderName,
          (SELECT COUNT(*) FROM landing_page_submissions WHERE landing_page_id = lp.id) as submissionCount
        FROM landing_pages lp
        LEFT JOIN users u ON lp.student_id = u.id
        LEFT JOIN landing_page_folders f ON lp.folder_id = f.id
        WHERE lp.id = ?
      `).bind(parseInt(id)).first();

      if (!landingPage) {
        return new Response(JSON.stringify({ error: "Landing page not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ landingPage }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 목록 조회
    let query = `
      SELECT 
        lp.*,
        u.name as studentName,
        u.email as studentEmail,
        f.name as folderName,
        (SELECT COUNT(*) FROM landing_page_submissions WHERE landing_page_id = lp.id) as submissionCount
      FROM landing_pages lp
      LEFT JOIN users u ON lp.student_id = u.id
      LEFT JOIN landing_page_folders f ON lp.folder_id = f.id
    `;

    const params = [];
    if (folderId) {
      query += ` WHERE lp.folder_id = ?`;
      params.push(parseInt(folderId));
    }

    query += ` ORDER BY lp.created_at DESC`;

    const result = await DB.prepare(query).bind(...params).all();

    return new Response(JSON.stringify({ landingPages: result.results || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Landing pages fetch error:", error);
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
      studentId?: number;
      title: string;
      subtitle?: string;
      slug: string;
      htmlTemplate?: string;
      thumbnailUrl?: string;
      metaPixelId?: string;
      customScript?: string;
      folderId?: number;
      isActive?: boolean;
    };

    // slug 중복 체크
    const existing = await DB.prepare(`
      SELECT id FROM landing_pages WHERE slug = ?
    `).bind(body.slug).first();

    if (existing) {
      return new Response(JSON.stringify({ error: "Slug already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 기본 HTML 템플릿
    const defaultTemplate = body.htmlTemplate || `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <meta name="description" content="{{subtitle}}">
    {{meta_pixel}}
    {{custom_script}}
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .hero { text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .hero h1 { font-size: 3em; margin-bottom: 20px; }
        .hero p { font-size: 1.5em; opacity: 0.9; }
        .content { padding: 40px 20px; }
        .form-section { background: #f7f7f7; padding: 40px; border-radius: 10px; margin: 40px 0; }
        .form-section h2 { margin-bottom: 20px; text-align: center; }
        form { max-width: 600px; margin: 0 auto; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: 600; }
        input, textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; }
        textarea { min-height: 120px; resize: vertical; }
        button { background: #667eea; color: white; padding: 15px 40px; border: none; border-radius: 5px; font-size: 18px; cursor: pointer; width: 100%; }
        button:hover { background: #5568d3; }
        .footer { text-align: center; padding: 20px; background: #333; color: white; }
    </style>
</head>
<body>
    <div class="hero">
        <h1>{{title}}</h1>
        <p>{{subtitle}}</p>
    </div>
    
    <div class="container">
        <div class="content">
            <h2>환영합니다!</h2>
            <p>이 페이지는 자동으로 생성된 랜딩페이지입니다. 관리자 페이지에서 내용을 수정할 수 있습니다.</p>
        </div>
        
        <div class="form-section">
            <h2>문의하기</h2>
            <form id="contactForm" action="/api/landing/submit" method="POST">
                <input type="hidden" name="landingPageId" value="{{landing_page_id}}">
                
                <div class="form-group">
                    <label for="name">이름 *</label>
                    <input type="text" id="name" name="name" required>
                </div>
                
                <div class="form-group">
                    <label for="email">이메일 *</label>
                    <input type="email" id="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="phone">연락처</label>
                    <input type="tel" id="phone" name="phone">
                </div>
                
                <div class="form-group">
                    <label for="message">메시지</label>
                    <textarea id="message" name="message"></textarea>
                </div>
                
                <button type="submit">제출하기</button>
            </form>
        </div>
    </div>
    
    <div class="footer">
        <p>&copy; 2026 SuperPlace. All rights reserved.</p>
    </div>
    
    <script>
        document.getElementById('contactForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/api/landing/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    alert('제출되었습니다!');
                    e.target.reset();
                } else {
                    alert('제출 중 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error(error);
                alert('제출 중 오류가 발생했습니다.');
            }
        });
    </script>
</body>
</html>
    `.trim();

    // 랜딩페이지 생성
    const result = await DB.prepare(`
      INSERT INTO landing_pages (
        student_id, title, subtitle, slug, html_template, 
        thumbnail_url, meta_pixel_id, custom_script, folder_id, 
        is_active, view_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
    `).bind(
      body.studentId || null,
      body.title,
      body.subtitle || '',
      body.slug,
      defaultTemplate,
      body.thumbnailUrl || '',
      body.metaPixelId || '',
      body.customScript || '',
      body.folderId || null,
      body.isActive !== false ? 1 : 0
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      id: result.meta.last_row_id,
      slug: body.slug
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Landing page creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json() as {
      id: number;
      title?: string;
      subtitle?: string;
      htmlTemplate?: string;
      thumbnailUrl?: string;
      metaPixelId?: string;
      customScript?: string;
      folderId?: number;
      isActive?: boolean;
    };

    const updates = [];
    const values = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
    }
    if (body.subtitle !== undefined) {
      updates.push('subtitle = ?');
      values.push(body.subtitle);
    }
    if (body.htmlTemplate !== undefined) {
      updates.push('html_template = ?');
      values.push(body.htmlTemplate);
    }
    if (body.thumbnailUrl !== undefined) {
      updates.push('thumbnail_url = ?');
      values.push(body.thumbnailUrl);
    }
    if (body.metaPixelId !== undefined) {
      updates.push('meta_pixel_id = ?');
      values.push(body.metaPixelId);
    }
    if (body.customScript !== undefined) {
      updates.push('custom_script = ?');
      values.push(body.customScript);
    }
    if (body.folderId !== undefined) {
      updates.push('folder_id = ?');
      values.push(body.folderId);
    }
    if (body.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(body.isActive ? 1 : 0);
    }

    updates.push('updated_at = datetime(\'now\')');
    values.push(body.id);

    await DB.prepare(`
      UPDATE landing_pages 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Landing page update error:", error);
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

    // 관련 제출 데이터도 삭제
    await DB.prepare(`
      DELETE FROM landing_page_submissions WHERE landing_page_id = ?
    `).bind(parseInt(id)).run();

    await DB.prepare(`
      DELETE FROM landing_pages WHERE id = ?
    `).bind(parseInt(id)).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Landing page deletion error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
