/**
 * Cloudflare D1 REST API Client
 * 
 * Direct connection to Cloudflare D1 Database using REST API
 * Supports both API Token and Global API Key
 */

// Get environment variables at runtime (not build time)
function getEnvVar(key: string): string {
  return process.env[key] || '';
}

interface D1Response<T = any> {
  success: boolean;
  result?: T[];
  errors?: any[];
  messages?: any[];
}

/**
 * Execute SQL query on Cloudflare D1 via REST API
 */
export async function executeD1Query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  // Get environment variables at runtime
  const CLOUDFLARE_ACCOUNT_ID = getEnvVar('CLOUDFLARE_ACCOUNT_ID');
  const CLOUDFLARE_D1_DATABASE_ID = getEnvVar('CLOUDFLARE_D1_DATABASE_ID');
  const CLOUDFLARE_D1_API_TOKEN = getEnvVar('CLOUDFLARE_D1_API_TOKEN') || getEnvVar('CLOUDFLARE_API_TOKEN');
  const CLOUDFLARE_API_KEY = getEnvVar('CLOUDFLARE_API_KEY');
  const CLOUDFLARE_EMAIL = getEnvVar('CLOUDFLARE_EMAIL');

  // Check if required environment variables are set
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_D1_DATABASE_ID) {
    console.error('❌ Cloudflare D1 환경 변수가 설정되지 않았습니다:', {
      hasAccountId: !!CLOUDFLARE_ACCOUNT_ID,
      hasDatabaseId: !!CLOUDFLARE_D1_DATABASE_ID,
      hasApiToken: !!CLOUDFLARE_D1_API_TOKEN,
      hasGlobalApiKey: !!CLOUDFLARE_API_KEY,
      hasEmail: !!CLOUDFLARE_EMAIL,
    });
    throw new Error('Cloudflare D1 환경 변수가 설정되지 않았습니다.');
  }

  // Check authentication method
  const hasApiToken = !!CLOUDFLARE_D1_API_TOKEN;
  const hasGlobalApiKey = !!(CLOUDFLARE_API_KEY && CLOUDFLARE_EMAIL);

  if (!hasApiToken && !hasGlobalApiKey) {
    throw new Error('Cloudflare 인증 정보가 없습니다. API Token 또는 Global API Key + Email이 필요합니다.');
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}/query`;

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Use API Token if available, otherwise use Global API Key
  if (hasApiToken) {
    console.log('🔑 Using API Token authentication');
    headers['Authorization'] = `Bearer ${CLOUDFLARE_D1_API_TOKEN}`;
  } else {
    console.log('🔑 Using Global API Key authentication');
    headers['X-Auth-Email'] = CLOUDFLARE_EMAIL;
    headers['X-Auth-Key'] = CLOUDFLARE_API_KEY;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sql,
        params,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cloudflare D1 API 오류:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Cloudflare D1 API 오류: ${response.status} - ${errorText}`);
    }

    const data: D1Response = await response.json();

    if (!data.success) {
      console.error('❌ Cloudflare D1 쿼리 실패:', data.errors);
      throw new Error(`D1 쿼리 실패: ${JSON.stringify(data.errors)}`);
    }

    return (data.result || []) as T[];
  } catch (error: any) {
    console.error('❌ Cloudflare D1 연결 오류:', error);
    throw error;
  }
}

/**
 * Execute first query result
 */
export async function executeD1QueryFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const results = await executeD1Query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Test Cloudflare D1 connection
 */
export async function testD1Connection(): Promise<boolean> {
  try {
    await executeD1Query('SELECT 1 as test');
    console.log('✅ Cloudflare D1 연결 성공!');
    return true;
  } catch (error) {
    console.error('❌ Cloudflare D1 연결 실패:', error);
    return false;
  }
}

/**
 * Get all users from D1
 */
export async function getD1Users(role?: string, academyId?: string): Promise<any[]> {
  let sql = `
    SELECT 
      id, email, password, name, phone, role, grade, 
      academyId, studentCode, studentId, parentPhone,
      approved, aiChatEnabled, aiHomeworkEnabled, aiStudyEnabled,
      points, createdAt, updatedAt
    FROM User
    WHERE 1=1
  `;

  const params: any[] = [];

  if (role) {
    sql += ` AND role = ?`;
    params.push(role);
  }

  if (academyId) {
    sql += ` AND academyId = ?`;
    params.push(academyId);
  }

  sql += ` ORDER BY createdAt DESC`;

  return executeD1Query(sql, params);
}

/**
 * Check if D1 is configured
 */
export function isD1Configured(): boolean {
  const CLOUDFLARE_ACCOUNT_ID = getEnvVar('CLOUDFLARE_ACCOUNT_ID');
  const CLOUDFLARE_D1_DATABASE_ID = getEnvVar('CLOUDFLARE_D1_DATABASE_ID');
  const CLOUDFLARE_D1_API_TOKEN = getEnvVar('CLOUDFLARE_D1_API_TOKEN') || getEnvVar('CLOUDFLARE_API_TOKEN');
  const CLOUDFLARE_API_KEY = getEnvVar('CLOUDFLARE_API_KEY');
  const CLOUDFLARE_EMAIL = getEnvVar('CLOUDFLARE_EMAIL');
  
  const hasAccountId = !!CLOUDFLARE_ACCOUNT_ID;
  const hasDatabaseId = !!CLOUDFLARE_D1_DATABASE_ID;
  const hasApiToken = !!CLOUDFLARE_D1_API_TOKEN;
  const hasGlobalKey = !!(CLOUDFLARE_API_KEY && CLOUDFLARE_EMAIL);
  
  return hasAccountId && hasDatabaseId && (hasApiToken || hasGlobalKey);
}

export {
  getEnvVar as CLOUDFLARE_ACCOUNT_ID,
  getEnvVar as CLOUDFLARE_D1_DATABASE_ID,
  getEnvVar as CLOUDFLARE_D1_API_TOKEN,
};
