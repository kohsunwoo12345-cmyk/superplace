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

    // 1. Create landing_page_templates table
    console.log("Creating landing_page_templates table...");
    try {
      await db.prepare(`CREATE TABLE IF NOT EXISTS landing_page_templates (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, html TEXT NOT NULL, variables TEXT, isDefault INTEGER DEFAULT 0, usageCount INTEGER DEFAULT 0, createdById TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')))`).run();
      results.push({ table: "landing_page_templates", status: "created" });
    } catch (error: any) {
      results.push({ table: "landing_page_templates", status: "error", error: error.message });
    }

    // 2. Create indexes for landing_page_templates
    try {
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_landing_template_creator ON landing_page_templates(createdById)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_landing_template_default ON landing_page_templates(isDefault)`).run();
      results.push({ index: "landing_page_templates indexes", status: "created" });
    } catch (error: any) {
      results.push({ index: "landing_page_templates indexes", status: "error", error: error.message });
    }

    // 3. Create landing_pages table if not exists
    console.log("Checking landing_pages table...");
    try {
      await db.prepare(`CREATE TABLE IF NOT EXISTS landing_pages (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, subtitle TEXT, description TEXT, templateType TEXT DEFAULT 'basic', html_content TEXT, templateHtml TEXT, customFields TEXT, thumbnailUrl TEXT, qrCodeUrl TEXT, academyId TEXT, folderId TEXT, user_id INTEGER, metaTitle TEXT, metaDescription TEXT, metaKeywords TEXT, views INTEGER DEFAULT 0, submissions INTEGER DEFAULT 0, isActive INTEGER DEFAULT 1, createdById TEXT NOT NULL, createdAt TEXT DEFAULT (datetime('now')), updatedAt TEXT DEFAULT (datetime('now')))`).run();
      results.push({ table: "landing_pages", status: "created" });
    } catch (error: any) {
      results.push({ table: "landing_pages", status: "error", error: error.message });
    }
    
    // 3.5. Add html_content column if missing
    console.log("Adding html_content column if missing...");
    try {
      await db.prepare(`ALTER TABLE landing_pages ADD COLUMN html_content TEXT`).run();
      results.push({ column: "html_content", status: "added" });
    } catch (error: any) {
      // Column already exists - this is fine
      if (error.message.includes("duplicate column")) {
        results.push({ column: "html_content", status: "already_exists" });
      } else {
        results.push({ column: "html_content", status: "error", error: error.message });
      }
    }
    
    // 3.6. Add user_id column if missing
    console.log("Adding user_id column if missing...");
    try {
      await db.prepare(`ALTER TABLE landing_pages ADD COLUMN user_id INTEGER`).run();
      results.push({ column: "user_id", status: "added" });
    } catch (error: any) {
      // Column already exists - this is fine
      if (error.message.includes("duplicate column")) {
        results.push({ column: "user_id", status: "already_exists" });
      } else {
        results.push({ column: "user_id", status: "error", error: error.message });
      }
    }

    // 4. Create indexes for landing_pages
    try {
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_landing_pages_academy ON landing_pages(academyId)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_landing_pages_folder ON landing_pages(folderId)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_landing_pages_active ON landing_pages(isActive)`).run();
      results.push({ index: "landing_pages indexes", status: "created" });
    } catch (error: any) {
      results.push({ index: "landing_pages indexes", status: "error", error: error.message });
    }

    // 5. Verify tables exist
    const tables = await db.prepare(`SELECT name, sql FROM sqlite_master WHERE type='table' AND name IN ('landing_page_templates', 'landing_pages') ORDER BY name`).all();

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
