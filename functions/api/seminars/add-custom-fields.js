// Add custom form fields to seminars table
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

    console.log('🔧 Adding custom form fields to seminars table...');

    // Check if columns already exist
    const tableInfo = await db.prepare(`
      PRAGMA table_info(seminars)
    `).all();

    const columns = tableInfo.results.map(col => col.name);
    console.log('📋 Existing columns:', columns);

    const columnsToAdd = [];
    
    if (!columns.includes('ctaButtonText')) {
      columnsToAdd.push({
        name: 'ctaButtonText',
        sql: 'ALTER TABLE seminars ADD COLUMN ctaButtonText TEXT DEFAULT "신청하기"'
      });
    }

    if (!columns.includes('requiredFields')) {
      columnsToAdd.push({
        name: 'requiredFields',
        sql: 'ALTER TABLE seminars ADD COLUMN requiredFields TEXT'
      });
    }

    if (columnsToAdd.length === 0) {
      console.log('✅ All columns already exist');
      return new Response(JSON.stringify({
        success: true,
        message: 'Custom form fields already exist',
        existingColumns: columns
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add missing columns
    for (const col of columnsToAdd) {
      console.log(`📝 Adding column: ${col.name}`);
      await db.prepare(col.sql).run();
      console.log(`✅ Added column: ${col.name}`);
    }

    console.log('✅ Successfully added custom form fields');

    return new Response(JSON.stringify({
      success: true,
      message: 'Custom form fields added successfully',
      addedColumns: columnsToAdd.map(c => c.name)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error adding custom form fields:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
