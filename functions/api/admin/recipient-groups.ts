import { decodeToken as verifyToken } from '../_lib/auth';
import { nanoid } from 'nanoid';

interface Env {
  DB: D1Database;
}

// GET: List all recipient groups
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

    // Get all recipient groups with member count
    const groups = await context.env.DB.prepare(`
      SELECT 
        rg.id,
        rg.name,
        rg.description,
        rg.createdById,
        rg.createdAt,
        rg.updatedAt,
        COUNT(rgm.id) as memberCount
      FROM RecipientGroup rg
      LEFT JOIN RecipientGroupMember rgm ON rg.id = rgm.groupId
      GROUP BY rg.id
      ORDER BY rg.createdAt DESC
    `).all();

    return new Response(JSON.stringify({
      success: true,
      groups: groups.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Get recipient groups error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get recipient groups',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST: Create new recipient group
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

    // Check user role
    const user = await context.env.DB.prepare(
      'SELECT role FROM User WHERE id = ?'
    ).bind(decoded.userId).first();

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return new Response(JSON.stringify({ error: 'Permission denied' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await context.request.json() as {
      name: string;
      description?: string;
      members?: Array<{ parentId: string; studentId?: string }>;
    };

    if (!body.name) {
      return new Response(JSON.stringify({ error: 'Group name is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const groupId = nanoid();

    // Create group
    await context.env.DB.prepare(
      `INSERT INTO RecipientGroup (id, name, description, createdById, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      groupId,
      body.name,
      body.description || null,
      decoded.userId
    ).run();

    // Add members if provided
    if (body.members && body.members.length > 0) {
      for (const member of body.members) {
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

    // Get created group with member count
    const group = await context.env.DB.prepare(`
      SELECT 
        rg.id,
        rg.name,
        rg.description,
        rg.createdById,
        rg.createdAt,
        rg.updatedAt,
        COUNT(rgm.id) as memberCount
      FROM RecipientGroup rg
      LEFT JOIN RecipientGroupMember rgm ON rg.id = rgm.groupId
      WHERE rg.id = ?
      GROUP BY rg.id
    `).bind(groupId).first();

    return new Response(JSON.stringify({
      success: true,
      group
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Create recipient group error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create recipient group',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
