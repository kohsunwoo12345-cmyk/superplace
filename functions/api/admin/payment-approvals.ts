interface Env {
  DB: D1Database;
}

interface PaymentApproval {
  id?: number;
  academyId: string;
  academyName?: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  planId?: number;
  planName: string;
  amount: number;
  paymentMethod: string; // 'card' | 'transfer'
  status: string; // 'pending' | 'approved' | 'rejected'
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: number;
  rejectedReason?: string;
  transactionId?: string;
  notes?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const status = url.searchParams.get("status") || "all";
    const id = url.searchParams.get("id");

    console.log("💳 Payment approvals API called with status:", status);

    // 결제 승인 테이블이 없으면 생성
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS payment_approvals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          academyId TEXT NOT NULL,
          userId INTEGER,
          planName TEXT NOT NULL,
          amount REAL NOT NULL,
          paymentMethod TEXT DEFAULT 'card',
          status TEXT DEFAULT 'pending',
          requestedAt TEXT DEFAULT (datetime('now', '+9 hours')),
          approvedAt TEXT,
          approvedBy INTEGER,
          rejectedReason TEXT,
          transactionId TEXT,
          notes TEXT,
          FOREIGN KEY (academyId) REFERENCES academy(id),
          FOREIGN KEY (userId) REFERENCES users(id)
        )
      `).run();
      console.log("✅ Payment approvals table checked/created");
    } catch (e) {
      console.log("⚠️ Payment approvals table already exists or error:", e);
    }

    // 특정 승인 조회
    if (id) {
      const approval = await DB.prepare(`
        SELECT 
          pa.*,
          a.name as academyName,
          u.name as userName,
          u.email as userEmail,
          u.phone as userPhone
        FROM payment_approvals pa
        LEFT JOIN academy a ON pa.academyId = a.id
        LEFT JOIN users u ON pa.userId = u.id
        WHERE pa.id = ?
      `).bind(id).first();

      if (!approval) {
        return new Response(JSON.stringify({
          success: false,
          error: "Payment approval not found"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        approval
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 모든 승인 요청 조회 (상태별 필터)
    let query = `
      SELECT 
        pa.*,
        a.name as academyName,
        a.phone as academyPhone,
        a.email as academyEmail,
        u.name as userName,
        u.email as userEmail,
        u.phone as userPhone
      FROM payment_approvals pa
      LEFT JOIN academy a ON pa.academyId = a.id
      LEFT JOIN users u ON pa.userId = u.id
    `;

    const params: any[] = [];

    if (status !== "all") {
      query += ` WHERE pa.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY pa.requestedAt DESC LIMIT 100`;

    const approvalsResult = await DB.prepare(query).bind(...params).all();

    const approvals = approvalsResult.results || [];

    // 상태별 통계
    const statsResult = await DB.prepare(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(amount) as totalAmount
      FROM payment_approvals
      GROUP BY status
    `).all();

    const stats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      totalAmount: 0,
      pendingAmount: 0,
      approvedAmount: 0,
    };

    (statsResult.results || []).forEach((row: any) => {
      stats.total += row.count;
      stats.totalAmount += row.totalAmount || 0;

      if (row.status === "pending") {
        stats.pending = row.count;
        stats.pendingAmount = row.totalAmount || 0;
      } else if (row.status === "approved") {
        stats.approved = row.count;
        stats.approvedAmount = row.totalAmount || 0;
      } else if (row.status === "rejected") {
        stats.rejected = row.count;
      }
    });

    return new Response(JSON.stringify({
      success: true,
      approvals,
      stats
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Payment approvals API error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to fetch payment approvals",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// 결제 승인 요청 생성
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json() as PaymentApproval;

    const { academyId, userId, planName, amount, paymentMethod, notes } = body;

    // 필수 필드 검증
    if (!academyId || !planName || !amount) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required fields: academyId, planName, amount"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await DB.prepare(`
      INSERT INTO payment_approvals (academyId, userId, planName, amount, paymentMethod, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      academyId,
      userId || null,
      planName,
      amount,
      paymentMethod || 'card',
      notes || ''
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: "Payment approval request created successfully",
      approvalId: result.meta.last_row_id
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Create payment approval error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to create payment approval request",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// 결제 승인/거부 처리
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");
    const action = url.searchParams.get("action"); // 'approve' | 'reject'

    if (!id || !action) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing approval ID or action"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json();
    const { approvedBy, rejectedReason, transactionId } = body;

    if (action === "approve") {
      // 승인 요청 정보 가져오기
      const approval: any = await DB.prepare(`
        SELECT * FROM payment_approvals WHERE id = ?
      `).bind(id).first();

      if (!approval) {
        return new Response(JSON.stringify({
          success: false,
          error: "Payment approval not found"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 승인 상태 업데이트
      await DB.prepare(`
        UPDATE payment_approvals
        SET status = 'approved', 
            approvedAt = datetime('now', '+9 hours'), 
            approvedBy = ?,
            transactionId = ?
        WHERE id = ?
      `).bind(approvedBy || null, transactionId || null, id).run();

      // 1. 매출 기록 추가
      try {
        // revenue_records 테이블이 없으면 생성
        await DB.prepare(`
          CREATE TABLE IF NOT EXISTS revenue_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            academyId TEXT NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'completed',
            paymentMethod TEXT,
            transactionId TEXT,
            paidAt TEXT DEFAULT (datetime('now', '+9 hours')),
            createdAt TEXT DEFAULT (datetime('now', '+9 hours')),
            FOREIGN KEY (academyId) REFERENCES academy(id)
          )
        `).run();

        await DB.prepare(`
          INSERT INTO revenue_records 
          (academyId, amount, type, description, status, paymentMethod, transactionId, paidAt)
          VALUES (?, ?, ?, ?, 'completed', ?, ?, datetime('now', '+9 hours'))
        `).bind(
          approval.academyId,
          approval.amount,
          approval.planName,
          `${approval.planName} 결제 승인`,
          approval.paymentMethod,
          transactionId || null
        ).run();
      } catch (error) {
        console.error("매출 기록 추가 오류:", error);
      }

      // 2. 요금제 구매인 경우 - academy 테이블 업데이트
      const planNames = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'];
      const upperPlanName = approval.planName.toUpperCase();
      
      if (planNames.includes(upperPlanName)) {
        try {
          // 요금제에 따른 제한 설정
          let maxStudents = 10;
          let maxTeachers = 2;
          
          switch (upperPlanName) {
            case 'FREE':
              maxStudents = 10;
              maxTeachers = 2;
              break;
            case 'BASIC':
              maxStudents = 30;
              maxTeachers = 5;
              break;
            case 'PREMIUM':
              maxStudents = 100;
              maxTeachers = 20;
              break;
            case 'ENTERPRISE':
              maxStudents = 999999;
              maxTeachers = 999999;
              break;
          }

          await DB.prepare(`
            UPDATE academy
            SET subscriptionPlan = ?,
                maxStudents = ?,
                maxTeachers = ?,
                updatedAt = datetime('now', '+9 hours')
            WHERE id = ?
          `).bind(upperPlanName, maxStudents, maxTeachers, approval.academyId).run();

          console.log(`✅ Academy ${approval.academyId} plan updated to ${upperPlanName}`);
        } catch (error) {
          console.error("요금제 업데이트 오류:", error);
        }
      }

      // 3. 봇 구매인 경우 - bot_assignments 테이블에 추가
      // planName에 'BOT-' 접두어가 있거나 봇 ID가 포함된 경우
      if (approval.planName.includes('BOT-') || approval.planName.includes('bot-')) {
        try {
          // planName에서 봇 ID 추출 (예: "BOT-bot-123456789")
          const botIdMatch = approval.planName.match(/bot-[a-z0-9-]+/i);
          
          if (botIdMatch) {
            const botId = botIdMatch[0];

            // bot_assignments 테이블이 없으면 생성
            await DB.prepare(`
              CREATE TABLE IF NOT EXISTS bot_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                academyId TEXT NOT NULL,
                botId TEXT NOT NULL,
                assignedBy TEXT,
                assignedAt DATETIME DEFAULT (datetime('now', '+9 hours')),
                expiresAt DATETIME,
                isActive INTEGER DEFAULT 1,
                notes TEXT,
                createdAt DATETIME DEFAULT (datetime('now', '+9 hours')),
                updatedAt DATETIME DEFAULT (datetime('now', '+9 hours'))
              )
            `).run();

            // 중복 체크
            const existing = await DB.prepare(`
              SELECT id FROM bot_assignments 
              WHERE academyId = ? AND botId = ? AND isActive = 1
            `).bind(approval.academyId, botId).first();

            if (!existing) {
              // 만료일 설정 (1년 후)
              const expiresAt = new Date();
              expiresAt.setFullYear(expiresAt.getFullYear() + 1);
              
              await DB.prepare(`
                INSERT INTO bot_assignments (academyId, botId, expiresAt, notes, isActive)
                VALUES (?, ?, ?, ?, 1)
              `).bind(
                approval.academyId,
                botId,
                expiresAt.toISOString(),
                `결제 승인을 통한 자동 할당 (거래ID: ${transactionId || 'N/A'})`
              ).run();

              console.log(`✅ Bot ${botId} assigned to academy ${approval.academyId}`);
            } else {
              console.log(`⚠️ Bot ${botId} already assigned to academy ${approval.academyId}`);
            }
          }
        } catch (error) {
          console.error("봇 할당 오류:", error);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Payment approved successfully"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (action === "reject") {
      await DB.prepare(`
        UPDATE payment_approvals
        SET status = 'rejected', 
            approvedAt = datetime('now', '+9 hours'), 
            approvedBy = ?,
            rejectedReason = ?
        WHERE id = ?
      `).bind(approvedBy || null, rejectedReason || '', id).run();

      return new Response(JSON.stringify({
        success: true,
        message: "Payment rejected successfully"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: "Invalid action"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Update payment approval error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to update payment approval",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
