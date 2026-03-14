// StoreProducts 테이블 스키마 확인
interface Env {
  DB: D1Database;
}

export const onRequestGet = async (context: any) => {
  const { env } = context;
  const DB = env.DB;

  if (!DB) {
    return new Response(
      JSON.stringify({ error: "Database not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // PRAGMA table_info로 컬럼 정보 가져오기
    const { results } = await DB.prepare(`PRAGMA table_info(StoreProducts)`).all();
    
    const columns = results.map((col: any) => ({
      name: col.name,
      type: col.type,
      notnull: col.notnull,
      dflt_value: col.dflt_value,
      pk: col.pk
    }));

    return new Response(
      JSON.stringify({
        success: true,
        tableName: 'StoreProducts',
        columnCount: columns.length,
        columns
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
