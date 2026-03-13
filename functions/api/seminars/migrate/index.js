// Migrate seminars table to add custom form fields

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

    console.log('🔄 Starting seminars table migration...');

    // Add ctaButtonText column if it doesn't exist
    try {
      await db.prepare(`
        ALTER TABLE seminars ADD COLUMN ctaButtonText TEXT DEFAULT '신청하기'
      `).run();
      console.log('✅ Added ctaButtonText column');
    } catch (error) {
      if (error.message.includes('duplicate column')) {
        console.log('⚠️ ctaButtonText column already exists');
      } else {
        throw error;
      }
    }

    // Add requiredFields column if it doesn't exist
    try {
      await db.prepare(`
        ALTER TABLE seminars ADD COLUMN requiredFields TEXT
      `).run();
      console.log('✅ Added requiredFields column');
    } catch (error) {
      if (error.message.includes('duplicate column')) {
        console.log('⚠️ requiredFields column already exists');
      } else {
        throw error;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Seminars table migrated successfully',
      addedColumns: ['ctaButtonText', 'requiredFields']
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
