// Cloudflare Pages Functions for Landing Page Templates
// GET /api/landing/templates - Get all templates
// POST /api/landing/templates - Create a new template
// PUT /api/landing/templates - Update a template
// DELETE /api/landing/templates?id=xxx - Delete a template

import { getUserFromAuth } from '../../_lib/auth';

export async function onRequestGet(context) {
  const { env, request } = context;
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const templatesResult = await env.DB.prepare(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.html,
        t.variables,
        t.isDefault,
        t.createdAt,
        t.updatedAt,
        u.name as creatorName,
        (SELECT COUNT(*) FROM LandingPage WHERE templateId = t.id) as actualUsageCount
      FROM LandingPageTemplate t
      LEFT JOIN User u ON t.createdById = u.id
      ORDER BY t.isDefault DESC, t.createdAt DESC
    `).all();

    // Convert database result to proper format
    const templates = (templatesResult.results || []).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description || "",
      html: t.html,
      variables: JSON.parse(t.variables || "[]"),
      isDefault: Boolean(t.isDefault),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      usageCount: t.actualUsageCount || 0,
      creatorName: t.creatorName || "",
    }));

    return new Response(JSON.stringify({
      success: true,
      templates: templates,
      total: templates.length,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: "Failed to fetch templates",
      message: error.message || "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get user from token
    const user = getUserFromAuth(request);
    if (!user || !user.userId) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "유효하지 않은 토큰입니다.",
        message: "사용자 인증 실패"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { name, description, html } = body;

    if (!name || !html) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Name and HTML are required",
        message: "템플릿 이름과 HTML이 필요합니다."
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract variables from HTML
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = [];
    let match;
    while ((match = variableRegex.exec(html)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    const templateId = `template_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const now = new Date().toISOString();

    console.log("Creating template with userId:", user.userId);

    const insertResult = await env.DB.prepare(`
      INSERT INTO LandingPageTemplate (
        id, name, description, html, variables, isDefault, usageCount, createdById, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?)
    `).bind(
      templateId,
      name,
      description || null,
      html,
      JSON.stringify(variables),
      user.userId,  // Use actual user ID from token
      now,
      now
    ).run();

    if (!insertResult.success) {
      console.error("Database insert failed:", insertResult);
      throw new Error("Database insert failed");
    }

    console.log("Template created successfully:", templateId);

    return new Response(JSON.stringify({
      success: true,
      id: templateId,
      message: "템플릿이 생성되었습니다.",
      template: {
        id: templateId,
        name,
        description: description || "",
        html,
        variables,
        isDefault: false,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to create template:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: "템플릿 저장에 실패했습니다.",
      message: error.message || "Unknown error",
      details: error.toString(),
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { id, name, description, html } = body;

    if (!id || !name || !html) {
      return new Response(JSON.stringify({ error: "ID, name, and HTML are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract variables from HTML
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = [];
    let match;
    while ((match = variableRegex.exec(html)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    const now = new Date().toISOString();

    const updateResult = await env.DB.prepare(`
      UPDATE LandingPageTemplate
      SET name = ?, description = ?, html = ?, variables = ?, updatedAt = ?
      WHERE id = ?
    `).bind(
      name,
      description || null,
      html,
      JSON.stringify(variables),
      now,
      id
    ).run();

    if (!updateResult.success) {
      throw new Error("Database update failed");
    }

    return new Response(JSON.stringify({
      success: true,
      message: "템플릿이 수정되었습니다.",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to update template:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: "템플릿 수정에 실패했습니다.",
      message: error.message || "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "Template ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if template is being used
    const usageCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM LandingPage WHERE templateId = ?
    `).bind(id).first();

    if (usageCount && usageCount.count > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `템플릿이 ${usageCount.count}개의 랜딩페이지에서 사용 중입니다.`,
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const deleteResult = await env.DB.prepare(`
      DELETE FROM LandingPageTemplate WHERE id = ?
    `).bind(id).run();

    if (!deleteResult.success) {
      throw new Error("Database delete failed");
    }

    return new Response(JSON.stringify({
      success: true,
      message: "템플릿이 삭제되었습니다.",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to delete template:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: "템플릿 삭제에 실패했습니다.",
      message: error.message || "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
