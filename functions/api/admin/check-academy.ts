interface Env {
  DB: D1Database;
}

// Academy 테이블 확인 및 생성
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('🔍 Checking academy table...');

    // Academy 테이블 존재 확인
    try {
      const academies = await DB.prepare(`SELECT * FROM academy LIMIT 5`).all();
      console.log(`✅ Academy table exists with ${academies.results.length} records`);
      
      return new Response(
        JSON.stringify({
          success: true,
          tableExists: true,
          academies: academies.results,
          count: academies.results.length,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (tableError: any) {
      console.error('❌ Academy table does not exist:', tableError.message);
      
      // 테이블 생성 시도
      try {
        await DB.prepare(`
          CREATE TABLE IF NOT EXISTS academy (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            address TEXT,
            phone TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        
        console.log('✅ Created academy table');
        
        return new Response(
          JSON.stringify({
            success: true,
            tableExists: false,
            tableCreated: true,
            message: 'Academy table created successfully',
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (createError: any) {
        console.error('❌ Failed to create academy table:', createError);
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to create academy table',
            message: createError.message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }
  } catch (error: any) {
    console.error("Check academy error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to check academy table",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
