// Fix PointChargeRequest table - Add missing academyId column

export async function onRequest(context) {
  const { env } = context;
  
  try {
    console.log('🔧 Fixing PointChargeRequest table...');
    
    // 1. Check if academyId column exists
    const tableInfo = await env.DB.prepare(`
      PRAGMA table_info(PointChargeRequest)
    `).all();
    
    console.log('📋 Current columns:', tableInfo.results?.map(c => c.name).join(', '));
    
    const hasAcademyId = tableInfo.results?.some(col => col.name === 'academyId');
    
    if (hasAcademyId) {
      console.log('✅ academyId column already exists');
      return new Response(JSON.stringify({
        success: true,
        message: 'academyId column already exists',
        columns: tableInfo.results?.map(c => c.name)
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Add academyId column
    console.log('➕ Adding academyId column...');
    await env.DB.prepare(`
      ALTER TABLE PointChargeRequest ADD COLUMN academyId TEXT
    `).run();
    
    console.log('✅ academyId column added');
    
    // 3. Update existing records with academyId from users table
    console.log('🔄 Updating existing records with academyId...');
    const updateResult = await env.DB.prepare(`
      UPDATE PointChargeRequest 
      SET academyId = (
        SELECT academyId FROM User WHERE User.id = PointChargeRequest.userId
      )
      WHERE academyId IS NULL AND userId IS NOT NULL
    `).run();
    
    console.log(`✅ Updated ${updateResult.meta?.changes || 0} records`);
    
    // 3.5. Check if there are still NULL academyIds
    const nullCheck = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM PointChargeRequest WHERE academyId IS NULL
    `).first();
    
    if (nullCheck && nullCheck.count > 0) {
      console.warn(`⚠️ Still ${nullCheck.count} records with NULL academyId`);
    }
    
    // 4. Verify the fix
    const updatedTableInfo = await env.DB.prepare(`
      PRAGMA table_info(PointChargeRequest)
    `).all();
    
    console.log('📋 Updated columns:', updatedTableInfo.results?.map(c => c.name).join(', '));
    
    // 5. Check sample data (including NULL academyIds)
    const sampleData = await env.DB.prepare(`
      SELECT 
        pcr.id, 
        pcr.userId, 
        pcr.academyId,
        pcr.requestedPoints, 
        pcr.status, 
        pcr.createdAt,
        u.name as userName,
        u.email as userEmail,
        u.academyId as userAcademyId
      FROM PointChargeRequest pcr
      LEFT JOIN User u ON pcr.userId = u.id
      ORDER BY pcr.createdAt DESC
      LIMIT 10
    `).all();
    
    console.log('📊 Sample data:', sampleData.results);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'PointChargeRequest table fixed successfully',
      columnsAdded: ['academyId'],
      recordsUpdated: updateResult.meta?.changes || 0,
      columns: updatedTableInfo.results?.map(c => c.name),
      sampleData: sampleData.results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error fixing table:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
