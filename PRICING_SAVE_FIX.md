# ✅ 요금제 저장 기능 수정 완료

## 📋 작업 개요

**날짜**: 2026-03-02  
**Commit**: `76e084d`  
**상태**: ✅ 완료 및 배포됨

---

## 🔍 문제 분석

### 문제점
1. **요금제 생성만 가능**, 수정 및 삭제가 불가능
2. **API 핸들러 누락**: `pricing-plans.ts`에 PUT, DELETE 핸들러가 없음
3. **엔드포인트 불일치**: 프론트엔드가 `/api/admin/pricing` 호출, 실제 API는 `/api/admin/pricing-plans`

### 영향
- 관리자가 요금제를 한 번 생성하면 수정/삭제 불가능
- 잘못 입력한 요금제 정보를 고칠 수 없음
- 테스트 요금제를 삭제할 수 없음

---

## 🛠️ 수정 내역

### 1. API 핸들러 추가 (`functions/api/admin/pricing-plans.ts`)

#### ✅ PUT Handler (요금제 수정)
```typescript
export const onRequestPut: PagesFunction<Env> = async (context) => {
  // 요청 데이터 검증
  const data: PricingPlanRequest & { id: string } = await context.request.json();
  
  if (!data.id || !data.name || data.pricing_1month === undefined) {
    return Response(400, "필수 정보 누락");
  }
  
  // 요금제 존재 확인
  const existingPlan = await db.prepare("SELECT id FROM pricing_plans WHERE id = ?")
    .bind(data.id).first();
  
  if (!existingPlan) {
    return Response(404, "요금제를 찾을 수 없습니다");
  }
  
  // 업데이트 실행
  await db.prepare(`
    UPDATE pricing_plans SET
      name = ?, description = ?,
      pricing_1month = ?, pricing_6months = ?, pricing_12months = ?,
      maxStudents = ?, maxTeachers = ?,
      maxHomeworkChecks = ?, maxAIAnalysis = ?, maxAIGrading = ?,
      maxCapabilityAnalysis = ?, maxConceptAnalysis = ?,
      maxSimilarProblems = ?, maxLandingPages = ?,
      features = ?, isPopular = ?, color = ?, \`order\` = ?,
      isActive = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(...).run();
  
  return Response(200, "요금제가 수정되었습니다");
};
```

**주요 기능**:
- 모든 필드 업데이트 가능
- `updatedAt` 자동 갱신
- 존재하지 않는 요금제 수정 시 404 에러
- 로깅으로 디버깅 지원

#### ✅ DELETE Handler (요금제 삭제)
```typescript
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const planId = url.searchParams.get("id");
  
  // 활성 구독 확인
  const activeSubscriptions = await db.prepare(
    "SELECT COUNT(*) as count FROM user_subscriptions WHERE planId = ? AND status = 'active'"
  ).bind(planId).first();
  
  if (activeSubscriptions.count > 0) {
    // 활성 구독이 있으면 비활성화만 수행
    await db.prepare("UPDATE pricing_plans SET isActive = 0 WHERE id = ?").bind(planId).run();
    return Response(200, "활성 구독이 있어 요금제를 비활성화했습니다", { action: "deactivated" });
  }
  
  // 활성 구독이 없으면 완전 삭제
  await db.prepare("DELETE FROM pricing_plans WHERE id = ?").bind(planId).run();
  return Response(200, "요금제가 삭제되었습니다", { action: "deleted" });
};
```

**주요 기능**:
- 안전한 삭제 로직 (활성 구독 확인)
- 활성 구독 있음 → 비활성화
- 활성 구독 없음 → 완전 삭제
- 삭제/비활성화 여부 응답에 포함

### 2. 프론트엔드 수정 (`src/app/dashboard/admin/pricing/page.tsx`)

#### ✅ Delete 함수 업데이트
```typescript
const handleDelete = async (planId: number | string) => {
  if (!confirm("이 요금제를 삭제하시겠습니까?")) return;
  
  try {
    // ✅ 올바른 엔드포인트로 변경
    const response = await fetch(`/api/admin/pricing-plans?id=${planId}`, {
      method: "DELETE"
    });
    
    if (response.ok) {
      const data = await response.json();
      alert(data.message || "요금제가 삭제되었습니다.");
      fetchPlans();
    } else {
      const errorData = await response.json();
      alert("요금제 삭제에 실패했습니다: " + (errorData.message || ""));
    }
  } catch (error) {
    console.error("요금제 삭제 실패:", error);
    alert("요금제 삭제 중 오류가 발생했습니다.");
  }
};
```

**변경 사항**:
- `/api/admin/pricing` → `/api/admin/pricing-plans`
- 에러 메시지 상세화
- 서버 응답 메시지 표시

#### ✅ 인터페이스 업데이트
```typescript
interface PricingPlan {
  id: number | string;  // ✅ string 타입 추가 (plan-xxx 형식 지원)
  name: string;
  description: string;
  // ...
}
```

### 3. 로깅 추가

모든 API 핸들러에 로깅 추가:
```typescript
console.log("📥 POST /api/admin/pricing-plans - Request data:", data);
console.log("📝 PUT /api/admin/pricing-plans - Request data:", data);
console.log("🗑️ DELETE /api/admin/pricing-plans - Plan ID:", planId);
console.log("✅ 요금제 생성 성공:", planId);
console.log("✅ 요금제 수정 성공:", data.id);
console.log("✅ 요금제 삭제 성공:", planId);
```

---

## 🧪 테스트 방법

### 1. 요금제 생성 테스트
```
1. https://superplacestudy.pages.dev/dashboard/admin/pricing 접속
2. "새 요금제 추가" 버튼 클릭
3. 정보 입력:
   - 요금제 이름: "테스트 플랜"
   - 월간 가격: 50000
   - 최대 학생 수: 30
   - 최대 선생님 수: 5
   - 기타 한도 값 입력
4. "저장" 버튼 클릭
5. ✅ "요금제가 추가되었습니다" 메시지 확인
6. ✅ 페이지에 새 요금제 카드 표시 확인
```

### 2. 요금제 수정 테스트
```
1. 기존 요금제 카드에서 "수정" 버튼 클릭
2. 필드 값 변경:
   - 월간 가격: 50000 → 60000
   - 최대 학생 수: 30 → 50
3. "저장" 버튼 클릭
4. ✅ "요금제가 수정되었습니다" 메시지 확인
5. ✅ 카드에 변경된 값 표시 확인
```

### 3. 요금제 삭제 테스트
```
1. 요금제 카드에서 "삭제" 버튼 클릭
2. 확인 팝업에서 "확인" 클릭
3. ✅ 성공 메시지 확인:
   - 활성 구독 있음: "활성 구독이 있어 요금제를 비활성화했습니다"
   - 활성 구독 없음: "요금제가 삭제되었습니다"
4. ✅ 카드가 사라지거나 비활성 표시됨
```

### 4. API 직접 테스트

#### 생성 테스트
```bash
curl -X POST https://superplacestudy.pages.dev/api/admin/pricing-plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트 플랜",
    "description": "테스트용 요금제",
    "pricing_1month": 50000,
    "pricing_6months": 270000,
    "pricing_12months": 500000,
    "maxStudents": 30,
    "maxTeachers": 5,
    "maxHomeworkChecks": 100,
    "maxAIAnalysis": 50,
    "maxAIGrading": 100,
    "maxCapabilityAnalysis": 50,
    "maxConceptAnalysis": 50,
    "maxSimilarProblems": 100,
    "maxLandingPages": 3,
    "features": "[\"기능1\",\"기능2\"]",
    "isPopular": false,
    "isActive": true,
    "color": "#3b82f6",
    "order": 0
  }'
```

#### 수정 테스트
```bash
curl -X PUT https://superplacestudy.pages.dev/api/admin/pricing-plans \
  -H "Content-Type: application/json" \
  -d '{
    "id": "plan-1735824000000-abc123",
    "name": "업데이트된 플랜",
    "pricing_1month": 60000,
    ...
  }'
```

#### 삭제 테스트
```bash
curl -X DELETE "https://superplacestudy.pages.dev/api/admin/pricing-plans?id=plan-1735824000000-abc123"
```

---

## 📊 API 엔드포인트

| Method | Endpoint | 설명 | 요청 Body | 응답 |
|--------|----------|------|-----------|------|
| **GET** | `/api/admin/pricing-plans` | 요금제 목록 조회 | - | `{ success, plans, count }` |
| **POST** | `/api/admin/pricing-plans` | 요금제 생성 | PricingPlanRequest | `{ success, message, planId }` |
| **PUT** | `/api/admin/pricing-plans` | 요금제 수정 | PricingPlanRequest + id | `{ success, message, planId }` |
| **DELETE** | `/api/admin/pricing-plans?id=xxx` | 요금제 삭제 | - | `{ success, message, action }` |

### PricingPlanRequest 스키마
```typescript
{
  name: string;              // 요금제 이름 *
  description: string;       // 설명
  pricing_1month: number;    // 1개월 가격 *
  pricing_6months: number;   // 6개월 가격
  pricing_12months: number;  // 12개월 가격
  maxStudents: number;       // 최대 학생 수 (-1 = 무제한)
  maxTeachers: number;       // 최대 선생님 수
  maxHomeworkChecks: number; // 월별 숙제 검사 횟수
  maxAIAnalysis: number;     // 월별 AI 분석 횟수
  maxAIGrading: number;      // 월별 AI 채점 횟수
  maxCapabilityAnalysis: number;  // 월별 역량 분석
  maxConceptAnalysis: number;     // 월별 개념 분석
  maxSimilarProblems: number;     // 월별 유사문제 생성
  maxLandingPages: number;        // 랜딩페이지 제작 수
  features: string;          // JSON 문자열 배열
  isPopular: boolean;        // 인기 요금제 여부
  isActive: boolean;         // 활성화 여부
  color: string;             // 색상 코드
  order: number;             // 정렬 순서
}
```

---

## ✅ 체크리스트

### API 구현
- [x] GET 핸들러 (기존 유지)
- [x] POST 핸들러 (기존 유지, 로깅 추가)
- [x] PUT 핸들러 (신규 추가)
- [x] DELETE 핸들러 (신규 추가)

### 프론트엔드
- [x] handleSave (생성/수정 분기 처리)
- [x] handleDelete (엔드포인트 수정)
- [x] PricingPlan 인터페이스 (id 타입 확장)
- [x] 에러 메시지 개선

### 안전 기능
- [x] 요금제 존재 여부 확인
- [x] 활성 구독 확인 로직
- [x] 비활성화 vs 삭제 분기
- [x] 로깅 (디버깅 지원)

### 테스트
- [x] 빌드 성공
- [x] Git 커밋 및 푸시
- [ ] 실제 페이지 테스트 (배포 후 관리자 계정 필요)

---

## 🚀 배포 정보

- **Commit**: `76e084d`
- **Branch**: `main`
- **Repository**: https://github.com/kohsunwoo12345-cmyk/superplace.git
- **Deployment URL**: https://superplacestudy.pages.dev
- **배포 시간**: 약 3분 (Cloudflare Pages 자동 배포)
- **상태**: ✅ 배포 완료

---

## 🔍 디버깅 가이드

### 요금제가 저장되지 않는 경우

1. **브라우저 콘솔 확인** (F12 → Console)
   ```
   예상 로그:
   - "Form data: { name: '...', ... }"
   - "Sending payload: { ... }"
   - "📥 POST /api/admin/pricing-plans - Request data: ..."
   - "✅ 요금제 생성 성공: plan-xxx"
   ```

2. **네트워크 탭 확인** (F12 → Network)
   - `/api/admin/pricing-plans` 요청 찾기
   - Status Code: 201 (생성), 200 (수정), 404 (없음), 500 (서버 오류)
   - Response 탭에서 에러 메시지 확인

3. **Cloudflare Workers 로그 확인**
   ```
   Cloudflare Dashboard → Workers & Pages → superplacestudy → Logs
   ```

### 요금제가 수정되지 않는 경우

1. **요금제 ID 확인**
   - 브라우저 콘솔: `console.log(editingPlan.id)`
   - ID가 `plan-xxx` 형식인지 확인

2. **PUT 요청 데이터 확인**
   ```javascript
   console.log("📝 PUT Data:", { ...payload, id: editingPlan.id });
   ```

3. **DB 존재 여부 확인**
   ```sql
   SELECT * FROM pricing_plans WHERE id = 'plan-xxx';
   ```

---

## 📞 추가 지원

문제 발생 시:
1. 브라우저 콘솔 로그 캡처
2. 네트워크 탭 스크린샷
3. Cloudflare Workers 로그 확인
4. `/api/admin/pricing-plans` 직접 curl 테스트

---

**작성일**: 2026-03-02  
**작성자**: AI Developer  
**문서 버전**: 1.0  
**상태**: ✅ 완료
