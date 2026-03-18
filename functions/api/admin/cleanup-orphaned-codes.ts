/**
 * Cleanup orphaned attendance codes
 * Removes codes where userId doesn't exist in users table
 */

interface Env {
  DB: D1Database;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(
      JSON.stringify({ success: false, error: "Database not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    console.log('🧹 Starting cleanup of orphaned attendance codes...');

    // 1. Find orphaned codes (userId not in users table)
    const orphanedCodesQuery = await DB.prepare(`
      SELECT sac.id, sac.userId, sac.code 
      FROM student_attendance_codes sac 
      LEFT JOIN users u ON sac.userId = u.id 
      WHERE u.id IS NULL
    `).all();

    const orphanedCodes = orphanedCodesQuery.results || [];
    console.log(`📊 Found ${orphanedCodes.length} orphaned attendance codes`);

    if (orphanedCodes.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No orphaned codes found",
          stats: {
            totalOrphaned: 0,
            deleted: 0
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Delete orphaned codes
    let deletedCount = 0;
    const failedDeletions: any[] = [];

    for (const code of orphanedCodes) {
      try {
        await DB.prepare(`
          DELETE FROM student_attendance_codes 
          WHERE id = ?
        `).bind(code.id).run();
        
        deletedCount++;
        console.log(`✅ Deleted orphaned code: ${code.code} (userId: ${code.userId})`);
      } catch (error) {
        console.error(`❌ Failed to delete code ${code.code}:`, error);
        failedDeletions.push({
          code: code.code,
          userId: code.userId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    console.log(`✅ Cleanup completed: ${deletedCount} deleted, ${failedDeletions.length} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Cleanup completed",
        stats: {
          totalOrphaned: orphanedCodes.length,
          deleted: deletedCount,
          failed: failedDeletions.length
        },
        failedDeletions: failedDeletions
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Cleanup failed",
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
