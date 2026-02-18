interface Env {
  DB: D1Database;
}

// 랜딩페이지 시스템 테이블 생성/마이그레이션

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results = [];

    // 1. 랜딩페이지 폴더 테이블
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS landing_page_folders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `).run();
      results.push("✓ landing_page_folders table created");
    } catch (error: any) {
      results.push(`✗ landing_page_folders: ${error.message}`);
    }

    // 2. 랜딩페이지 테이블
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS landing_pages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER,
          title TEXT NOT NULL,
          subtitle TEXT,
          slug TEXT NOT NULL UNIQUE,
          html_template TEXT,
          thumbnail_url TEXT,
          meta_pixel_id TEXT,
          custom_script TEXT,
          folder_id INTEGER,
          is_active INTEGER DEFAULT 1,
          view_count INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (folder_id) REFERENCES landing_page_folders(id) ON DELETE SET NULL
        )
      `).run();
      results.push("✓ landing_pages table created");
    } catch (error: any) {
      results.push(`✗ landing_pages: ${error.message}`);
    }

    // 3. 랜딩페이지 제출 테이블
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS landing_page_submissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          landing_page_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          message TEXT,
          additional_data TEXT,
          submitted_at TEXT NOT NULL,
          FOREIGN KEY (landing_page_id) REFERENCES landing_pages(id) ON DELETE CASCADE
        )
      `).run();
      results.push("✓ landing_page_submissions table created");
    } catch (error: any) {
      results.push(`✗ landing_page_submissions: ${error.message}`);
    }

    // 4. 인덱스 생성
    try {
      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug)
      `).run();
      results.push("✓ idx_landing_pages_slug index created");
    } catch (error: any) {
      results.push(`✗ idx_landing_pages_slug: ${error.message}`);
    }

    try {
      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_landing_pages_folder_id ON landing_pages(folder_id)
      `).run();
      results.push("✓ idx_landing_pages_folder_id index created");
    } catch (error: any) {
      results.push(`✗ idx_landing_pages_folder_id: ${error.message}`);
    }

    try {
      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_landing_page_submissions_landing_page_id 
        ON landing_page_submissions(landing_page_id)
      `).run();
      results.push("✓ idx_landing_page_submissions_landing_page_id index created");
    } catch (error: any) {
      results.push(`✗ idx_landing_page_submissions_landing_page_id: ${error.message}`);
    }

    // 5. 샘플 폴더 생성 (존재하지 않을 경우)
    try {
      const existing = await DB.prepare(`
        SELECT COUNT(*) as count FROM landing_page_folders
      `).first();

      if (existing && (existing.count as number) === 0) {
        await DB.prepare(`
          INSERT INTO landing_page_folders (name, description, created_at, updated_at)
          VALUES 
            ('기본 폴더', '기본 랜딩페이지 폴더', datetime('now'), datetime('now')),
            ('프로모션', '프로모션용 랜딩페이지', datetime('now'), datetime('now')),
            ('이벤트', '이벤트용 랜딩페이지', datetime('now'), datetime('now'))
        `).run();
        results.push("✓ Sample folders created");
      } else {
        results.push("✓ Folders already exist");
      }
    } catch (error: any) {
      results.push(`✗ Sample folders: ${error.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      message: "Landing page tables migration completed"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
