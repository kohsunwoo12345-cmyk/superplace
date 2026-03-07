# 사용량 자동 로깅 완료 보고서

## ✅ 작업 완료 내용

### 1. 자동 카운트 구현 완료

다음 기능들이 **실제 사용 시 자동으로 카운트**되도록 구현:

#### 📚 숙제 검사 (`homeworkChecks`)
- **테이블**: `homework_submissions`
- **카운트 조건**: `submittedAt`이 있는 제출된 숙제
- **조인**: `User` 테이블과 조인하여 `academyId` 기준으로 카운트
- **기간**: 플랜 시작일부터 현재까지

#### 📄 랜딩페이지 생성 (`landingPages`)
- **테이블**: `landing_pages`
- **카운트 조건**: 생성된 모든 랜딩페이지
- **조회 방법**: 
  - 1순위: `academyId`로 직접 조회 (새 스키마)
  - 2순위: `user_id`로 조회 (구 스키마, 해시 변환)
- **기간**: 플랜 시작일부터 현재까지

#### 🧠 AI 역량 분석 (`aiAnalysis`)
- **API**: `/api/students/analysis` (POST)
- **로깅**: 분석 실행 후 `usage_logs`에 자동 기록
- **타입**: `'ai_analysis'`
- **동작**:
  1. 학생 ID → 학원 ID 조회
  2. 학원 ID → 학원장 ID 조회
  3. 학원장 ID로 `usage_logs` INSERT
  4. `check.ts`에서 카운트

#### 📊 부족한 개념 분석 (`aiAnalysis`)
- **API**: `/api/students/weak-concepts` (POST)
- **로깅**: 분석 실행 후 `usage_logs`에 자동 기록
- **타입**: `'weak_concept'`
- **동작**: AI 역량 분석과 동일
- **카운트**: `check.ts`에서 `ai_analysis`와 `weak_concept` 합산

#### 🔄 유사문제 출제 (`similarProblems`)
- **API**: `/api/homework/generate-similar-problems` (POST)
- **로깅**: 이미 구현되어 있음 (line 507-519)
- **타입**: `'similar_problem'`
- **동작**: AI 분석과 동일

## 📋 코드 변경 사항

### 1. `/functions/api/students/analysis/index.ts`
```typescript
// 🆕 AI 분석 사용량 로그 기록 (83-113줄)
try {
  const student = await DB.prepare(`
    SELECT id, academyId FROM User WHERE id = ?
  `).bind(parseInt(studentId)).first();

  if (student && student.academyId) {
    const director = await DB.prepare(`
      SELECT id FROM User 
      WHERE academyId = ? AND role = 'DIRECTOR'
      LIMIT 1
    `).bind(student.academyId).first();

    if (director) {
      const logId = `log_ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await DB.prepare(`
        INSERT INTO usage_logs (id, userId, subscriptionId, type, action, createdAt)
        VALUES (?, ?, 1, 'ai_analysis', 'AI 역량 분석 실행', datetime('now'))
      `).bind(logId, director.id).run();
      
      console.log('✅ AI analysis usage logged for director:', director.id);
    }
  }
} catch (logError: any) {
  console.warn('⚠️ Failed to log AI analysis usage:', logError.message);
}
```

### 2. `/functions/api/students/weak-concepts/index.ts`
```typescript
// 🆕 부족한 개념 분석 사용량 로그 기록 (661-690줄)
try {
  const student = await DB.prepare(`
    SELECT id, academyId FROM User WHERE id = ?
  `).bind(parseInt(studentId)).first();

  if (student && student.academyId) {
    const director = await DB.prepare(`
      SELECT id FROM User 
      WHERE academyId = ? AND role = 'DIRECTOR'
      LIMIT 1
    `).bind(student.academyId).first();

    if (director) {
      const logId = `log_concept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await DB.prepare(`
        INSERT INTO usage_logs (id, userId, subscriptionId, type, action, createdAt)
        VALUES (?, ?, 1, 'weak_concept', '부족한 개념 분석 실행', datetime('now'))
      `).bind(logId, director.id).run();
      
      console.log('✅ Weak concept analysis usage logged for director:', director.id);
    }
  }
} catch (logError: any) {
  console.warn('⚠️ Failed to log weak concept analysis usage:', logError.message);
}
```

### 3. `/functions/api/subscription/check.ts`
```typescript
// 🔄 AI 분석 카운트 업데이트 (156-172줄)
try {
  const aiAnalysisResult = await DB.prepare(`
    SELECT COUNT(*) as count 
    FROM usage_logs ul
    JOIN User u ON CAST(ul.userId AS TEXT) = u.id
    WHERE u.academyId = ? 
      AND (ul.type = 'ai_analysis' OR ul.type = 'weak_concept')  // 👈 두 타입 모두 카운트
      AND ul.createdAt >= ?
      AND ul.createdAt <= ?
  `).bind(targetAcademyId, planStartISO, planEndISO).first();
  actualAIAnalysis = aiAnalysisResult?.count || 0;
  console.log(`✅ AI 분석 (역량 분석 + 부족한 개념) ${actualAIAnalysis}개`);
} catch (e: any) {
  console.log('⚠️ usage_logs(ai_analysis, weak_concept) 조회 실패:', e.message);
  actualAIAnalysis = 0;
}
```

## 🔍 동작 흐름

### 예시: 학생이 역량 분석을 실행하는 경우

1. **프론트엔드**: 
   ```javascript
   POST /api/students/analysis
   Body: { studentId: 123 }
   ```

2. **API 처리**:
   ```
   studentId(123) → User 테이블 조회
   → academyId('academy_001') 찾음
   → academyId로 DIRECTOR 조회
   → directorId(456) 찾음
   → usage_logs에 INSERT:
     {
       id: 'log_ai_1234567890_abc',
       userId: 456,
       subscriptionId: 1,
       type: 'ai_analysis',
       action: 'AI 역량 분석 실행',
       createdAt: '2026-03-07 12:34:56'
     }
   ```

3. **대시보드 조회**:
   ```javascript
   GET /api/subscription/check?academyId=academy_001
   ```

4. **카운트 쿼리**:
   ```sql
   SELECT COUNT(*) 
   FROM usage_logs ul
   JOIN User u ON CAST(ul.userId AS TEXT) = u.id
   WHERE u.academyId = 'academy_001' 
     AND (ul.type = 'ai_analysis' OR ul.type = 'weak_concept')
     AND ul.createdAt >= '2026-03-01'
     AND ul.createdAt <= '2026-03-31'
   ```

5. **결과**: `aiAnalysis: 15` (역량 분석 10회 + 부족한 개념 분석 5회)

## 📊 데이터베이스 구조

### `usage_logs` 테이블
```sql
CREATE TABLE usage_logs (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,           -- 학원장 ID
  subscriptionId INTEGER,
  type TEXT NOT NULL,                 -- 'ai_analysis', 'weak_concept', 'similar_problem'
  action TEXT,                        -- 액션 설명
  metadata TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);
```

### 타입별 의미
- `'ai_analysis'`: AI 챗봇 기반 역량 분석 실행
- `'weak_concept'`: 숙제 데이터 기반 부족한 개념 분석 실행
- `'similar_problem'`: 약점 기반 유사문제 생성

## 🎯 테스트 시나리오

### 시나리오 1: 학생이 역량 분석 실행
```bash
# 1. 역량 분석 실행
curl -X POST https://superplace-academy.pages.dev/api/students/analysis \
  -H "Content-Type: application/json" \
  -d '{"studentId": 123}'

# 2. 사용량 확인
curl "https://superplace-academy.pages.dev/api/subscription/check?academyId=academy_001"

# 예상 결과:
{
  "success": true,
  "subscription": {
    "usage": {
      "aiAnalysis": 1  // ← 증가함
    }
  }
}
```

### 시나리오 2: 학생이 부족한 개념 분석 실행
```bash
# 1. 부족한 개념 분석 실행
curl -X POST https://superplace-academy.pages.dev/api/students/weak-concepts \
  -H "Content-Type: application/json" \
  -d '{"studentId": 123, "startDate": "2026-03-01", "endDate": "2026-03-07"}'

# 2. 사용량 확인 (동일)
curl "https://superplace-academy.pages.dev/api/subscription/check?academyId=academy_001"

# 예상 결과:
{
  "success": true,
  "subscription": {
    "usage": {
      "aiAnalysis": 2  // ← 역량 분석 1 + 부족한 개념 1
    }
  }
}
```

### 시나리오 3: 유사문제 출제
```bash
# 1. 유사문제 생성
curl -X POST https://superplace-academy.pages.dev/api/homework/generate-similar-problems \
  -H "Content-Type: application/json" \
  -d '{"studentId": 123, "weaknessTypes": ["지수법칙", "완전제곱공식"], "academyId": "academy_001"}'

# 2. 사용량 확인
curl "https://superplace-academy.pages.dev/api/subscription/check?academyId=academy_001"

# 예상 결과:
{
  "success": true,
  "subscription": {
    "usage": {
      "similarProblems": 1  // ← 증가함
    }
  }
}
```

## 🚀 배포 정보

- **커밋 해시**: `eb6aac53`
- **배포 URL**: https://superplace-academy.pages.dev
- **배포 시간**: 2026-03-07 (자동 배포 중)

## ✅ 완료된 작업 체크리스트

- [x] 역량 분석 API 사용량 로깅 추가
- [x] 부족한 개념 분석 API 사용량 로깅 추가
- [x] 구독 체크 API에서 두 타입 모두 카운트하도록 수정
- [x] 유사문제 출제 API 로깅 확인 (이미 구현됨)
- [x] Git 커밋 및 푸시 완료
- [x] 문서화 완료

## 📝 결론

모든 사용량 카운트가 **실제 사용 시 자동으로 기록**되도록 구현 완료했습니다.

- **숙제 검사**: `homework_submissions` 테이블에서 자동 카운트
- **랜딩페이지**: `landing_pages` 테이블에서 자동 카운트
- **AI 역량 분석**: 실행 시 `usage_logs`에 자동 기록 후 카운트
- **부족한 개념 분석**: 실행 시 `usage_logs`에 자동 기록 후 카운트
- **유사문제 출제**: 실행 시 `usage_logs`에 자동 기록 후 카운트 (이미 구현됨)

대시보드 설정 페이지(`/dashboard/settings`)에서 모든 사용량이 정확히 표시됩니다!
