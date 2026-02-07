interface Env {
  DB: D1Database;
}

// 샘플 데이터 생성 API
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let createdData: any = {
      academies: 0,
      users: 0,
      attendance: 0,
      homework: 0,
      aiUsage: 0,
      revenue: 0,
      payments: 0,
    };

    // 1. 학원 테이블 확인 및 샘플 데이터 생성
    try {
      const existingAcademies = await DB.prepare(`SELECT COUNT(*) as count FROM academy`).first();
      
      if (!existingAcademies || existingAcademies.count === 0) {
        // 샘플 학원 5개 생성
        const academyNames = ['서울학원', '강남학원', '대치학원', '목동학원', '분당학원'];
        for (let i = 0; i < academyNames.length; i++) {
          await DB.prepare(`
            INSERT INTO academy (name, directorName, phone, email, address, isActive, createdAt)
            VALUES (?, ?, ?, ?, ?, 1, datetime('now', '-${i} days'))
          `).bind(
            academyNames[i],
            `원장${i + 1}`,
            `010-1234-${1000 + i}`,
            `director${i + 1}@academy.com`,
            `서울시 강남구 테헤란로 ${100 + i}번길`
          ).run();
          createdData.academies++;
        }
      }
    } catch (e) {
      console.log("Academy table error:", e);
    }

    // 2. 사용자 샘플 데이터 생성
    try {
      const existingUsers = await DB.prepare(`SELECT COUNT(*) as count FROM users`).first();
      
      if (!existingUsers || existingUsers.count === 0) {
        // 학원장 5명
        for (let i = 1; i <= 5; i++) {
          await DB.prepare(`
            INSERT INTO users (email, name, password, role, academyId, createdAt)
            VALUES (?, ?, ?, 'DIRECTOR', ?, datetime('now', '-${i} days'))
          `).bind(
            `director${i}@academy.com`,
            `원장${i}`,
            'hashed_password',
            i
          ).run();
          createdData.users++;
        }

        // 선생님 10명
        for (let i = 1; i <= 10; i++) {
          const academyId = Math.ceil(i / 2); // 학원당 2명
          await DB.prepare(`
            INSERT INTO users (email, name, password, role, academyId, createdAt)
            VALUES (?, ?, ?, 'TEACHER', ?, datetime('now', '-${i} days'))
          `).bind(
            `teacher${i}@academy.com`,
            `선생님${i}`,
            'hashed_password',
            academyId
          ).run();
          createdData.users++;
        }

        // 학생 30명
        for (let i = 1; i <= 30; i++) {
          const academyId = Math.ceil(i / 6); // 학원당 6명
          await DB.prepare(`
            INSERT INTO users (email, name, password, role, academyId, createdAt)
            VALUES (?, ?, ?, 'STUDENT', ?, datetime('now', '-${i} days'))
          `).bind(
            `student${i}@academy.com`,
            `학생${i}`,
            'hashed_password',
            academyId
          ).run();
          createdData.users++;
        }
      }
    } catch (e) {
      console.log("Users table error:", e);
    }

    // 3. 출석 테이블 생성 및 샘플 데이터
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          studentId INTEGER NOT NULL,
          academyId INTEGER NOT NULL,
          date TEXT NOT NULL,
          status TEXT DEFAULT 'present',
          createdAt TEXT DEFAULT (datetime('now'))
        )
      `).run();

      // 최근 7일간 출석 데이터
      for (let day = 0; day < 7; day++) {
        for (let studentId = 1; studentId <= 30; studentId++) {
          const academyId = Math.ceil(studentId / 6);
          const status = Math.random() > 0.2 ? 'present' : 'absent';
          await DB.prepare(`
            INSERT INTO attendance (studentId, academyId, date, status, createdAt)
            VALUES (?, ?, date('now', '-${day} days'), ?, datetime('now', '-${day} days'))
          `).bind(studentId, academyId, status).run();
          createdData.attendance++;
        }
      }
    } catch (e) {
      console.log("Attendance table error:", e);
    }

    // 4. 숙제 제출 테이블 생성 및 샘플 데이터
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS homework_submissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          studentId INTEGER NOT NULL,
          homeworkId INTEGER NOT NULL,
          submittedAt TEXT DEFAULT (datetime('now')),
          createdAt TEXT DEFAULT (datetime('now'))
        )
      `).run();

      // 최근 7일간 숙제 제출
      for (let day = 0; day < 7; day++) {
        for (let studentId = 1; studentId <= 20; studentId++) {
          await DB.prepare(`
            INSERT INTO homework_submissions (studentId, homeworkId, submittedAt, createdAt)
            VALUES (?, ?, datetime('now', '-${day} days'), datetime('now', '-${day} days'))
          `).bind(studentId, day + 1).run();
          createdData.homework++;
        }
      }
    } catch (e) {
      console.log("Homework table error:", e);
    }

    // 5. AI 사용 로그 테이블 생성 및 샘플 데이터
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS ai_usage_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          action TEXT,
          createdAt TEXT DEFAULT (datetime('now'))
        )
      `).run();

      // 이번 달 AI 사용 로그
      for (let i = 0; i < 100; i++) {
        const userId = Math.floor(Math.random() * 30) + 1;
        const daysAgo = Math.floor(Math.random() * 30);
        await DB.prepare(`
          INSERT INTO ai_usage_logs (userId, action, createdAt)
          VALUES (?, 'chat', datetime('now', '-${daysAgo} days'))
        `).bind(userId).run();
        createdData.aiUsage++;
      }
    } catch (e) {
      console.log("AI usage table error:", e);
    }

    // 6. 매출 기록 샘플 데이터
    try {
      const existingRevenue = await DB.prepare(`SELECT COUNT(*) as count FROM revenue_records`).first();
      
      if (!existingRevenue || existingRevenue.count === 0) {
        for (let i = 1; i <= 10; i++) {
          const academyId = Math.ceil(i / 2);
          const amount = [50000, 100000, 150000, 200000, 300000][Math.floor(Math.random() * 5)];
          await DB.prepare(`
            INSERT INTO revenue_records (academyId, amount, type, status, createdAt)
            VALUES (?, ?, 'subscription', 'completed', datetime('now', '-${i * 3} days'))
          `).bind(academyId, amount).run();
          createdData.revenue++;
        }
      }
    } catch (e) {
      console.log("Revenue table error:", e);
    }

    // 7. 결제 승인 샘플 데이터
    try {
      const existingPayments = await DB.prepare(`SELECT COUNT(*) as count FROM payment_approvals`).first();
      
      if (!existingPayments || existingPayments.count === 0) {
        for (let i = 1; i <= 5; i++) {
          const academyId = i;
          await DB.prepare(`
            INSERT INTO payment_approvals (academyId, planName, amount, paymentMethod, status, createdAt)
            VALUES (?, ?, ?, 'card', 'pending', datetime('now', '-${i} days'))
          `).bind(academyId, '스탠다드 플랜', 150000).run();
          createdData.payments++;
        }
      }
    } catch (e) {
      console.log("Payment approvals table error:", e);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "샘플 데이터 생성 완료",
      created: createdData
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Sample data creation error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to create sample data",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// GET으로 현재 데이터 상태 확인
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tables: any = {};

    // 각 테이블의 데이터 수 확인
    try {
      const academy = await DB.prepare(`SELECT COUNT(*) as count FROM academy`).first();
      tables.academy = academy?.count || 0;
    } catch (e) {
      tables.academy = 'table not exists';
    }

    try {
      const users = await DB.prepare(`SELECT COUNT(*) as count FROM users`).first();
      tables.users = users?.count || 0;
    } catch (e) {
      tables.users = 'table not exists';
    }

    try {
      const attendance = await DB.prepare(`SELECT COUNT(*) as count FROM attendance`).first();
      tables.attendance = attendance?.count || 0;
    } catch (e) {
      tables.attendance = 'table not exists';
    }

    try {
      const homework = await DB.prepare(`SELECT COUNT(*) as count FROM homework_submissions`).first();
      tables.homework = homework?.count || 0;
    } catch (e) {
      tables.homework = 'table not exists';
    }

    try {
      const aiUsage = await DB.prepare(`SELECT COUNT(*) as count FROM ai_usage_logs`).first();
      tables.aiUsage = aiUsage?.count || 0;
    } catch (e) {
      tables.aiUsage = 'table not exists';
    }

    try {
      const revenue = await DB.prepare(`SELECT COUNT(*) as count FROM revenue_records`).first();
      tables.revenue = revenue?.count || 0;
    } catch (e) {
      tables.revenue = 'table not exists';
    }

    try {
      const payments = await DB.prepare(`SELECT COUNT(*) as count FROM payment_approvals`).first();
      tables.payments = payments?.count || 0;
    } catch (e) {
      tables.payments = 'table not exists';
    }

    return new Response(JSON.stringify({
      success: true,
      message: "현재 DB 상태",
      tables
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        error: "Failed to check data",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
