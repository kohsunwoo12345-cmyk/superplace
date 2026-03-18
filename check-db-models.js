// D1 데이터베이스에서 현재 활성화된 봇의 모델명 확인
import { D1Database } from '@cloudflare/workers-types';

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'f5f9ca5f6133f5a6b3e7e0f74cfce45e';
const CLOUDFLARE_DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID || 'f12e2730-cd89-4d45-874f-0ab7e9fa0f7c';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

console.log('=== 현재 DB 모델 확인 중 ===\n');

const query = `
SELECT 
  id, 
  name, 
  model, 
  isActive 
FROM ai_bots 
WHERE isActive = 1 
ORDER BY createdAt DESC 
LIMIT 10
`;

console.log('📊 SQL 쿼리:');
console.log(query);
console.log('\n⚠️ 주의: CLOUDFLARE_API_TOKEN이 필요합니다.');
console.log('수동으로 확인하려면:');
console.log('Cloudflare Dashboard → D1 → superplace_db → Console에서 위 쿼리 실행');
