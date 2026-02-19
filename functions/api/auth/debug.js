// Debug endpoint to test password hashing

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const db = env.DB;
    
    const data = await request.json();
    const { email, password } = data;
    
    // Get user from DB
    const user = await db
      .prepare('SELECT email, password, LENGTH(password) as pwdLen FROM User WHERE email = ?')
      .bind(email)
      .first();
    
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        message: 'User not found',
        email: email
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate hash
    const encoder = new TextEncoder();
    const saltedPassword = password + 'superplace-salt-2024';
    const data2 = encoder.encode(saltedPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data2);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const generatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return new Response(JSON.stringify({
      success: true,
      debug: {
        inputEmail: email,
        inputPassword: password,
        inputPasswordLength: password.length,
        saltedPassword: saltedPassword,
        dbPasswordHash: user.password,
        dbPasswordLength: user.pwdLen,
        generatedHash: generatedHash,
        generatedHashLength: generatedHash.length,
        hashesMatch: generatedHash === user.password,
        comparison: {
          first20_db: user.password.substring(0, 20),
          first20_generated: generatedHash.substring(0, 20),
          last20_db: user.password.substring(44, 64),
          last20_generated: generatedHash.substring(44, 64)
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
