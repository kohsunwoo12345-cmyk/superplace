# 학원장 제한 설정 문제 진단 가이드

## 🔍 문제 현상
**보고된 증상**: 관리자가 기능을 비활성화했음에도 버튼이 계속 표시됨

## 🎯 디버깅 목적
이 가이드를 통해 **100% 정확한 원인**을 파악할 수 있습니다.

## 📋 디버깅 방법

### 1단계: 브라우저 개발자 도구 열기
1. 학생 상세 페이지 접속
2. **F12** 또는 **우클릭 → 검사** 클릭
3. **Console** 탭 선택
4. 페이지 새로고침 (Ctrl+R 또는 Cmd+R)

### 2단계: 로그 확인

#### A. 제한 설정 로드 확인
페이지 로드 시 다음 로그가 나타나야 합니다:

```javascript
🔍 Fetching limitations for academy: 123
📊 Limitations response status: 200
📥 Limitations data received: {success: true, limitation: {...}}
🔍 BEFORE setLimitations - current limitations: null
✅ Setting limitations: {...}
🔍 AFTER setLimitations called
🎛️ Limitation details:
  - similar_problem_enabled: 0
  - weak_concept_analysis_enabled: 0
  - competency_analysis_enabled: 0
🎛️ Limitation data type check:
  - similar_problem_enabled type: number
  - weak_concept_analysis_enabled type: number
  - competency_analysis_enabled type: number
```

**체크 포인트:**
- [ ] `academy_id`가 올바른 값인가?
- [ ] API 응답 status가 200인가?
- [ ] `success: true`가 포함되어 있는가?
- [ ] 각 `enabled` 값이 0 또는 1인가?
- [ ] 타입이 `number`인가? (문자열이면 문제!)

#### B. 렌더링 시점 확인
페이지가 렌더링될 때 다음 로그가 나타납니다:

```javascript
🎨 Rendering with limitations: {
  similar_problem_enabled: 0,
  weak_concept_analysis_enabled: 0,
  competency_analysis_enabled: 0,
  ...
}
🎨 competency_analysis_enabled: 0
🎨 weak_concept_analysis_enabled: 0
🎨 similar_problem_enabled: 0
```

**체크 포인트:**
- [ ] `limitations`가 `null`이 아닌가?
- [ ] 각 필드 값이 예상과 일치하는가?

#### C. 조건부 렌더링 평가 확인
각 UI 요소가 렌더링될 때 다음 로그를 확인:

```javascript
🎨 AI 역량 분석 카드 렌더링 체크: {
  limitations: {competency_analysis_enabled: 0, ...},
  competency_analysis_enabled: 0,
  shouldShow: false,  ← 이 값이 false여야 함!
  condition1: false,  ← !limitations (false여야 함)
  condition2: false   ← enabled === 1 (false여야 함)
}

🎨 부족한 개념 탭 렌더링 체크: {
  limitations: {weak_concept_analysis_enabled: 0, ...},
  weak_concept_analysis_enabled: 0,
  shouldShow: false,  ← 이 값이 false여야 함!
  condition1: false,
  condition2: false
}
```

**체크 포인트:**
- [ ] `shouldShow`가 `false`인가?
- [ ] `condition1` (!limitations)이 `false`인가?
- [ ] `condition2` (enabled === 1)이 `false`인가?

## 🐛 가능한 문제 시나리오

### 시나리오 1: API 응답이 없음
**증상:**
```javascript
⚠️ No academy_id found for student
```

**원인:** 학생 데이터에 `academy_id`가 없음

**해결:**
1. DB에서 해당 학생의 `academy_id` 확인
2. 학생 정보 수정하여 `academy_id` 추가

### 시나리오 2: API 응답 형식 오류
**증상:**
```javascript
⚠️ Limitations data structure unexpected: {limitation: {...}}
```

**원인:** API가 `success: true`를 반환하지 않음

**해결:**
1. `/api/admin/director-limitations` API 확인
2. 응답에 `{ success: true, limitation }` 포함 확인

### 시나리오 3: 데이터 타입 불일치
**증상:**
```javascript
🎛️ Limitation data type check:
  - competency_analysis_enabled type: string  ← 문자열!
```

**원인:** DB에서 숫자가 아닌 문자열로 저장됨

**해결:**
1. API에서 `Number()` 변환 추가
2. DB 데이터 수정

### 시나리오 4: limitations state가 null
**증상:**
```javascript
🎨 Rendering with limitations: null
🎨 AI 역량 분석 카드 렌더링 체크: {
  limitations: null,
  shouldShow: true  ← null이면 true!
}
```

**원인:** `setLimitations`가 호출되지 않았거나 API 호출 실패

**해결:**
1. 2단계-A의 로그 확인
2. API 응답 확인
3. `setLimitations` 호출 여부 확인

### 시나리오 5: 값은 0인데 비교가 실패
**증상:**
```javascript
🎛️ Limitation details:
  - competency_analysis_enabled: 0
🎨 AI 역량 분석 카드 렌더링 체크: {
  competency_analysis_enabled: 0,
  condition2: false,  ← 0 === 1은 false
  shouldShow: true   ← 그런데 true??
}
```

**원인:** `condition1` (!limitations)이 `true`

**해결:** limitations가 제대로 설정되지 않았음을 의미

### 시나리오 6: 문자열 "0"으로 저장됨
**증상:**
```javascript
🎛️ Limitation data type check:
  - competency_analysis_enabled type: string
  - competency_analysis_enabled value: "0"
🎨 AI 역량 분석 카드 렌더링 체크: {
  competency_analysis_enabled: "0",
  condition2: false,  ← "0" === 1은 false
  shouldShow: true   ← 하지만 "0"은 truthy!
}
```

**원인:** 문자열 "0"은 JavaScript에서 truthy 값

**해결:**
```typescript
// API에서 숫자로 변환
competency_analysis_enabled: Number(row.competency_analysis_enabled)
```

## 🔧 문제별 해결 방법

### 문제 1: academy_id 없음
```sql
-- DB 확인
SELECT id, name, academy_id FROM users WHERE id = [student_id];

-- academy_id 추가
UPDATE users SET academy_id = [academy_id] WHERE id = [student_id];
```

### 문제 2: API 응답 형식
```typescript
// functions/api/admin/director-limitations.ts
// ❌ 잘못된 형식
return new Response(JSON.stringify({ limitation }));

// ✅ 올바른 형식
return new Response(JSON.stringify({ success: true, limitation }));
```

### 문제 3: 데이터 타입
```typescript
// API에서 숫자로 변환
const limitation = {
  ...row,
  competency_analysis_enabled: Number(row.competency_analysis_enabled),
  weak_concept_analysis_enabled: Number(row.weak_concept_analysis_enabled),
  similar_problem_enabled: Number(row.similar_problem_enabled),
};
```

### 문제 4: 조건부 렌더링 로직
```tsx
// 현재 로직
{(!limitations || limitations.competency_analysis_enabled === 1) && (
  <Card>...</Card>
)}

// limitations가 null이면 표시됨 (기본값)
// limitations.competency_analysis_enabled === 1이면 표시됨
// limitations.competency_analysis_enabled === 0이면 숨김
```

## 📊 정상 동작 시 예상 로그

### 기능 모두 비활성화 (0)
```javascript
// 1. 로드
🔍 Fetching limitations for academy: 123
📊 Limitations response status: 200
📥 Limitations data received: {success: true, limitation: {
  competency_analysis_enabled: 0,
  weak_concept_analysis_enabled: 0,
  similar_problem_enabled: 0
}}
✅ Setting limitations: {...}
🎛️ Limitation details:
  - similar_problem_enabled: 0
  - weak_concept_analysis_enabled: 0
  - competency_analysis_enabled: 0
🎛️ Limitation data type check:
  - similar_problem_enabled type: number
  - weak_concept_analysis_enabled type: number
  - competency_analysis_enabled type: number

// 2. 렌더링
🎨 Rendering with limitations: {competency_analysis_enabled: 0, ...}
🎨 competency_analysis_enabled: 0
🎨 weak_concept_analysis_enabled: 0
🎨 similar_problem_enabled: 0

// 3. UI 체크
🎨 AI 역량 분석 카드 렌더링 체크: {
  limitations: {competency_analysis_enabled: 0},
  competency_analysis_enabled: 0,
  shouldShow: false,  ✅ 숨김
  condition1: false,
  condition2: false
}

🎨 부족한 개념 탭 렌더링 체크: {
  limitations: {weak_concept_analysis_enabled: 0},
  weak_concept_analysis_enabled: 0,
  shouldShow: false,  ✅ 숨김
  condition1: false,
  condition2: false
}
```

**예상 결과:**
- ❌ AI 역량 분석 카드 없음
- ❌ 부족한 개념 탭 없음
- ❌ 유사문제 출제 버튼 없음

### 기능 모두 활성화 (1)
```javascript
// 1. 로드
🎛️ Limitation details:
  - similar_problem_enabled: 1
  - weak_concept_analysis_enabled: 1
  - competency_analysis_enabled: 1

// 2. UI 체크
🎨 AI 역량 분석 카드 렌더링 체크: {
  competency_analysis_enabled: 1,
  shouldShow: true,  ✅ 표시
  condition2: true   ✅ 1 === 1
}

🎨 부족한 개념 탭 렌더링 체크: {
  weak_concept_analysis_enabled: 1,
  shouldShow: true,  ✅ 표시
  condition2: true   ✅ 1 === 1
}
```

**예상 결과:**
- ✅ AI 역량 분석 카드 표시
- ✅ 부족한 개념 탭 표시
- ✅ 유사문제 출제 버튼 표시

## 🎯 다음 단계

1. **콘솔 로그 캡처**: 위의 모든 로그를 복사
2. **문제 패턴 확인**: 어느 단계에서 예상과 다른지 확인
3. **해당 시나리오 찾기**: 위의 시나리오 중 일치하는 것 찾기
4. **해결 방법 적용**: 제시된 해결 방법 실행

## 📝 보고 양식

문제 보고 시 다음 정보를 제공해주세요:

```
1. 설정한 값:
   - competency_analysis_enabled: 0 또는 1
   - weak_concept_analysis_enabled: 0 또는 1
   - similar_problem_enabled: 0 또는 1

2. 콘솔 로그:
   [전체 콘솔 로그 붙여넣기]

3. 실제 동작:
   - AI 역량 분석 카드: 보임 / 안 보임
   - 부족한 개념 탭: 보임 / 안 보임
   - 유사문제 출제 버튼: 보임 / 안 보임

4. 예상 동작:
   [무엇을 예상했는지]
```

이 정보를 통해 **100% 정확한 원인**을 파악할 수 있습니다!
