// Migration: Add approvedSenderNumbers column to User table
// GET /api/migrations/add-approved-sender-numbers

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
    console.log('🔧 Starting migration: add approvedSenderNumbers to User table');

    // Add approvedSenderNumbers column to User table
    await env.DB.prepare(`
      ALTER TABLE User ADD COLUMN approvedSenderNumbers TEXT
    `).run();

    console.log('✅ approvedSenderNumbers column added to User table');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Migration completed: approvedSenderNumbers column added to User table'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    // Column already exists error is OK
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️ Column already exists');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Column already exists',
          details: error.message
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.error('❌ Migration error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Migration failed',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
