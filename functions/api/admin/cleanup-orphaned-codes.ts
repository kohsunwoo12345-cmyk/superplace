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

    // 2. Deactivate orphaned codes (set isActive = 0)
    let deactivatedCount = 0;
    const failedDeactivations: any[] = [];

    for (const code of orphanedCodes) {
      try {
        await DB.prepare(`
          UPDATE student_attendance_codes 
          SET isActive = 0
          WHERE id = ?
        `).bind(code.id).run();
        
        deactivatedCount++;
        console.log(`✅ Deactivated orphaned code: ${code.code} (userId: ${code.userId})`);
      } catch (error) {
        console.error(`❌ Failed to deactivate code ${code.code}:`, error);
        failedDeactivations.push({
          code: code.code,
          userId: code.userId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    console.log(`✅ Cleanup completed: ${deactivatedCount} deactivated, ${failedDeactivations.length} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Cleanup completed - orphaned codes deactivated",
        stats: {
          totalOrphaned: orphanedCodes.length,
          deactivated: deactivatedCount,
          failed: failedDeactivations.length
        },
        failedDeactivations: failedDeactivations,
        orphanedCodes: orphanedCodes.map(c => ({ userId: c.userId, code: c.code }))
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
