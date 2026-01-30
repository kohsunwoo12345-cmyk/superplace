/**
 * Cloudflare D1 REST API Client
 * 
 * Direct connection to Cloudflare D1 Database using REST API
 */

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || '';
const CLOUDFLARE_D1_API_TOKEN = process.env.CLOUDFLARE_D1_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || '';

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
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_D1_DATABASE_ID || !CLOUDFLARE_D1_API_TOKEN) {
    console.error('❌ Cloudflare D1 환경 변수가 설정되지 않았습니다:', {
      hasAccountId: !!CLOUDFLARE_ACCOUNT_ID,
      hasDatabaseId: !!CLOUDFLARE_D1_DATABASE_ID,
      hasApiToken: !!CLOUDFLARE_D1_API_TOKEN,
    });
    throw new Error('Cloudflare D1 환경 변수가 설정되지 않았습니다.');
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}/query`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_D1_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
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
  return !!(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_D1_DATABASE_ID && CLOUDFLARE_D1_API_TOKEN);
}

export {
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_D1_DATABASE_ID,
  CLOUDFLARE_D1_API_TOKEN,
};
