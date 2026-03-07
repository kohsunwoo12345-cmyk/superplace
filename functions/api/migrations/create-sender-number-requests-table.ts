// Migration: Create sender_number_requests table
// GET /api/migrations/create-sender-number-requests-table

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
    console.log('🔧 Starting migration: create sender_number_requests table');

    // Create sender_number_requests table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS sender_number_requests (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        userName TEXT,
        companyName TEXT NOT NULL,
        businessNumber TEXT NOT NULL,
        address TEXT,
        senderNumbers TEXT NOT NULL,
        representativeName TEXT,
        phone TEXT,
        email TEXT,
        telecomCertificateUrl TEXT,
        businessRegistrationUrl TEXT,
        serviceAgreementUrl TEXT,
        privacyAgreementUrl TEXT,
        status TEXT DEFAULT 'PENDING',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        approvedAt TEXT,
        approvedBy TEXT,
        rejectedAt TEXT,
        rejectedBy TEXT,
        rejectionReason TEXT
      )
    `).run();

    console.log('✅ sender_number_requests table created');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Migration completed successfully',
        tables: ['sender_number_requests']
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
