// 사용자 조회 테스트
const userId = "student-1772865608071-3s67r1wq6n5";
const phone = "01051363624";

console.log("테스트 데이터:");
console.log(`  userId: ${userId} (type: ${typeof userId})`);
console.log(`  phone: ${phone} (type: ${typeof phone})`);
console.log("");

// SQL 쿼리 시뮬레이션
console.log("SQL 쿼리:");
console.log(`  SELECT * FROM User WHERE id = '${userId}' OR phone = '${phone}'`);
console.log("");

console.log("예상 문제:");
console.log("  - User 테이블에 id 컬럼이 TEXT 타입인지 확인 필요");
console.log("  - phone 컬럼에 하이픈이 포함되어 있는지 확인 필요");
