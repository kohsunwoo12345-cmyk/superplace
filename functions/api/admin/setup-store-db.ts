// Cloudflare Worker - D1 Database Setup for Store
// AI 봇 쇼핑몰용 테이블 생성 스크립트

interface Env {
  DB: D1Database;
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // CORS 헤더
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // OPTIONS 요청 처리
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // StoreProduct 테이블 생성
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS StoreProduct (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        section TEXT NOT NULL,
        description TEXT NOT NULL,
        shortDescription TEXT,
        price INTEGER NOT NULL DEFAULT 0,
        monthlyPrice INTEGER,
        yearlyPrice INTEGER,
        features TEXT,
        detailHtml TEXT,
        imageUrl TEXT,
        botId TEXT,
        isActive INTEGER DEFAULT 1,
        isFeatured INTEGER DEFAULT 0,
        displayOrder INTEGER DEFAULT 0,
        keywords TEXT,
        createdById TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    await env.DB.exec(`
      CREATE INDEX IF NOT EXISTS idx_store_product_category ON StoreProduct(category);
    `);

    await env.DB.exec(`
      CREATE INDEX IF NOT EXISTS idx_store_product_active ON StoreProduct(isActive);
    `);

    await env.DB.exec(`
      CREATE INDEX IF NOT EXISTS idx_store_product_featured ON StoreProduct(isFeatured);
    `);

    await env.DB.exec(`
      CREATE INDEX IF NOT EXISTS idx_store_product_bot ON StoreProduct(botId);
    `);

    // PurchaseRequest 테이블 생성
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS PurchaseRequest (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        productName TEXT NOT NULL,
        directorUserId TEXT NOT NULL,
        directorName TEXT NOT NULL,
        directorEmail TEXT NOT NULL,
        directorPhone TEXT NOT NULL,
        paymentMethod TEXT NOT NULL,
        subscriptionMonths INTEGER NOT NULL,
        totalPrice INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        notes TEXT,
        approvedById TEXT,
        approvedAt TEXT,
        rejectionReason TEXT,
        botAssignmentId TEXT,
        expiresAt TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    await env.DB.exec(`
      CREATE INDEX IF NOT EXISTS idx_purchase_request_product ON PurchaseRequest(productId);
    `);

    await env.DB.exec(`
      CREATE INDEX IF NOT EXISTS idx_purchase_request_director ON PurchaseRequest(directorUserId);
    `);

    await env.DB.exec(`
      CREATE INDEX IF NOT EXISTS idx_purchase_request_status ON PurchaseRequest(status);
    `);

    await env.DB.exec(`
      CREATE INDEX IF NOT EXISTS idx_purchase_request_approved ON PurchaseRequest(approvedById);
    `);

    return new Response(
      JSON.stringify({
        message: "Store database tables created successfully",
        tables: ["StoreProduct", "PurchaseRequest"],
        indexes: [
          "idx_store_product_category",
          "idx_store_product_active",
          "idx_store_product_featured",
          "idx_store_product_bot",
          "idx_purchase_request_product",
          "idx_purchase_request_director",
          "idx_purchase_request_status",
          "idx_purchase_request_approved",
        ],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Database setup error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to create tables",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
