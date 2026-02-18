import { decodeToken as verifyToken } from '../../_lib/auth';
import { nanoid } from 'nanoid';

interface Env {
  DB: D1Database;
}

// GET: Get group details with members
export const onRequestGet: PagesFunction<Env> = async (context) => {
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

    const groupId = context.params.id as string;

    // Get group info
    const group = await context.env.DB.prepare(
      'SELECT * FROM RecipientGroup WHERE id = ?'
    ).bind(groupId).first();

    if (!group) {
      return new Response(JSON.stringify({ error: 'Group not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get members with parent and student info
    const members = await context.env.DB.prepare(`
      SELECT 
        rgm.id as memberId,
        rgm.parentId,
        rgm.studentId,
        p.name as parentName,
        p.phone as parentPhone,
        p.email as parentEmail,
        p.relationship,
        u.name as studentName,
        u.studentCode,
        c.name as className
      FROM RecipientGroupMember rgm
      INNER JOIN Parent p ON rgm.parentId = p.id
      LEFT JOIN User u ON rgm.studentId = u.id
      LEFT JOIN Class c ON u.classId = c.id
      WHERE rgm.groupId = ?
      ORDER BY p.name
    `).bind(groupId).all();

    return new Response(JSON.stringify({
      success: true,
      group,
      members: members.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Get group details error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get group details',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT: Update group
export const onRequestPut: PagesFunction<Env> = async (context) => {
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

    const user = await context.env.DB.prepare(
      'SELECT role FROM User WHERE id = ?'
    ).bind(decoded.userId).first();

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return new Response(JSON.stringify({ error: 'Permission denied' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const groupId = context.params.id as string;
    const body = await context.request.json() as {
      name?: string;
      description?: string;
      addMembers?: Array<{ parentId: string; studentId?: string }>;
      removeMembers?: string[]; // member IDs
    };

    // Update group info
    if (body.name !== undefined || body.description !== undefined) {
      await context.env.DB.prepare(
        `UPDATE RecipientGroup 
         SET name = COALESCE(?, name),
             description = COALESCE(?, description),
             updatedAt = datetime('now')
         WHERE id = ?`
      ).bind(
        body.name || null,
        body.description || null,
        groupId
      ).run();
    }

    // Add new members
    if (body.addMembers && body.addMembers.length > 0) {
      for (const member of body.addMembers) {
        // Check if already exists
        const existing = await context.env.DB.prepare(
          'SELECT id FROM RecipientGroupMember WHERE groupId = ? AND parentId = ?'
        ).bind(groupId, member.parentId).first();

        if (!existing) {
          await context.env.DB.prepare(
            `INSERT INTO RecipientGroupMember (id, groupId, parentId, studentId, createdAt)
             VALUES (?, ?, ?, ?, datetime('now'))`
          ).bind(
            nanoid(),
            groupId,
            member.parentId,
            member.studentId || null
          ).run();
        }
      }
    }

    // Remove members
    if (body.removeMembers && body.removeMembers.length > 0) {
      for (const memberId of body.removeMembers) {
        await context.env.DB.prepare(
          'DELETE FROM RecipientGroupMember WHERE id = ?'
        ).bind(memberId).run();
      }
    }

    // Get updated group
    const group = await context.env.DB.prepare(
      'SELECT * FROM RecipientGroup WHERE id = ?'
    ).bind(groupId).first();

    return new Response(JSON.stringify({
      success: true,
      group
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Update group error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update group',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: Delete group
export const onRequestDelete: PagesFunction<Env> = async (context) => {
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

    const user = await context.env.DB.prepare(
      'SELECT role FROM User WHERE id = ?'
    ).bind(decoded.userId).first();

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return new Response(JSON.stringify({ error: 'Permission denied' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const groupId = context.params.id as string;

    // Delete group (cascade will delete members)
    await context.env.DB.prepare(
      'DELETE FROM RecipientGroup WHERE id = ?'
    ).bind(groupId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Group deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Delete group error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete group',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
