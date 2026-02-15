interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const DB = context.env.DB;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get table schema
    const columns = await DB.prepare(`PRAGMA table_info(students)`).all();
    
    // Get last 5 records
    const records = await DB.prepare(`
      SELECT * FROM students ORDER BY id DESC LIMIT 5
    `).all();

    // Get count
    const count = await DB.prepare(`SELECT COUNT(*) as total FROM students`).first();

    return new Response(
      JSON.stringify({
        success: true,
        schema: columns.results,
        recentRecords: records.results,
        totalCount: count?.total || 0
      }, null, 2),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
