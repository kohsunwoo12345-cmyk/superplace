// Add points column to users table
// GET /api/migrations/add-points-column

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    console.log("🔧 Starting migration: Add points column to users table");

    // Check if column already exists
    const checkColumn = await env.DB.prepare(`
      PRAGMA table_info(users)
    `).all();

    const hasPoints = checkColumn.results.some((col: any) => col.name === 'points');

    if (hasPoints) {
      console.log("✅ points column already exists");
      return new Response(
        JSON.stringify({
          success: true,
          message: "points column already exists",
          skipped: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Add points column with default value 0
    await env.DB.prepare(`
      ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0
    `).run();

    console.log("✅ Added points column to users table");

    // Set default points for existing users (10000 for testing)
    await env.DB.prepare(`
      UPDATE users SET points = 10000 WHERE points IS NULL OR points = 0
    `).run();

    console.log("✅ Set default points (10000) for existing users");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully added points column and set default values",
        table: "users",
        column: "points",
        defaultValue: 10000,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Migration failed:", error);
    return new Response(
      JSON.stringify({
        error: "Migration failed",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
