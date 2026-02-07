interface Env {
  DB: D1Database;
}

/**
 * Reset Attendance System API
 * 
 * POST /api/admin/reset-attendance
 * - Drop and recreate attendance tables with clean, unified schema
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({
          error: 'Database not configured',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 Starting attendance system reset...');

    // 1. Drop existing tables
    try {
      await DB.prepare('DROP TABLE IF EXISTS attendance_records').run();
      console.log('✅ Dropped attendance_records');
    } catch (e: any) {
      console.log('⚠️  attendance_records drop warning:', e.message);
    }

    // 2. Create attendance_records with UNIFIED schema
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        attendanceCode TEXT NOT NULL,
        checkInTime TEXT DEFAULT (datetime('now')),
        checkInType TEXT DEFAULT 'CODE',
        academyId INTEGER,
        classId TEXT,
        status TEXT DEFAULT 'PRESENT',
        note TEXT
      )
    `).run();
    console.log('✅ Created attendance_records with unified schema');

    // 3. Verify table schema
    const schema = await DB.prepare(`PRAGMA table_info(attendance_records)`).all();
    const columns = schema.results.map((col: any) => col.name);
    console.log('📊 attendance_records columns:', columns);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Attendance system reset successfully',
        schema: {
          table: 'attendance_records',
          columns: columns
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Reset error:', error);
    return new Response(
      JSON.stringify({
        error: 'Reset failed',
        message: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
