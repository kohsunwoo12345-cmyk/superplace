// Cloudflare Pages Functions for Landing Page Templates
// GET /api/landing/templates - Get all templates
// POST /api/landing/templates - Create a new template
// PUT /api/landing/templates - Update a template
// DELETE /api/landing/templates?id=xxx - Delete a template

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
    const templates = await env.DB.prepare(`
      SELECT 
        t.*,
        u.name as creatorName,
        (SELECT COUNT(*) FROM LandingPage WHERE templateId = t.id) as actualUsageCount
      FROM LandingPageTemplate t
      LEFT JOIN User u ON t.createdById = u.id
      ORDER BY t.isDefault DESC, t.createdAt DESC
    `).all();

    return new Response(JSON.stringify({
      templates: templates.results || [],
      total: templates.results?.length || 0,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch templates" }), {
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
    const body = await request.json();
    const { name, description, html } = body;

    if (!name || !html) {
      return new Response(JSON.stringify({ error: "Name and HTML are required" }), {
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

    // TODO: Get user ID from token
    const createdById = "admin"; // Replace with actual user ID from token

    await env.DB.prepare(`
      INSERT INTO LandingPageTemplate (
        id, name, description, html, variables, isDefault, usageCount, createdById, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?)
    `).bind(
      templateId,
      name,
      description || null,
      html,
      JSON.stringify(variables),
      createdById,
      now,
      now
    ).run();

    return new Response(JSON.stringify({
      id: templateId,
      message: "Template created successfully",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to create template:", error);
    return new Response(JSON.stringify({ error: "Failed to create template" }), {
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

    await env.DB.prepare(`
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

    return new Response(JSON.stringify({
      message: "Template updated successfully",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to update template:", error);
    return new Response(JSON.stringify({ error: "Failed to update template" }), {
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
        error: `Template is being used by ${usageCount.count} landing pages`,
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await env.DB.prepare(`
      DELETE FROM LandingPageTemplate WHERE id = ?
    `).bind(id).run();

    return new Response(JSON.stringify({
      message: "Template deleted successfully",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to delete template:", error);
    return new Response(JSON.stringify({ error: "Failed to delete template" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
