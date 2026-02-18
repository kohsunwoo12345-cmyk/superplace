import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // @ts-ignore - Cloudflare D1 binding
    const db = process.env.DB;

    if (!db) {
      return NextResponse.json({
        error: 'Database not configured',
      }, { status: 500 });
    }

    const results = [];

    // 1. Create admin user
    try {
      await db.prepare(`
        INSERT OR REPLACE INTO users (id, email, password, name, role, phone, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        'admin-superplace-001',
        'admin@superplace.co.kr',
        '$2a$10$rqZ8vKJXLZ9HhqYqN7yM4.OXqZGqJ0Yh0wJWqKqJZqJZqJZqJZqJZ', // bcrypt hash for admin123456
        '슈퍼플레이스 관리자',
        'SUPER_ADMIN',
        '010-8739-9697'
      ).run();
      results.push('✅ Admin user created');
    } catch (e: any) {
      results.push(`⚠️ Admin user: ${e.message}`);
    }

    // 2. Create academy
    try {
      await db.prepare(`
        INSERT OR REPLACE INTO academy (id, name, code, description, address, phone, email, subscriptionPlan, maxStudents, maxTeachers, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        'academy-superplace-001',
        '슈퍼플레이스 학원',
        'SUPERPLACE01',
        '체계적인 학습 관리를 위한 스마트 학원',
        '인천광역시 서구 청라커낼로 270, 2층',
        '010-8739-9697',
        'academy@superplace.com',
        'PREMIUM',
        100,
        10,
        1
      ).run();
      results.push('✅ Academy created');
    } catch (e: any) {
      results.push(`⚠️ Academy: ${e.message}`);
    }

    // 3. Create AI Bots
    const bots = [
      {
        id: 'bot-assistant-001',
        name: '학습 도우미',
        description: '학생들의 학습을 돕는 AI 어시스턴트',
        systemPrompt: '당신은 친절하고 도움이 되는 학습 도우미입니다. 학생들의 질문에 명확하고 이해하기 쉽게 답변해주세요.',
      },
      {
        id: 'bot-math-001',
        name: '수학 튜터',
        description: '수학 문제 해결을 돕는 AI 튜터',
        systemPrompt: '당신은 수학 전문 튜터입니다. 수학 문제를 단계별로 설명하고 개념을 명확히 가르쳐주세요.',
      },
      {
        id: 'bot-english-001',
        name: '영어 튜터',
        description: '영어 학습을 돕는 AI 튜터',
        systemPrompt: '당신은 영어 전문 튜터입니다. 영어 문법, 단어, 회화를 친절하게 가르쳐주세요.',
      },
    ];

    for (const bot of bots) {
      try {
        await db.prepare(`
          INSERT OR REPLACE INTO ai_bots (id, name, description, systemPrompt, modelType, temperature, maxTokens, isActive, createdById, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          bot.id,
          bot.name,
          bot.description,
          bot.systemPrompt,
          'gemini-pro',
          0.7,
          1000,
          1,
          'admin-superplace-001'
        ).run();
        results.push(`✅ Bot created: ${bot.name}`);
      } catch (e: any) {
        results.push(`⚠️ Bot ${bot.name}: ${e.message}`);
      }
    }

    // 4. Create sample students
    const students = [
      { id: 'student-001', name: '김민수', email: 'minsu@example.com', studentCode: 'ST001', className: '초등 4학년' },
      { id: 'student-002', name: '이지은', email: 'jieun@example.com', studentCode: 'ST002', className: '초등 5학년' },
      { id: 'student-003', name: '박서준', email: 'seojun@example.com', studentCode: 'ST003', className: '초등 6학년' },
    ];

    for (const student of students) {
      try {
        await db.prepare(`
          INSERT OR REPLACE INTO users (id, email, password, name, role, phone, studentCode, className, academyId, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          student.id,
          student.email,
          '$2a$10$rqZ8vKJXLZ9HhqYqN7yM4.OXqZGqJ0Yh0wJWqKqJZqJZqJZqJZqJZ', // password: student123
          student.name,
          'STUDENT',
          '010-0000-0000',
          student.studentCode,
          student.className,
          'academy-superplace-001'
        ).run();
        results.push(`✅ Student created: ${student.name}`);
      } catch (e: any) {
        results.push(`⚠️ Student ${student.name}: ${e.message}`);
      }
    }

    // 5. Create sample classes
    const classes = [
      { id: 'class-001', name: '초등 수학 A반', description: '초등 4-5학년 수학 기초반' },
      { id: 'class-002', name: '초등 영어 B반', description: '초등 5-6학년 영어 회화반' },
    ];

    for (const cls of classes) {
      try {
        await db.prepare(`
          INSERT OR REPLACE INTO classes (id, name, description, academyId, isActive, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          cls.id,
          cls.name,
          cls.description,
          'academy-superplace-001',
          1
        ).run();
        results.push(`✅ Class created: ${cls.name}`);
      } catch (e: any) {
        results.push(`⚠️ Class ${cls.name}: ${e.message}`);
      }
    }

    // 6. Create SMS Balance
    try {
      await db.prepare(`
        INSERT OR REPLACE INTO SMSBalance (id, balance, total_charged, total_used, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        'sms-balance-001',
        10000,
        10000,
        0
      ).run();
      results.push('✅ SMS Balance initialized (10,000P)');
    } catch (e: any) {
      results.push(`⚠️ SMS Balance: ${e.message}`);
    }

    // 7. Create sample parents
    const parents = [
      { id: 'parent-001', name: '김영희', phone: '010-1234-5678', studentId: 'student-001' },
      { id: 'parent-002', name: '이철수', phone: '010-2345-6789', studentId: 'student-002' },
      { id: 'parent-003', name: '박미영', phone: '010-3456-7890', studentId: 'student-003' },
    ];

    for (const parent of parents) {
      try {
        await db.prepare(`
          INSERT OR REPLACE INTO Parent (id, name, phone, relationship, createdById, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          parent.id,
          parent.name,
          parent.phone,
          '부모',
          'admin-superplace-001'
        ).run();

        // Link parent to student
        await db.prepare(`
          INSERT OR REPLACE INTO StudentParent (id, studentId, parentId, isPrimary, createdById, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          `sp-${parent.id}`,
          parent.studentId,
          parent.id,
          1,
          'admin-superplace-001'
        ).run();

        results.push(`✅ Parent created: ${parent.name}`);
      } catch (e: any) {
        results.push(`⚠️ Parent ${parent.name}: ${e.message}`);
      }
    }

    // Verify data
    const userCount = await db.prepare('SELECT COUNT(*) as count FROM users').first();
    const botCount = await db.prepare('SELECT COUNT(*) as count FROM ai_bots').first();
    const academyCount = await db.prepare('SELECT COUNT(*) as count FROM academy').first();
    const classCount = await db.prepare('SELECT COUNT(*) as count FROM classes').first();
    const parentCount = await db.prepare('SELECT COUNT(*) as count FROM Parent').first();

    return NextResponse.json({
      success: true,
      message: 'Database populated successfully!',
      results,
      summary: {
        users: userCount?.count || 0,
        bots: botCount?.count || 0,
        academies: academyCount?.count || 0,
        classes: classCount?.count || 0,
        parents: parentCount?.count || 0,
      },
    });

  } catch (error: any) {
    console.error('Database population error:', error);
    return NextResponse.json({
      error: 'Failed to populate database',
      message: error.message,
    }, { status: 500 });
  }
}
