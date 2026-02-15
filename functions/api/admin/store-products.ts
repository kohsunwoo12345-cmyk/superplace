// Cloudflare Worker - Store Products API
// D1 데이터베이스와 연동하여 제품 CRUD 작업 수행

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
    // GET - 모든 제품 조회
    if (method === "GET" && url.pathname === "/api/admin/store-products") {
      const { results } = await env.DB.prepare(
        `SELECT * FROM StoreProduct ORDER BY displayOrder ASC, createdAt DESC`
      ).all();

      return new Response(
        JSON.stringify({
          products: results || [],
          total: results?.length || 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // POST - 제품 생성
    if (method === "POST" && url.pathname === "/api/admin/store-products") {
      const body = await request.json();
      const {
        name,
        category,
        section,
        description,
        shortDescription,
        price,
        monthlyPrice,
        yearlyPrice,
        features,
        detailHtml,
        imageUrl,
        botId,
        isActive,
        isFeatured,
        displayOrder,
        keywords,
        createdById,
      } = body;

      // 필수 필드 검증
      if (!name || !description || !category || !section || !createdById) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // ID 생성
      const id = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // features를 JSON 문자열로 변환
      const featuresJson = Array.isArray(features)
        ? JSON.stringify(features)
        : null;

      // 제품 생성
      await env.DB.prepare(
        `INSERT INTO StoreProduct (
          id, name, category, section, description, shortDescription,
          price, monthlyPrice, yearlyPrice, features, detailHtml, imageUrl, botId,
          isActive, isFeatured, displayOrder, keywords, createdById, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
        .bind(
          id,
          name,
          category,
          section,
          description,
          shortDescription || null,
          price || 0,
          monthlyPrice || null,
          yearlyPrice || null,
          featuresJson,
          detailHtml || null,
          imageUrl || null,
          botId || null,
          isActive !== undefined ? isActive : 1,
          isFeatured !== undefined ? isFeatured : 0,
          displayOrder || 0,
          keywords || null,
          createdById
        )
        .run();

      // 생성된 제품 조회
      const { results } = await env.DB.prepare(
        `SELECT * FROM StoreProduct WHERE id = ?`
      )
        .bind(id)
        .all();

      const product = results && results.length > 0 ? results[0] : null;

      return new Response(
        JSON.stringify({
          message: "Product created successfully",
          product,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // GET - 특정 제품 조회
    if (method === "GET" && url.pathname.match(/^\/api\/admin\/store-products\/(.+)$/)) {
      const productId = url.pathname.split("/").pop();
      
      const { results } = await env.DB.prepare(
        `SELECT * FROM StoreProduct WHERE id = ?`
      )
        .bind(productId)
        .all();

      const product = results && results.length > 0 ? results[0] : null;

      if (!product) {
        return new Response(JSON.stringify({ error: "Product not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ product }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE - 제품 삭제
    if (method === "DELETE" && url.pathname.match(/^\/api\/admin\/store-products\/(.+)$/)) {
      const productId = url.pathname.split("/").pop();

      await env.DB.prepare(`DELETE FROM StoreProduct WHERE id = ?`)
        .bind(productId)
        .run();

      return new Response(
        JSON.stringify({ message: "Product deleted successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
