interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check table schema
    const schema = await DB.prepare(`PRAGMA table_info(attendance_records)`).all();
    
    // Check sample data
    const sampleData = await DB.prepare(`SELECT * FROM attendance_records LIMIT 5`).all();

    return new Response(
      JSON.stringify({
        success: true,
        schema: schema.results,
        sampleData: sampleData.results,
        columnNames: schema.results.map((col: any) => col.name)
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: 'Failed to check schema',
        message: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
