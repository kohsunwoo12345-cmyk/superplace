// Debug API: Update User Role
// POST /api/debug/update-user-role

interface Env {
  DB: D1Database;
}

export async function onRequest(context: { request: Request; env: Env }) {
  try {
    const db = context.env.DB;
    const body = await context.request.json();
    const { email, role } = body;

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: "email and role are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Valid roles
    const validRoles = ['user', 'DIRECTOR', 'ADMIN', 'SUPER_ADMIN'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update user role
    await db
      .prepare('UPDATE users SET role = ? WHERE email = ?')
      .bind(role, email)
      .run();

    // Verify update
    const user = await db
      .prepare('SELECT id, email, role FROM users WHERE email = ?')
      .bind(email)
      .first();

    return new Response(
      JSON.stringify({
        success: true,
        message: `User role updated to ${role}`,
        user,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
