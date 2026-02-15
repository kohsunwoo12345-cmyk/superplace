// Cloudflare Worker - Purchase Request API
// 구매 요청 생성 및 승인/거절 처리

interface Env {
  DB: D1Database;
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // CORS 헤더
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // OPTIONS 요청 처리
  if (method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // POST - 구매 신청 생성
    if (method === "POST" && url.pathname === "/api/store/purchase") {
      const body = await request.json();
      const {
        productId,
        productName,
        directorUserId,
        directorName,
        directorEmail,
        directorPhone,
        paymentMethod,
        subscriptionMonths,
        notes,
      } = body;

      // 필수 필드 검증
      if (
        !productId ||
        !productName ||
        !directorUserId ||
        !directorName ||
        !directorEmail ||
        !directorPhone ||
        !paymentMethod ||
        !subscriptionMonths
      ) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // 결제 수단 검증
      if (paymentMethod !== "card" && paymentMethod !== "bank_transfer") {
        return new Response(JSON.stringify({ error: "Invalid payment method" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 구독 기간 검증
      if (![1, 6, 12].includes(subscriptionMonths)) {
        return new Response(
          JSON.stringify({ error: "Invalid subscription months" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // 제품 정보 조회
      const { results: productResults } = await env.DB.prepare(
        `SELECT * FROM StoreProduct WHERE id = ?`
      )
        .bind(productId)
        .all();

      const product =
        productResults && productResults.length > 0 ? productResults[0] : null;

      if (!product) {
        return new Response(JSON.stringify({ error: "Product not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 가격 계산
      let totalPrice = 0;
      if (subscriptionMonths === 1 && product.monthlyPrice) {
        totalPrice = product.monthlyPrice;
      } else if (subscriptionMonths === 12 && product.yearlyPrice) {
        totalPrice = product.yearlyPrice;
      } else if (subscriptionMonths === 6) {
        totalPrice = (product.monthlyPrice || product.price) * 6;
      } else {
        totalPrice = product.price * subscriptionMonths;
      }

      // ID 생성
      const id = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 구매 신청 생성
      await env.DB.prepare(
        `INSERT INTO PurchaseRequest (
          id, productId, productName, directorUserId, directorName, directorEmail, directorPhone,
          paymentMethod, subscriptionMonths, totalPrice, status, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, datetime('now'), datetime('now'))`
      )
        .bind(
          id,
          productId,
          productName,
          directorUserId,
          directorName,
          directorEmail,
          directorPhone,
          paymentMethod,
          subscriptionMonths,
          totalPrice,
          notes || null
        )
        .run();

      // 생성된 구매 신청 조회
      const { results } = await env.DB.prepare(
        `SELECT * FROM PurchaseRequest WHERE id = ?`
      )
        .bind(id)
        .all();

      const purchaseRequest =
        results && results.length > 0 ? results[0] : null;

      return new Response(
        JSON.stringify({
          message: "Purchase request created successfully",
          purchaseRequest,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // GET - 구매 요청 조회
    if (method === "GET" && url.pathname === "/api/admin/purchase-approvals") {
      const status = url.searchParams.get("status") || "all";

      let query = `SELECT * FROM PurchaseRequest`;
      const params = [];

      if (status !== "all") {
        query += ` WHERE status = ?`;
        params.push(status.toUpperCase());
      }

      query += ` ORDER BY createdAt DESC`;

      const { results } = await env.DB.prepare(query).bind(...params).all();

      // 통계 계산
      const allRequests = results || [];
      const stats = {
        total: allRequests.length,
        pending: allRequests.filter((r) => r.status === "PENDING").length,
        approved: allRequests.filter((r) => r.status === "APPROVED").length,
        rejected: allRequests.filter((r) => r.status === "REJECTED").length,
        pendingAmount: allRequests
          .filter((r) => r.status === "PENDING")
          .reduce((sum, r) => sum + (r.totalPrice || 0), 0),
        approvedAmount: allRequests
          .filter((r) => r.status === "APPROVED")
          .reduce((sum, r) => sum + (r.totalPrice || 0), 0),
      };

      return new Response(
        JSON.stringify({
          purchaseRequests: results || [],
          stats,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // PATCH - 구매 요청 승인/거절
    if (
      method === "PATCH" &&
      url.pathname.match(/^\/api\/admin\/purchase-approvals\/(.+)$/)
    ) {
      const purchaseId = url.pathname.split("/").pop();
      const body = await request.json();
      const { action, approvedById, rejectionReason } = body;

      // 구매 요청 조회
      const { results } = await env.DB.prepare(
        `SELECT * FROM PurchaseRequest WHERE id = ?`
      )
        .bind(purchaseId)
        .all();

      const purchaseRequest =
        results && results.length > 0 ? results[0] : null;

      if (!purchaseRequest) {
        return new Response(
          JSON.stringify({ error: "Purchase request not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (purchaseRequest.status !== "PENDING") {
        return new Response(
          JSON.stringify({ error: "Purchase request is already processed" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (action === "approve") {
        // 제품 정보 조회
        const { results: productResults } = await env.DB.prepare(
          `SELECT * FROM StoreProduct WHERE id = ?`
        )
          .bind(purchaseRequest.productId)
          .all();

        const product =
          productResults && productResults.length > 0
            ? productResults[0]
            : null;

        if (!product || !product.botId) {
          return new Response(
            JSON.stringify({ error: "Product or bot not found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // 만료일 계산
        const expiresAt = new Date();
        expiresAt.setMonth(
          expiresAt.getMonth() + purchaseRequest.subscriptionMonths
        );

        // 봇 할당 생성
        const botAssignmentId = `bot_assign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await env.DB.prepare(
          `INSERT INTO BotAssignment (
            id, userId, botId, grantedById, grantedByRole, isActive, expiresAt, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, 'ADMIN', 1, ?, datetime('now'), datetime('now'))`
        )
          .bind(
            botAssignmentId,
            purchaseRequest.directorUserId,
            product.botId,
            approvedById,
            expiresAt.toISOString()
          )
          .run();

        // 구매 요청 승인 업데이트
        await env.DB.prepare(
          `UPDATE PurchaseRequest SET
            status = 'APPROVED',
            approvedById = ?,
            approvedAt = datetime('now'),
            botAssignmentId = ?,
            expiresAt = ?,
            updatedAt = datetime('now')
          WHERE id = ?`
        )
          .bind(
            approvedById,
            botAssignmentId,
            expiresAt.toISOString(),
            purchaseId
          )
          .run();

        return new Response(
          JSON.stringify({
            message: "Purchase request approved and bot assigned successfully",
            botAssignmentId,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else if (action === "reject") {
        // 거절 처리
        await env.DB.prepare(
          `UPDATE PurchaseRequest SET
            status = 'REJECTED',
            approvedById = ?,
            approvedAt = datetime('now'),
            rejectionReason = ?,
            updatedAt = datetime('now')
          WHERE id = ?`
        )
          .bind(approvedById, rejectionReason || "관리자에 의해 거절됨", purchaseId)
          .run();

        return new Response(
          JSON.stringify({ message: "Purchase request rejected" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
