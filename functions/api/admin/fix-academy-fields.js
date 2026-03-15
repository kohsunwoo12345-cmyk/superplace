export async function onRequestPost(context) {
  const { env } = context;

  try {
    console.log('🔧 Adding smsPoints and senderNumber fields to Academy table...');

    // Add smsPoints column
    try {
      await env.DB.prepare(`
        ALTER TABLE academy ADD COLUMN smsPoints INTEGER DEFAULT 0
      `).run();
      console.log('✅ Added smsPoints column');
    } catch (e) {
      if (e.message && (e.message.includes('duplicate column') || e.message.includes('already exists'))) {
        console.log('ℹ️  smsPoints column already exists');
      } else {
        console.error('⚠️  Failed to add smsPoints:', e.message);
      }
    }

    // Add senderNumber column
    try {
      await env.DB.prepare(`
        ALTER TABLE academy ADD COLUMN senderNumber TEXT
      `).run();
      console.log('✅ Added senderNumber column');
    } catch (e) {
      if (e.message && (e.message.includes('duplicate column') || e.message.includes('already exists'))) {
        console.log('ℹ️  senderNumber column already exists');
      } else {
        console.error('⚠️  Failed to add senderNumber:', e.message);
      }
    }

    // Add registeredSenderNumbers column (JSON field for multiple numbers)
    try {
      await env.DB.prepare(`
        ALTER TABLE academy ADD COLUMN registeredSenderNumbers TEXT
      `).run();
      console.log('✅ Added registeredSenderNumbers column');
    } catch (e) {
      if (e.message && (e.message.includes('duplicate column') || e.message.includes('already exists'))) {
        console.log('ℹ️  registeredSenderNumbers column already exists');
      } else {
        console.error('⚠️  Failed to add registeredSenderNumbers:', e.message);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Academy table fields added/verified successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fixing academy fields:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    message: 'Use POST to add smsPoints and senderNumber fields to Academy table',
    endpoint: '/api/admin/fix-academy-fields'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
