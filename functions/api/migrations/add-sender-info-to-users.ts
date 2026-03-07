// Migration: Add sender number and Kakao channel ID columns to users table
// GET /api/migrations/add-sender-info-to-users

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    console.log('🔧 Starting migration: add sender info to users');
    const db = env.DB;

    // Add approved_sender_numbers column (comma-separated list)
    try {
      await db
        .prepare(`
          ALTER TABLE users 
          ADD COLUMN approved_sender_numbers TEXT
        `)
        .run();
      console.log('✅ Added approved_sender_numbers column to users');
    } catch (error: any) {
      if (!error.message.includes('duplicate column name')) {
        throw error;
      }
      console.log('ℹ️ approved_sender_numbers column already exists');
    }

    // Add kakao_pf_id column
    try {
      await db
        .prepare(`
          ALTER TABLE users 
          ADD COLUMN kakao_pf_id TEXT
        `)
        .run();
      console.log('✅ Added kakao_pf_id column to users');
    } catch (error: any) {
      if (!error.message.includes('duplicate column name')) {
        throw error;
      }
      console.log('ℹ️ kakao_pf_id column already exists');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Migration completed successfully',
        changes: [
          'Added approved_sender_numbers TEXT column to users',
          'Added kakao_pf_id TEXT column to users',
        ],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ Migration error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Migration failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
