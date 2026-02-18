interface Env {
  DB: D1Database;
}

// GET: 폴더 목록 조회
// POST: 새 폴더 생성
// PUT: 폴더 수정
// DELETE: 폴더 삭제

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const folders = await DB.prepare(`
      SELECT 
        f.*,
        (SELECT COUNT(*) FROM landing_pages WHERE folder_id = f.id) as pagesCount
      FROM landing_page_folders f
      ORDER BY f.created_at DESC
    `).all();

    return new Response(JSON.stringify({ folders: folders.results || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Folders fetch error:", error);
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
      name: string;
      description?: string;
    };

    if (!body.name) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await DB.prepare(`
      INSERT INTO landing_page_folders (name, description, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
    `).bind(body.name, body.description || '').run();

    return new Response(JSON.stringify({ 
      success: true, 
      id: result.meta.last_row_id 
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Folder creation error:", error);
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
      name?: string;
      description?: string;
    };

    const updates = [];
    const values = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }

    updates.push('updated_at = datetime(\'now\')');
    values.push(body.id);

    await DB.prepare(`
      UPDATE landing_page_folders 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Folder update error:", error);
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

    // 폴더에 속한 랜딩페이지가 있는지 확인
    const pages = await DB.prepare(`
      SELECT COUNT(*) as count FROM landing_pages WHERE folder_id = ?
    `).bind(parseInt(id)).first();

    if (pages && (pages.count as number) > 0) {
      return new Response(JSON.stringify({ 
        error: "Cannot delete folder with landing pages" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await DB.prepare(`
      DELETE FROM landing_page_folders WHERE id = ?
    `).bind(parseInt(id)).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Folder deletion error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
