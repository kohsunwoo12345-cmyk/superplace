// Migration: Add senderPhone and senderPfId columns to AlimtalkTemplate table
// GET /api/migrations/add-sender-info-to-template

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
    console.log('🔧 Starting migration: add senderPhone and senderPfId to AlimtalkTemplate');

    // Add senderPhone column
    try {
      await env.DB.prepare(`
        ALTER TABLE AlimtalkTemplate ADD COLUMN senderPhone TEXT
      `).run();
      console.log('✅ Added senderPhone column');
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('⚠️ senderPhone column already exists');
      } else {
        throw error;
      }
    }

    // Add senderPfId column
    try {
      await env.DB.prepare(`
        ALTER TABLE AlimtalkTemplate ADD COLUMN senderPfId TEXT
      `).run();
      console.log('✅ Added senderPfId column');
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('⚠️ senderPfId column already exists');
      } else {
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Migration completed successfully',
        changes: [
          'Added senderPhone TEXT column',
          'Added senderPfId TEXT column'
        ]
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
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
