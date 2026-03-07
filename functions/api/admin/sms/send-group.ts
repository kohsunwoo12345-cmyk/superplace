import { verifyToken } from '../../../_lib/auth';
import { sendSMS } from '@/lib/solapi';
import { nanoid } from 'nanoid';

interface Env {
  DB: D1Database;
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
      groupId: string;
      senderId: string;
      message: string;
      reserveTime?: string;
    };

    if (!body.groupId || !body.senderId || !body.message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get group members with parent and student info
    const members = await context.env.DB.prepare(`
      SELECT 
        rgm.id as memberId,
        p.id as parentId,
        p.name as parentName,
        p.phone as parentPhone,
        u.id as studentId,
        u.name as studentName,
        u.studentCode,
        c.id as classId,
        c.name as className
      FROM RecipientGroupMember rgm
      INNER JOIN Parent p ON rgm.parentId = p.id
      LEFT JOIN User u ON rgm.studentId = u.id
      LEFT JOIN Class c ON u.classId = c.id
      WHERE rgm.groupId = ?
    `).bind(body.groupId).all();

    if (!members.results || members.results.length === 0) {
      return new Response(JSON.stringify({ error: 'No members in group' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get sender phone
    const sender = await context.env.DB.prepare(
      'SELECT phone_number FROM SMSSender WHERE id = ?'
    ).bind(body.senderId).first();

    if (!sender) {
      return new Response(JSON.stringify({ error: 'Sender not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const senderPhone = sender.phone_number as string;

    // Determine message type and cost
    const byteSize = new Blob([body.message]).size;
    const messageType = byteSize > 90 ? 'LMS' : 'SMS';
    const costPerMessage = messageType === 'LMS' ? 50 : 20;
    const totalCost = costPerMessage * members.results.length;

    // Check balance
    const balance = await context.env.DB.prepare(
      'SELECT balance FROM SMSBalance WHERE id = ?'
    ).bind('default').first();

    if (!balance || (balance.balance as number) < totalCost) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient balance',
        required: totalCost,
        available: balance?.balance || 0
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process each member
    const results = {
      success: 0,
      failed: 0,
      logs: [] as string[]
    };

    // Deduplicate by phone number
    const uniqueMembers = new Map();
    for (const member of members.results) {
      const phone = member.parentPhone as string;
      if (!uniqueMembers.has(phone)) {
        uniqueMembers.set(phone, member);
      }
    }

    for (const [phone, member] of uniqueMembers) {
      try {
        // Replace placeholders in message
        let personalizedMessage = body.message;
        
        // Replace parent name
        personalizedMessage = personalizedMessage.replace(/\{학부모명\}/g, member.parentName as string);
        personalizedMessage = personalizedMessage.replace(/\{name\}/g, member.parentName as string);
        
        // Replace student info if connected
        if (member.studentId) {
          personalizedMessage = personalizedMessage.replace(/\{학생명\}/g, member.studentName as string || '');
          personalizedMessage = personalizedMessage.replace(/\{학생이름\}/g, member.studentName as string || '');
          personalizedMessage = personalizedMessage.replace(/\{반\}/g, member.className as string || '');
          personalizedMessage = personalizedMessage.replace(/\{학생코드\}/g, member.studentCode as string || '');
        } else {
          // Remove student placeholders if no student connected
          personalizedMessage = personalizedMessage.replace(/\{학생명\}/g, '');
          personalizedMessage = personalizedMessage.replace(/\{학생이름\}/g, '');
          personalizedMessage = personalizedMessage.replace(/\{반\}/g, '');
          personalizedMessage = personalizedMessage.replace(/\{학생코드\}/g, '');
        }

        const logId = nanoid();

        // Send SMS using Solapi
        const sendResult = await sendSMS(
          senderPhone,
          phone,
          personalizedMessage,
          context.env.DB
        );

        // Create log entry
        await context.env.DB.prepare(
          `INSERT INTO SMSLog (id, sender_id, sender_phone, receiver_name, receiver_phone, message, message_type, status, cost, error_message, reserve_time, sent_at, createdById, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'))`
        ).bind(
          logId,
          body.senderId,
          senderPhone,
          member.parentName,
          phone,
          personalizedMessage,
          messageType,
          sendResult.success ? 'success' : 'failed',
          costPerMessage,
          sendResult.error || null,
          body.reserveTime || null,
          decoded.userId
        ).run();

        if (sendResult.success) {
          results.success++;
          results.logs.push(logId);
        } else {
          results.failed++;
        }

      } catch (error: any) {
        results.failed++;
        console.error(`Error sending to ${phone}:`, error);
      }
    }

    // Update balance
    const actualCost = costPerMessage * results.success;
    if (results.success > 0) {
      await context.env.DB.prepare(
        `UPDATE SMSBalance 
         SET balance = balance - ?,
             total_used = total_used + ?,
             lastUsedAt = datetime('now'),
             updatedAt = datetime('now')
         WHERE id = ?`
      ).bind(actualCost, actualCost, 'default').run();

      // Record transaction
      const newBalance = (balance.balance as number) - actualCost;
      await context.env.DB.prepare(
        `INSERT INTO SMSBalanceTransaction (id, type, amount, balance_after, description, createdById, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
      ).bind(
        nanoid(),
        'use',
        actualCost,
        newBalance,
        `Group SMS: ${results.success} messages sent`,
        decoded.userId
      ).run();
    }

    return new Response(JSON.stringify({
      success: true,
      results: {
        total: uniqueMembers.size,
        success: results.success,
        failed: results.failed,
        cost: actualCost,
        newBalance: (balance.balance as number) - actualCost,
        logs: results.logs
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Send group SMS error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to send group SMS',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
