import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // @ts-ignore - Cloudflare D1 binding
    const db = process.env.DB;

    if (!db) {
      return NextResponse.json({
        error: 'Database not configured',
        message: 'D1 database binding is missing',
        connected: false,
      }, { status: 500 });
    }

    // Check all major tables
    const tableChecks = await Promise.all([
      // Users
      db.prepare('SELECT COUNT(*) as count FROM users').first(),
      db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').bind('SUPER_ADMIN').first(),
      db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').bind('ADMIN').first(),
      db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').bind('STUDENT').first(),
      
      // Academy
      db.prepare('SELECT COUNT(*) as count FROM academy').first(),
      
      // Classes
      db.prepare('SELECT COUNT(*) as count FROM classes').first(),
      
      // AI Bots
      db.prepare('SELECT COUNT(*) as count FROM ai_bots').first(),
      
      // Attendance
      db.prepare('SELECT COUNT(*) as count FROM attendance_columns').first(),
      db.prepare('SELECT COUNT(*) as count FROM attendance_records').first(),
      
      // Homework
      db.prepare('SELECT COUNT(*) as count FROM homework_assignments').first(),
      db.prepare('SELECT COUNT(*) as count FROM homework_submissions').first(),
      
      // SMS
      db.prepare('SELECT COUNT(*) as count FROM SMSSender').first(),
      db.prepare('SELECT COUNT(*) as count FROM SMSLog').first(),
      db.prepare('SELECT COUNT(*) as count FROM Parent').first(),
      db.prepare('SELECT COUNT(*) as count FROM RecipientGroup').first(),
      
      // Notifications
      db.prepare('SELECT COUNT(*) as count FROM notifications').first(),
    ]);

    // Get sample admin users
    const adminUsers = await db.prepare(
      'SELECT id, email, name, role, createdAt FROM users WHERE role IN (?, ?) LIMIT 5'
    ).bind('SUPER_ADMIN', 'ADMIN').all();

    // Get sample bots
    const bots = await db.prepare(
      'SELECT id, name, description, isActive, createdAt FROM ai_bots LIMIT 5'
    ).all();

    // Get sample academies
    const academies = await db.prepare(
      'SELECT id, name, code, subscriptionPlan, createdAt FROM academy LIMIT 5'
    ).all();

    const results = {
      database: {
        connected: true,
        timestamp: new Date().toISOString(),
      },
      tables: {
        users: {
          total: tableChecks[0]?.count || 0,
          superAdmins: tableChecks[1]?.count || 0,
          admins: tableChecks[2]?.count || 0,
          students: tableChecks[3]?.count || 0,
        },
        academy: {
          total: tableChecks[4]?.count || 0,
        },
        classes: {
          total: tableChecks[5]?.count || 0,
        },
        aiBots: {
          total: tableChecks[6]?.count || 0,
        },
        attendance: {
          columns: tableChecks[7]?.count || 0,
          records: tableChecks[8]?.count || 0,
        },
        homework: {
          assignments: tableChecks[9]?.count || 0,
          submissions: tableChecks[10]?.count || 0,
        },
        sms: {
          senders: tableChecks[11]?.count || 0,
          logs: tableChecks[12]?.count || 0,
          parents: tableChecks[13]?.count || 0,
          groups: tableChecks[14]?.count || 0,
        },
        notifications: {
          total: tableChecks[15]?.count || 0,
        },
      },
      samples: {
        adminUsers: adminUsers.results || [],
        bots: bots.results || [],
        academies: academies.results || [],
      },
      diagnosis: {
        isEmpty: (tableChecks[0]?.count || 0) === 0,
        hasAdmins: (tableChecks[1]?.count || 0) > 0 || (tableChecks[2]?.count || 0) > 0,
        hasBots: (tableChecks[6]?.count || 0) > 0,
        hasAcademies: (tableChecks[4]?.count || 0) > 0,
      },
    };

    // Determine status
    const totalUsers = results.tables.users.total;
    const totalBots = results.tables.aiBots.total;
    const totalAcademies = results.tables.academy.total;

    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EMPTY';
    let message: string;

    if (totalUsers === 0 && totalBots === 0 && totalAcademies === 0) {
      status = 'EMPTY';
      message = '🚨 데이터베이스가 완전히 비어있습니다. 복구가 필요합니다.';
    } else if (!results.diagnosis.hasAdmins) {
      status = 'CRITICAL';
      message = '⚠️ 관리자 계정이 없습니다. 복구가 필요합니다.';
    } else if (totalBots === 0) {
      status = 'WARNING';
      message = '⚠️ AI 봇이 없습니다. 일부 데이터가 손실되었을 수 있습니다.';
    } else {
      status = 'HEALTHY';
      message = '✅ 데이터베이스가 정상입니다.';
    }

    return NextResponse.json({
      status,
      message,
      ...results,
    });

  } catch (error: any) {
    console.error('Database diagnosis error:', error);
    
    return NextResponse.json({
      error: 'Database query failed',
      message: error.message || 'Unknown error',
      connected: false,
      diagnosis: {
        isEmpty: true,
        hasAdmins: false,
        hasBots: false,
        hasAcademies: false,
      },
    }, { status: 500 });
  }
}
