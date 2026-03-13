// Check classes table schema
export async function onRequestGet(context) {
  try {
    const { env } = context;
    const db = env.DB;

    if (!db) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get table schema
    const schema = await db.prepare(`
      PRAGMA table_info(classes)
    `).all();

    // Try to get a sample record with both possible column names
    let sampleWithSnakeCase = null;
    let sampleWithCamelCase = null;
    let snakeCaseError = null;
    let camelCaseError = null;

    try {
      sampleWithSnakeCase = await db.prepare(`
        SELECT id, academy_id, class_name, teacher_id, created_at 
        FROM classes LIMIT 1
      `).first();
    } catch (error) {
      snakeCaseError = error.message;
    }

    try {
      sampleWithCamelCase = await db.prepare(`
        SELECT id, academyId, name, teacherId, createdAt 
        FROM classes LIMIT 1
      `).first();
    } catch (error) {
      camelCaseError = error.message;
    }

    return new Response(JSON.stringify({
      success: true,
      schema: schema.results,
      tests: {
        snakeCase: {
          data: sampleWithSnakeCase,
          error: snakeCaseError
        },
        camelCase: {
          data: sampleWithCamelCase,
          error: camelCaseError
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
