// Initialize Seminars Tables

async function initializeTables(db) {
  console.log('📦 Initializing seminars tables...');

  // Create seminars table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS seminars (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      detailHtml TEXT,
      mainImage TEXT,
      instructor TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      location TEXT,
      locationType TEXT,
      maxParticipants INTEGER DEFAULT 100,
      status TEXT DEFAULT 'active',
      formHtml TEXT,
      useCustomForm INTEGER DEFAULT 0,
      createdBy TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `).run();

  // Add new columns if they don't exist (migration)
  try {
    await db.prepare(`
      ALTER TABLE seminars ADD COLUMN ctaButtonText TEXT DEFAULT '신청하기'
    `).run();
    console.log('✅ Added ctaButtonText column');
  } catch (error) {
    if (error.message.includes('duplicate column')) {
      console.log('⚠️ ctaButtonText column already exists');
    } else if (!error.message.includes('no such table')) {
      console.error('Error adding ctaButtonText:', error.message);
    }
  }

  try {
    await db.prepare(`
      ALTER TABLE seminars ADD COLUMN requiredFields TEXT
    `).run();
    console.log('✅ Added requiredFields column');
  } catch (error) {
    if (error.message.includes('duplicate column')) {
      console.log('⚠️ requiredFields column already exists');
    } else if (!error.message.includes('no such table')) {
      console.error('Error adding requiredFields:', error.message);
    }
  }

  // Create seminar_applications table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS seminar_applications (
      id TEXT PRIMARY KEY,
      seminarId TEXT NOT NULL,
      applicantName TEXT NOT NULL,
      applicantEmail TEXT NOT NULL,
      applicantPhone TEXT,
      academyName TEXT,
      position TEXT,
      additionalInfo TEXT,
      status TEXT DEFAULT 'pending',
      appliedAt TEXT NOT NULL
    )
  `).run();

  // Create indexes
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_seminars_date ON seminars(date)
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_seminars_status ON seminars(status)
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_seminar_applications_seminar ON seminar_applications(seminarId)
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_seminar_applications_email ON seminar_applications(applicantEmail)
  `).run();

  console.log('✅ Seminars tables initialized');
}

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

    await initializeTables(db);

    return new Response(JSON.stringify({
      success: true,
      message: 'Seminars tables initialized successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error initializing tables:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

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

    await initializeTables(db);

    return new Response(JSON.stringify({
      success: true,
      message: 'Seminars tables initialized successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error initializing tables:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
