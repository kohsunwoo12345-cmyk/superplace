import { decodeToken as verifyToken } from '../../_lib/auth';
import { nanoid } from 'nanoid';

interface Env {
  DB: D1Database;
}

interface ExcelRow {
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  relationship?: string;
  studentName?: string;
  studentCode?: string;
  notes?: string;
  [key: string]: string | undefined;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);
    if (!decoded?.userId) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check user role (SUPER_ADMIN or ADMIN only)
    const user = await context.env.DB.prepare(
      'SELECT role FROM User WHERE id = ?'
    ).bind(decoded.userId).first();

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return new Response(JSON.stringify({ error: 'Permission denied' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse JSON body (Excel data should be converted to JSON on frontend)
    const body = await context.request.json() as { 
      data: ExcelRow[];
      groupName?: string;
      groupDescription?: string;
    };

    if (!body.data || !Array.isArray(body.data) || body.data.length === 0) {
      return new Response(JSON.stringify({ error: 'No data provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const results = {
      total: body.data.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
      createdParents: [] as any[],
      groupId: null as string | null
    };

    // Create recipient group if requested
    let groupId: string | null = null;
    if (body.groupName) {
      groupId = nanoid();
      await context.env.DB.prepare(
        `INSERT INTO RecipientGroup (id, name, description, createdById, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).bind(
        groupId,
        body.groupName,
        body.groupDescription || null,
        decoded.userId
      ).run();
      results.groupId = groupId;
    }

    // Process each row
    for (let i = 0; i < body.data.length; i++) {
      const row = body.data[i];
      
      try {
        // Validate required fields
        if (!row.parentName || !row.parentPhone) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Missing parent name or phone`);
          continue;
        }

        // Clean phone number (remove spaces, hyphens)
        const cleanPhone = row.parentPhone.replace(/[\s-]/g, '');
        
        // Check if parent already exists
        const existingParent = await context.env.DB.prepare(
          'SELECT id FROM Parent WHERE phone = ?'
        ).bind(cleanPhone).first();

        let parentId: string;

        if (existingParent) {
          // Update existing parent
          parentId = existingParent.id as string;
          await context.env.DB.prepare(
            `UPDATE Parent 
             SET name = ?, email = ?, relationship = ?, notes = ?, updatedAt = datetime('now')
             WHERE id = ?`
          ).bind(
            row.parentName,
            row.parentEmail || null,
            row.relationship || null,
            row.notes || null,
            parentId
          ).run();
        } else {
          // Create new parent
          parentId = nanoid();
          await context.env.DB.prepare(
            `INSERT INTO Parent (id, name, phone, email, relationship, notes, createdById, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
          ).bind(
            parentId,
            row.parentName,
            cleanPhone,
            row.parentEmail || null,
            row.relationship || null,
            row.notes || null,
            decoded.userId
          ).run();

          results.createdParents.push({
            id: parentId,
            name: row.parentName,
            phone: cleanPhone
          });
        }

        // Link to student if provided
        let studentId: string | null = null;
        if (row.studentCode) {
          const student = await context.env.DB.prepare(
            'SELECT id FROM User WHERE studentCode = ? AND role = ?'
          ).bind(row.studentCode, 'STUDENT').first();

          if (student) {
            studentId = student.id as string;
            
            // Create or update StudentParent relationship
            const existingLink = await context.env.DB.prepare(
              'SELECT id FROM StudentParent WHERE studentId = ? AND parentId = ?'
            ).bind(studentId, parentId).first();

            if (!existingLink) {
              await context.env.DB.prepare(
                `INSERT INTO StudentParent (id, studentId, parentId, isPrimary, createdById, createdAt)
                 VALUES (?, ?, ?, ?, ?, datetime('now'))`
              ).bind(
                nanoid(),
                studentId,
                parentId,
                0, // Not primary by default
                decoded.userId
              ).run();
            }
          } else {
            results.errors.push(`Row ${i + 1}: Student code '${row.studentCode}' not found`);
          }
        }

        // Add to recipient group if group was created
        if (groupId) {
          const existingMember = await context.env.DB.prepare(
            'SELECT id FROM RecipientGroupMember WHERE groupId = ? AND parentId = ?'
          ).bind(groupId, parentId).first();

          if (!existingMember) {
            await context.env.DB.prepare(
              `INSERT INTO RecipientGroupMember (id, groupId, parentId, studentId, createdAt)
               VALUES (?, ?, ?, ?, datetime('now'))`
            ).bind(
              nanoid(),
              groupId,
              parentId,
              studentId
            ).run();
          }
        }

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error.message || 'Unknown error'}`);
        console.error(`Error processing row ${i + 1}:`, error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Excel upload error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process excel upload',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
