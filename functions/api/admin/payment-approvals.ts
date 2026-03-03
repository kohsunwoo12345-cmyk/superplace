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
          planId TEXT,
          planName TEXT NOT NULL,
          amount REAL NOT NULL,
          period TEXT,
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

    // Try to add planId and period columns if they don't exist
    try {
      await DB.prepare(`ALTER TABLE payment_approvals ADD COLUMN planId TEXT`).run();
      console.log("✅ Added planId column");
    } catch (e) {
      console.log("⚠️ planId column might already exist");
    }

    try {
      await DB.prepare(`ALTER TABLE payment_approvals ADD COLUMN period TEXT`).run();
      console.log("✅ Added period column");
    } catch (e) {
      console.log("⚠️ period column might already exist");
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

    // Check if planId and period columns exist
    let hasNewColumns = false;
    try {
      const tableInfo = await DB.prepare(`PRAGMA table_info(payment_approvals)`).all();
      const columns = (tableInfo.results || []).map((col: any) => col.name);
      hasNewColumns = columns.includes('planId') && columns.includes('period');
      console.log("✅ Table columns check:", { hasNewColumns, columns: columns.join(', ') });
    } catch (e) {
      console.log("⚠️ Could not check table columns");
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

    // For each approval, fetch pricing info if planId exists
    const enrichedApprovals = await Promise.all(
      approvals.map(async (approval: any) => {
        if (approval.planId) {
          try {
            const pricing = await DB.prepare(`
              SELECT price_1month, price_6months, price_12months
              FROM pricing_plans
              WHERE id = ?
            `).bind(approval.planId).first();

            if (pricing) {
              return {
                ...approval,
                price_1month: pricing.price_1month,
                price_6months: pricing.price_6months,
                price_12months: pricing.price_12months,
              };
            }
          } catch (e) {
            console.log("⚠️ Failed to fetch pricing for planId:", approval.planId);
          }
        }
        return approval;
      })
    );

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
      approvals: enrichedApprovals,
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

    const body = await context.request.json() as any;

    const { academyId, userId, planId, planName, amount, period, paymentMethod, notes } = body;

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
      INSERT INTO payment_approvals (academyId, userId, planId, planName, amount, period, paymentMethod, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      academyId,
      userId || null,
      planId || null,
      planName,
      amount,
      period || '1month',
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
      await DB.prepare(`
        UPDATE payment_approvals
        SET status = 'approved', 
            approvedAt = datetime('now', '+9 hours'), 
            approvedBy = ?,
            transactionId = ?
        WHERE id = ?
      `).bind(approvedBy || null, transactionId || null, id).run();

      // 승인 시 revenue_records에도 추가
      const approval = await DB.prepare(`
        SELECT * FROM payment_approvals WHERE id = ?
      `).bind(id).first();

      if (approval) {
        await DB.prepare(`
          INSERT INTO revenue_records 
          (academyId, amount, type, description, status, paymentMethod, transactionId, paidAt)
          VALUES (?, ?, ?, ?, 'completed', ?, ?, datetime('now', '+9 hours'))
        `).bind(
          approval.academyId,
          approval.amount,
          approval.planName,
          `${approval.planName} 구독 결제 승인`,
          approval.paymentMethod,
          transactionId || null
        ).run();
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
