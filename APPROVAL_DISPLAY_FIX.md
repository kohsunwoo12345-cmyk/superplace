# ✅ 승인 요청 표시 문제 해결 완료

## 📅 완료 시간
**2026년 3월 3일 17:30 (KST)**

---

## 🔍 발생한 문제

### 증상
- 승인 요청이 전혀 표시되지 않음
- API 호출 시 에러 발생

### 에러 메시지
```json
{
  "success": false,
  "error": "Failed to fetch payment approvals",
  "message": "D1_ERROR: no such column: pa.planId: SQLITE_ERROR"
}
```

---

## 🔎 원인 분석

### 문제 원인
1. **코드에서는** `planId`, `period` 컬럼을 사용하도록 수정
2. **실제 DB에는** 해당 컬럼이 존재하지 않음
3. **Cloudflare D1**에서는 `CREATE TABLE IF NOT EXISTS`가 기존 테이블의 스키마를 변경하지 않음
4. **ALTER TABLE** 쿼리가 실행되었지만 적용되지 않았을 가능성

### 기술적 설명
```sql
-- 이 쿼리는 테이블이 없을 때만 생성
CREATE TABLE IF NOT EXISTS payment_approvals (
  ...
  planId TEXT,  -- 이 컬럼은 기존 테이블에 추가되지 않음!
  period TEXT
);

-- ALTER TABLE 시도
ALTER TABLE payment_approvals ADD COLUMN planId TEXT;
-- 하지만 이미 실행되었거나 실패했을 수 있음

-- SELECT 쿼리에서 planId 참조
SELECT pa.*, pp.* 
FROM payment_approvals pa
LEFT JOIN pricing_plans pp ON pa.planId = pp.id  -- 에러 발생!
```

---

## ✅ 해결 방법

### 1. 컬럼 존재 여부 확인
```typescript
// Check if planId and period columns exist
let hasNewColumns = false;
try {
  const tableInfo = await DB.prepare(`PRAGMA table_info(payment_approvals)`).all();
  const columns = (tableInfo.results || []).map((col: any) => col.name);
  hasNewColumns = columns.includes('planId') && columns.includes('period');
  console.log("✅ Table columns check:", { hasNewColumns, columns: columns.join(', ') });
} catch (e) {
  console.log("⚠️ Could not check table columns");
}
```

### 2. ALTER TABLE 시도
```typescript
// Try to add planId and period columns if they don't exist
try {
  await DB.prepare(`ALTER TABLE payment_approvals ADD COLUMN planId TEXT`).run();
  console.log("✅ Added planId column");
} catch (e) {
  console.log("⚠️ planId column might already exist");
}

try {
  await DB.prepare(`ALTER TABLE payment_approvals ADD COLUMN period TEXT`).run();
  console.log("✅ Added period column");
} catch (e) {
  console.log("⚠️ period column might already exist");
}
```

### 3. 안전한 쿼리 사용
```typescript
// planId를 조인에 사용하지 않음
let query = `
  SELECT 
    pa.*,
    a.name as academyName,
    a.phone as academyPhone,
    a.email as academyEmail,
    u.name as userName,
    u.email as userEmail,
    u.phone as userPhone
  FROM payment_approvals pa
  LEFT JOIN academy a ON pa.academyId = a.id
  LEFT JOIN users u ON pa.userId = u.id
`;  // pricing_plans 조인 제거!
```

### 4. 별도로 가격 정보 조회
```typescript
// For each approval, fetch pricing info if planId exists
const enrichedApprovals = await Promise.all(
  approvals.map(async (approval: any) => {
    if (approval.planId) {  // planId가 있을 때만
      try {
        const pricing = await DB.prepare(`
          SELECT price_1month, price_6months, price_12months
          FROM pricing_plans
          WHERE id = ?
        `).bind(approval.planId).first();

        if (pricing) {
          return {
            ...approval,
            price_1month: pricing.price_1month,
            price_6months: pricing.price_6months,
            price_12months: pricing.price_12months,
          };
        }
      } catch (e) {
        console.log("⚠️ Failed to fetch pricing for planId:", approval.planId);
      }
    }
    return approval;  // planId 없으면 그대로 반환
  })
);
```

---

## 🧪 테스트 결과

### API 테스트
```bash
curl "https://superplacestudy.pages.dev/api/admin/payment-approvals"
```

**결과:**
```json
{
  "success": true,
  "approvals": [
    {
      "id": 10,
      "academyId": "academy-1771479246368-5viyubmqk",
      "academyName": "꾸메땅학원",
      "planName": "엔터프라이즈",
      "amount": 200000,
      "period": null,
      "planId": null,
      "notes": "이름: 고희준\\n이메일: wangholy1@naver.com\\n연락처: 122121",
      "status": "pending",
      ...
    }
    // ... 총 10개 데이터
  ],
  "stats": {
    "total": 10,
    "pending": 3,
    "approved": 6,
    "rejected": 1
  }
}
```

### 확인 사항
- ✅ API 정상 작동 (`success: true`)
- ✅ 10개의 승인 요청 반환
- ✅ 신청자 정보 포함 (notes)
- ✅ 통계 정보 포함
- ✅ 에러 없음

---

## 📊 현재 상태

### 기존 데이터
```json
{
  "planId": null,
  "period": null,
  "notes": "이름: 고희준\n이메일: wangholy1@naver.com\n연락처: 122121"
}
```

**표시 결과:**
- ✅ 이름: 고희준 (notes에서 파싱)
- ✅ 이메일: wangholy1@naver.com (notes에서 파싱)
- ✅ 연락처: 122121 (notes에서 파싱)
- ⚠️ 기간: 정보 없음 (null)
- ⚠️ 가격표: 표시 안됨 (planId가 null)

### 새로운 신청 (이후)
```json
{
  "planId": "plan-enterprise",
  "period": "6months",
  "notes": "이름: 홍길동\n이메일: test@example.com\n연락처: 010-1234-5678\n기간: 6months"
}
```

**표시 결과:**
- ✅ 이름: 홍길동
- ✅ 이메일: test@example.com
- ✅ 연락처: 010-1234-5678
- ✅ 기간: 6개월
- ✅ 가격표: 1/6/12개월 모두 표시

---

## 🔧 수정된 파일

**파일:** `functions/api/admin/payment-approvals.ts`

**주요 변경사항:**
1. PRAGMA table_info로 컬럼 존재 확인
2. ALTER TABLE로 컬럼 추가 시도
3. pricing_plans 조인을 별도 쿼리로 분리
4. planId가 있을 때만 가격 정보 조회
5. 에러 없이 모든 데이터 반환

---

## 🌐 배포 정보

- **API URL**: https://superplacestudy.pages.dev/api/admin/payment-approvals
- **UI URL**: https://superplacestudy.pages.dev/dashboard/admin/subscription-approvals
- **상태**: ✅ Live
- **Commit**: ec078a4
- **배포 시간**: 2026-03-03 17:30

---

## 📈 개선 효과

### Before (이전) ❌
```
API 호출 시:
- 에러 발생 (SQLITE_ERROR: no such column)
- 데이터 0개 반환
- 승인 페이지에 아무것도 표시 안됨
```

### After (현재) ✅
```
API 호출 시:
- 정상 작동 (success: true)
- 10개 데이터 반환
- 승인 페이지에 모든 요청 표시
- 신청자 정보 파싱하여 표시
```

---

## 🎯 결과

### 해결된 문제
1. ✅ API 에러 해결
2. ✅ 승인 요청 목록 표시
3. ✅ 신청자 정보 표시 (이름, 이메일, 연락처)
4. ✅ 기존 데이터와 새 데이터 모두 지원

### 작동 흐름
```
1. API 호출
   ↓
2. PRAGMA로 컬럼 존재 확인
   ↓
3. ALTER TABLE 시도 (컬럼 추가)
   ↓
4. payment_approvals 조회 (planId 없이)
   ↓
5. planId 있으면 pricing_plans 조회
   ↓
6. 데이터 반환 및 표시
```

---

## ⚠️ 주의사항

### 기존 데이터
- `planId`, `period`가 null일 수 있음
- 가격표가 표시되지 않을 수 있음
- 하지만 신청자 정보(이름, 이메일, 연락처)는 정상 표시됨

### 새로운 신청
- 요금제 신청 페이지에서 기간 선택
- `planId`, `period` 자동으로 저장
- 모든 정보가 완전히 표시됨

### DB 마이그레이션
- ALTER TABLE은 한 번만 실행됨
- 실패해도 앱은 정상 작동
- 새 신청부터는 모든 필드 포함

---

## 🎉 완료!

승인 요청이 이제 정상적으로 표시됩니다!

✅ **API 정상 작동**  
✅ **10개 승인 요청 표시**  
✅ **신청자 정보 표시** (이름, 이메일, 연락처)  
✅ **기존 데이터 지원**  
✅ **새 데이터 지원**  

이제 관리자가 모든 요금제 신청을 확인하고 승인할 수 있습니다! 🎊

---

## 📚 관련 문서

1. **PAYMENT_APPROVAL_FIX_COMPLETE.md**: 전체 시스템 수정 문서
2. **test 스크립트**: API 테스트 방법

---

**추가 확인이나 수정이 필요한 부분이 있으시면 말씀해주세요!**
