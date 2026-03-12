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

    // Helper function to parse notes
    const parseNotes = (notes: string) => {
      const parsed = {
        applicantName: "",
        applicantEmail: "",
        applicantPhone: "",
      };

      if (!notes) return parsed;

      // Handle both \\n (escaped in DB) and \n (actual newline)
      const lines = notes.split(/\\n|\n/);
      lines.forEach((line: string) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("이름:")) {
          parsed.applicantName = trimmedLine.replace("이름:", "").trim();
        } else if (trimmedLine.startsWith("이메일:")) {
          parsed.applicantEmail = trimmedLine.replace("이메일:", "").trim();
        } else if (trimmedLine.startsWith("연락처:")) {
          parsed.applicantPhone = trimmedLine.replace("연락처:", "").trim();
        }
      });

      return parsed;
    };

    // For each approval, fetch pricing info if planId exists AND parse notes
    const enrichedApprovals = await Promise.all(
      approvals.map(async (approval: any) => {
        // Parse notes to extract applicant info
        const parsedInfo = parseNotes(approval.notes || "");
        
        let result = {
          ...approval,
          applicantName: parsedInfo.applicantName,
          applicantEmail: parsedInfo.applicantEmail,
          applicantPhone: parsedInfo.applicantPhone,
        };

        // Fetch pricing info if planId exists
        if (approval.planId) {
          try {
            const pricing = await DB.prepare(`
              SELECT price_1month, price_6months, price_12months
              FROM pricing_plans
              WHERE id = ?
            `).bind(approval.planId).first();

            if (pricing) {
              result = {
                ...result,
                price_1month: pricing.price_1month,
                price_6months: pricing.price_6months,
                price_12months: pricing.price_12months,
              };
            }
          } catch (e) {
            console.log("⚠️ Failed to fetch pricing for planId:", approval.planId);
          }
        }
        
        return result;
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
      // Get approval details
      const approval = await DB.prepare(`
        SELECT * FROM payment_approvals WHERE id = ?
      `).bind(id).first();

      if (!approval) {
        return new Response(JSON.stringify({
          success: false,
          error: "Approval not found"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Update payment approval status
      await DB.prepare(`
        UPDATE payment_approvals
        SET status = 'approved', 
            approvedAt = datetime('now', '+9 hours'), 
            approvedBy = ?,
            transactionId = ?
        WHERE id = ?
      `).bind(approvedBy || null, transactionId || null, id).run();

      // Add to revenue_records
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

      // Create or update user_subscriptions
      if (approval.userId && approval.planId) {
        // Get pricing plan details
        const pricingPlan = await DB.prepare(`
          SELECT 
            id,
            name,
            max_students as maxStudents,
            max_homework_checks as maxHomeworkChecks,
            max_ai_analysis as maxAIAnalysis,
            max_similar_problems as maxSimilarProblems,
            max_landing_pages as maxLandingPages
          FROM pricing_plans WHERE id = ?
        `).bind(approval.planId).first();

        console.log('🔍 Pricing plan fetched:', pricingPlan);

        if (pricingPlan) {
          // Ensure all values have defaults (handle null/undefined)
          const maxStudents = pricingPlan.maxStudents ?? -1;
          const maxHomeworkChecks = pricingPlan.maxHomeworkChecks ?? -1;
          const maxAIAnalysis = pricingPlan.maxAIAnalysis ?? -1;
          const maxSimilarProblems = pricingPlan.maxSimilarProblems ?? -1;
          const maxLandingPages = pricingPlan.maxLandingPages ?? -1;
          
          // Calculate subscription dates
          const now = new Date();
          const startDate = now.toISOString();
          
          const periodMonths: Record<string, number> = {
            '1month': 1,
            '6months': 6,
            '12months': 12,
          };
          
          const months = periodMonths[approval.period || '1month'] || 1;
          const endDate = new Date(now);
          endDate.setMonth(endDate.getMonth() + months);
          const endDateStr = endDate.toISOString();

          // Check if subscription exists
          const existingSub = await DB.prepare(`
            SELECT id FROM user_subscriptions WHERE userId = ?
          `).bind(approval.userId).first();

          if (existingSub) {
            // Update existing subscription
            await DB.prepare(`
              UPDATE user_subscriptions
              SET planId = ?,
                  planName = ?,
                  period = ?,
                  status = 'active',
                  startDate = ?,
                  endDate = ?,
                  max_students = ?,
                  max_homework_checks = ?,
                  max_ai_analysis = ?,
                  max_similar_problems = ?,
                  max_landing_pages = ?,
                  lastPaymentAmount = ?,
                  lastPaymentDate = datetime('now', '+9 hours'),
                  updatedAt = datetime('now', '+9 hours')
              WHERE id = ?
            `).bind(
              approval.planId,
              approval.planName,
              approval.period || '1month',
              startDate,
              endDateStr,
              maxStudents,
              maxHomeworkChecks,
              maxAIAnalysis,
              maxSimilarProblems,
              maxLandingPages,
              approval.amount,
              existingSub.id
            ).run();
          } else {
            // Create new subscription
            const subId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            await DB.prepare(`
              INSERT INTO user_subscriptions (
                id, userId, planId, planName, period, status,
                startDate, endDate,
                current_students, current_homework_checks,
                current_ai_analysis,
                current_similar_problems, current_landing_pages,
                max_students, max_homework_checks,
                max_ai_analysis,
                max_similar_problems, max_landing_pages,
                lastPaymentAmount, lastPaymentDate,
                autoRenew, createdAt, updatedAt, lastResetDate
              ) VALUES (
                ?, ?, ?, ?, ?, 'active',
                ?, ?,
                0, 0, 0, 0, 0,
                ?, ?, ?, ?, ?,
                ?, datetime('now', '+9 hours'),
                0, datetime('now', '+9 hours'), datetime('now', '+9 hours'), datetime('now', '+9 hours')
              )
            `).bind(
              subId,
              approval.userId,
              approval.planId,
              approval.planName,
              approval.period || '1month',
              startDate,
              endDateStr,
              maxStudents,
              maxHomeworkChecks,
              maxAIAnalysis,
              maxSimilarProblems,
              maxLandingPages,
              approval.amount
            ).run();
          }
        }
      }

      // director_limitations 자동 업데이트 (요금제 제한 동기화)
      if (approval.userId && pricingPlan) {
        try {
          // 학원 ID 조회
          const userInfo = await DB.prepare(`
            SELECT academyId FROM User WHERE id = ?
          `).bind(approval.userId).first();

          if (userInfo && userInfo.academyId) {
            const academyId = userInfo.academyId;
            const maxAIAnalysis = pricingPlan.maxAIAnalysis as number ?? -1;
            const maxSimilarProblems = pricingPlan.maxSimilarProblems as number ?? -1;

            // 월간 제한값 설정 (-1이면 0으로 저장 = 무제한)
            const aiAnalysisMonthlyLimit = maxAIAnalysis === -1 ? 0 : maxAIAnalysis;
            const similarProblemMonthlyLimit = maxSimilarProblems === -1 ? 0 : maxSimilarProblems;

            // 기존 director_limitations 확인
            const existingLimit = await DB.prepare(`
              SELECT id FROM director_limitations WHERE academy_id = ?
            `).bind(academyId).first();

            if (existingLimit) {
              // 기존 레코드 업데이트 (사용량은 초기화, 제한값만 업데이트)
              await DB.prepare(`
                UPDATE director_limitations SET
                  similar_problem_enabled = ?,
                  similar_problem_monthly_limit = ?,
                  similar_problem_monthly_used = 0,
                  competency_analysis_enabled = 1,
                  competency_monthly_limit = ?,
                  competency_monthly_used = 0,
                  weak_concept_analysis_enabled = 1,
                  weak_concept_monthly_limit = ?,
                  weak_concept_monthly_used = 0,
                  updated_at = datetime('now')
                WHERE academy_id = ?
              `).bind(
                similarProblemMonthlyLimit > 0 ? 1 : 0,
                similarProblemMonthlyLimit,
                aiAnalysisMonthlyLimit,
                aiAnalysisMonthlyLimit,
                academyId
              ).run();
              console.log(`✅ director_limitations 업데이트 완료 (academy: ${academyId})`);
            } else {
              // 새 레코드 생성
              await DB.prepare(`
                INSERT INTO director_limitations (
                  director_id, academy_id,
                  similar_problem_enabled, similar_problem_monthly_limit, similar_problem_monthly_used,
                  similar_problem_daily_limit, similar_problem_daily_used,
                  competency_analysis_enabled, competency_monthly_limit, competency_monthly_used,
                  competency_daily_limit, competency_daily_used,
                  weak_concept_analysis_enabled, weak_concept_monthly_limit, weak_concept_monthly_used,
                  weak_concept_daily_limit, weak_concept_daily_used,
                  homework_grading_daily_limit, homework_grading_monthly_limit,
                  homework_grading_daily_used, homework_grading_monthly_used,
                  max_students, landing_page_html_direct_edit
                ) VALUES (?, ?, ?, ?, 0, 0, 0, 1, ?, 0, 0, 0, 1, ?, 0, 0, 0, 0, 0, 0, 0, ?, 0)
              `).bind(
                approval.userId,
                academyId,
                similarProblemMonthlyLimit > 0 ? 1 : 0,
                similarProblemMonthlyLimit,
                aiAnalysisMonthlyLimit,
                aiAnalysisMonthlyLimit,
                pricingPlan.maxStudents as number ?? -1
              ).run();
              console.log(`✅ director_limitations 신규 생성 완료 (academy: ${academyId})`);
            }
          }
        } catch (limitUpdateError: any) {
          console.warn('⚠️ director_limitations 업데이트 실패 (계속 진행):', limitUpdateError.message);
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
