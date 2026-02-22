// Cloudflare Pages Function - Create Landing Page Tables
// Access: POST /api/setup/create-tables

interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body = await context.request.json();
    const { password } = body;
    
    // Simple password protection
    if (password !== "setup-tables-2026") {
      return new Response(JSON.stringify({ 
        error: "Invalid password" 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = context.env.DB;
    const results = [];

    // 1. Create LandingPageTemplate table
    console.log("Creating LandingPageTemplate table...");
    try {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS LandingPageTemplate (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          html TEXT NOT NULL,
          variables TEXT,
          isDefault INTEGER DEFAULT 0,
          usageCount INTEGER DEFAULT 0,
          createdById TEXT NOT NULL,
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      results.push({ table: "LandingPageTemplate", status: "created" });
    } catch (error: any) {
      results.push({ table: "LandingPageTemplate", status: "error", error: error.message });
    }

    // 2. Create indexes for LandingPageTemplate
    try {
      await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_landing_template_creator 
        ON LandingPageTemplate(createdById);
      `);
      await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_landing_template_default 
        ON LandingPageTemplate(isDefault);
      `);
      results.push({ index: "LandingPageTemplate indexes", status: "created" });
    } catch (error: any) {
      results.push({ index: "LandingPageTemplate indexes", status: "error", error: error.message });
    }

    // 3. Create landing_pages table if not exists
    console.log("Checking landing_pages table...");
    try {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS landing_pages (
          id TEXT PRIMARY KEY,
          slug TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          subtitle TEXT,
          description TEXT,
          templateType TEXT DEFAULT 'basic',
          templateHtml TEXT,
          customFields TEXT,
          thumbnailUrl TEXT,
          qrCodeUrl TEXT,
          academyId TEXT,
          folderId TEXT,
          metaTitle TEXT,
          metaDescription TEXT,
          metaKeywords TEXT,
          views INTEGER DEFAULT 0,
          submissions INTEGER DEFAULT 0,
          isActive INTEGER DEFAULT 1,
          createdById TEXT NOT NULL,
          createdAt TEXT DEFAULT (datetime('now')),
          updatedAt TEXT DEFAULT (datetime('now'))
        );
      `);
      results.push({ table: "landing_pages", status: "created" });
    } catch (error: any) {
      results.push({ table: "landing_pages", status: "error", error: error.message });
    }

    // 4. Create indexes for landing_pages
    try {
      await db.exec(`CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);`);
      await db.exec(`CREATE INDEX IF NOT EXISTS idx_landing_pages_academy ON landing_pages(academyId);`);
      await db.exec(`CREATE INDEX IF NOT EXISTS idx_landing_pages_folder ON landing_pages(folderId);`);
      await db.exec(`CREATE INDEX IF NOT EXISTS idx_landing_pages_active ON landing_pages(isActive);`);
      results.push({ index: "landing_pages indexes", status: "created" });
    } catch (error: any) {
      results.push({ index: "landing_pages indexes", status: "error", error: error.message });
    }

    // 5. Verify tables exist
    const tables = await db
      .prepare(`
        SELECT name, sql 
        FROM sqlite_master 
        WHERE type='table' AND name IN ('LandingPageTemplate', 'landing_pages')
        ORDER BY name
      `)
      .all();

    return new Response(JSON.stringify({
      success: true,
      message: "테이블 생성 완료",
      results,
      tables: tables.results || []
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Table creation failed:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Table creation failed",
      stack: error.stack
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
