#!/usr/bin/env node

/**
 * D1 Database 테이블 스키마 확인
 * BotPurchaseRequest 테이블의 실제 컬럼 구조를 확인
 */

const BASE_URL = 'https://superplacestudy.pages.dev';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║   D1 Database 테이블 스키마 확인                             ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

async function checkTableSchema() {
  console.log('🔍 문제: table BotPurchaseRequest has no column named email');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('⚠️  원인 분석:');
  console.log('1. CREATE TABLE IF NOT EXISTS는 기존 테이블이 있으면 스킵');
  console.log('2. 기존 테이블에 email 컬럼이 없으면 추가되지 않음');
  console.log('3. 테이블 구조를 변경하려면 ALTER TABLE 또는 DROP & CREATE 필요\n');
  
  console.log('📋 해결 방법:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('방법 1: Cloudflare Dashboard에서 수동으로 ALTER TABLE 실행');
  console.log('--------------------------------------------------------------');
  console.log('1. Cloudflare Dashboard → Workers & Pages → superplacestudy');
  console.log('2. Settings → Bindings → D1 Database 클릭');
  console.log('3. "Open D1 console" 버튼 클릭');
  console.log('4. 다음 SQL 실행:\n');
  
  console.log('```sql');
  console.log('-- 기존 컬럼 확인');
  console.log('PRAGMA table_info(BotPurchaseRequest);');
  console.log('');
  console.log('-- email 컬럼이 없으면 추가');
  console.log('ALTER TABLE BotPurchaseRequest ADD COLUMN email TEXT;');
  console.log('ALTER TABLE BotPurchaseRequest ADD COLUMN name TEXT;');
  console.log('ALTER TABLE BotPurchaseRequest ADD COLUMN requestAcademyName TEXT;');
  console.log('ALTER TABLE BotPurchaseRequest ADD COLUMN phoneNumber TEXT;');
  console.log('```\n');
  
  console.log('방법 2: 테이블 재생성 (데이터 백업 필요)');
  console.log('--------------------------------------------------------------');
  console.log('⚠️  주의: 기존 데이터가 모두 삭제됩니다!\n');
  console.log('```sql');
  console.log('-- 1. 기존 데이터 백업 (필요시)');
  console.log('-- CREATE TABLE BotPurchaseRequest_backup AS SELECT * FROM BotPurchaseRequest;');
  console.log('');
  console.log('-- 2. 기존 테이블 삭제');
  console.log('DROP TABLE IF EXISTS BotPurchaseRequest;');
  console.log('');
  console.log('-- 3. 새 테이블 생성');
  console.log('CREATE TABLE BotPurchaseRequest (');
  console.log('  id TEXT PRIMARY KEY,');
  console.log('  productId TEXT NOT NULL,');
  console.log('  productName TEXT NOT NULL,');
  console.log('  userId TEXT NOT NULL,');
  console.log('  academyId TEXT NOT NULL,');
  console.log('  studentCount INTEGER NOT NULL,');
  console.log('  months INTEGER NOT NULL,');
  console.log('  pricePerStudent INTEGER NOT NULL,');
  console.log('  totalPrice INTEGER NOT NULL,');
  console.log('  email TEXT,');
  console.log('  name TEXT,');
  console.log('  requestAcademyName TEXT,');
  console.log('  phoneNumber TEXT,');
  console.log('  requestMessage TEXT,');
  console.log('  status TEXT DEFAULT \'PENDING\',');
  console.log('  approvedBy TEXT,');
  console.log('  approvedAt TEXT,');
  console.log('  rejectionReason TEXT,');
  console.log('  subscriptionStartDate TEXT,');
  console.log('  subscriptionEndDate TEXT,');
  console.log('  createdAt TEXT NOT NULL,');
  console.log('  updatedAt TEXT NOT NULL');
  console.log(');');
  console.log('```\n');
  
  console.log('방법 3: 마이그레이션 API 생성');
  console.log('--------------------------------------------------------------');
  console.log('API를 통해 자동으로 컬럼 추가\n');
  
  console.log('🔧 현재 상태 확인:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('실제 테이블 구조를 확인하려면:');
  console.log('1. Cloudflare D1 Console 접속');
  console.log('2. 실행: PRAGMA table_info(BotPurchaseRequest);');
  console.log('3. 출력에서 email, name, requestAcademyName, phoneNumber 컬럼 확인\n');
  
  console.log('✅ 권장 해결 순서:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('1. Cloudflare D1 Console 접속');
  console.log('2. PRAGMA table_info(BotPurchaseRequest); 실행');
  console.log('3. email 컬럼이 없으면 → ALTER TABLE 실행 (방법 1)');
  console.log('4. 데이터가 없으면 → DROP & CREATE 실행 (방법 2)');
  console.log('5. 구매 신청 재시도');
  console.log('6. 성공 확인\n');
}

async function createMigrationAPI() {
  console.log('\n\n📝 마이그레이션 API 생성 중...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('파일 생성: functions/api/admin/migrate-bot-purchase-table.ts');
}

// 실행
(async () => {
  await checkTableSchema();
  await createMigrationAPI();
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   다음 단계                                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log('1️⃣  Cloudflare Dashboard 접속');
  console.log('2️⃣  D1 Database Console 열기');
  console.log('3️⃣  ALTER TABLE 명령 실행');
  console.log('4️⃣  구매 신청 재시도');
  console.log('5️⃣  성공 확인\n');
})();
