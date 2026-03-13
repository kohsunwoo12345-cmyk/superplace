// Check Class table (original camelCase table)
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

    // Get data from Class table (camelCase)
    const classes = await db.prepare(`
      SELECT * FROM Class ORDER BY createdAt DESC LIMIT 10
    `).all();

    // Get ClassStudent data
    const classStudents = await db.prepare(`
      SELECT * FROM ClassStudent LIMIT 10
    `).all();

    // Get ClassSchedule data
    const classSchedules = await db.prepare(`
      SELECT * FROM ClassSchedule LIMIT 10
    `).all();

    return new Response(JSON.stringify({
      success: true,
      classCount: classes.results?.length || 0,
      classes: classes.results || [],
      classStudentCount: classStudents.results?.length || 0,
      classStudents: classStudents.results || [],
      classScheduleCount: classSchedules.results?.length || 0,
      classSchedules: classSchedules.results || []
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
