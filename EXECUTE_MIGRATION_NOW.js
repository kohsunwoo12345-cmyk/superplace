#!/usr/bin/env node

/**
 * 즉시 실행: Cloudflare D1 Database 수동 마이그레이션
 * 웹 브라우저로 Cloudflare Console에 접속하여 SQL 실행
 */

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║   🔧 즉시 실행: D1 Database 수동 마이그레이션                ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('⚠️  배포를 기다릴 수 없으므로 수동으로 실행합니다!\n');

console.log('📋 1단계: Cloudflare Dashboard 접속');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('URL: https://dash.cloudflare.com\n');

console.log('📋 2단계: D1 Database Console 열기');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. 왼쪽 메뉴 → "Workers & Pages"');
console.log('2. "superplacestudy" 프로젝트 클릭');
console.log('3. 상단 탭 → "Settings"');
console.log('4. 왼쪽 → "Bindings"');
console.log('5. "D1 database bindings" 섹션 찾기');
console.log('6. DB 이름 오른쪽 → "Open console" 버튼 클릭\n');

console.log('📋 3단계: SQL 명령 복사 & 붙여넣기');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n다음 SQL을 **한 줄씩** D1 Console에 붙여넣고 실행:\n');

console.log('-- 1. 현재 테이블 구조 확인');
console.log('PRAGMA table_info(BotPurchaseRequest);\n');

console.log('-- 2. email 컬럼 추가');
console.log('ALTER TABLE BotPurchaseRequest ADD COLUMN email TEXT;\n');

console.log('-- 3. name 컬럼 추가');
console.log('ALTER TABLE BotPurchaseRequest ADD COLUMN name TEXT;\n');

console.log('-- 4. requestAcademyName 컬럼 추가');
console.log('ALTER TABLE BotPurchaseRequest ADD COLUMN requestAcademyName TEXT;\n');

console.log('-- 5. phoneNumber 컬럼 추가');
console.log('ALTER TABLE BotPurchaseRequest ADD COLUMN phoneNumber TEXT;\n');

console.log('-- 6. 최종 확인');
console.log('PRAGMA table_info(BotPurchaseRequest);\n');

console.log('📋 4단계: 성공 확인');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('마지막 PRAGMA 출력에서 다음 컬럼들이 보여야 함:');
console.log('✅ email');
console.log('✅ name');
console.log('✅ requestAcademyName');
console.log('✅ phoneNumber\n');

console.log('⚠️  주의사항:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('- 각 SQL 문을 **하나씩** 실행하세요');
console.log('- "duplicate column name" 오류는 무시하세요 (이미 추가됨)');
console.log('- 모든 ALTER TABLE이 완료되어야 구매 신청이 작동합니다\n');

console.log('📋 5단계: 구매 신청 테스트');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. https://superplacestudy.pages.dev/store');
console.log('2. AI 봇 선택 → "구매하기"');
console.log('3. 이메일: test@test.com');
console.log('4. 이름: 테스트');
console.log('5. 학원 이름: 테스트학원');
console.log('6. 연락처: 010-0000-0000');
console.log('7. "구매 신청하기" 클릭');
console.log('8. ✅ "구매 신청이 완료되었습니다!" 확인\n');

console.log('📋 6단계: 승인 페이지 확인');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. 관리자 로그인');
console.log('2. https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals');
console.log('3. 방금 신청한 구매 확인:');
console.log('   ✅ 이메일: test@test.com');
console.log('   ✅ 이름: 테스트');
console.log('   ✅ 학원: 테스트학원');
console.log('   ✅ 연락처: 010-0000-0000\n');

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║   시작하세요!                                                 ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('👉 지금 바로 Cloudflare Dashboard를 여세요:');
console.log('   https://dash.cloudflare.com\n');

console.log('⏱️  예상 소요 시간: 3분\n');
