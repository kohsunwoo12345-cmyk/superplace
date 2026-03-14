interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  
  try {
    // Get all tables
    const tables = await DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
    
    const schema: any = {};
    
    for (const table of tables.results as any[]) {
      const tableName = table.name;
      
      // Get columns for each table
      const columns = await DB.prepare(`PRAGMA table_info(${tableName})`).all();
      
      // Get foreign keys
      const fks = await DB.prepare(`PRAGMA foreign_key_list(${tableName})`).all();
      
      schema[tableName] = {
        columns: columns.results,
        foreignKeys: fks.results
      };
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      tables: tables.results.map((t: any) => t.name),
      schema: schema 
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
