// Migrate data from classes (snake_case) to Class (camelCase)
export async function onRequestPost(context) {
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

    // Get data from classes table
    const oldClasses = await db.prepare(`
      SELECT * FROM classes ORDER BY created_at DESC
    `).all();

    let migratedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const oldClass of oldClasses.results || []) {
      try {
        // Check if already exists in Class table
        const existing = await db.prepare(
          'SELECT id FROM Class WHERE id = ?'
        ).bind(String(oldClass.id)).first();

        if (existing) {
          skippedCount++;
          continue;
        }

        // Insert into Class table
        await db.prepare(`
          INSERT INTO Class (id, name, description, academyId, teacherId, isActive, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, 1, ?, ?)
        `).bind(
          String(oldClass.id),
          oldClass.class_name || oldClass.name || 'Untitled',
          oldClass.description,
          oldClass.academy_id || oldClass.academyId,
          oldClass.teacher_id || oldClass.teacherId,
          oldClass.created_at || oldClass.createdAt,
          oldClass.updated_at || oldClass.createdAt || oldClass.created_at
        ).run();

        migratedCount++;
      } catch (error) {
        errors.push({
          id: oldClass.id,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalOldClasses: oldClasses.results?.length || 0,
      migratedCount,
      skippedCount,
      errorCount: errors.length,
      errors: errors.slice(0, 5) // First 5 errors
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
