# 🎓 학생 다중 반 소속 및 학원장 제한 로직 구현 보고서

## 📋 구현 개요

학생의 기본 정보 수정 기능을 확장하고, 학원장별로 기능 사용 제한을 설정할 수 있는 시스템을 구현했습니다.

---

## ✅ 완료된 작업

### 1. 학생 편집 기능 확장

#### 📝 편집 가능 필드
- **이름**: 텍스트 입력
- **전화번호**: 전화번호 형식 (010-1234-5678)
- **이메일**: 이메일 형식
- **소속 학교**: 텍스트 입력
- **학년**: 드롭다운 (초1~고3)
- **소속 학원**: 드롭다운 선택 ✨ **NEW**
- **비밀번호**: 텍스트 입력 (빈 칸으로 두면 변경 안 함) ✨ **NEW**
- **소속 반**: 다중 선택 (최대 3개) ✨ **NEW**
- **진단 메모**: 텍스트 에리어

#### 🎯 다중 반 소속 기능
- 학생은 최대 **3개의 반**에 동시 소속 가능
- 드롭다운으로 반 추가, X 버튼으로 제거
- Badge 형태로 소속 반 표시
- 학원 변경 시 반 선택 자동 초기화

#### 📁 파일 수정
- `src/app/dashboard/students/detail/page.tsx` (UI 및 로직)
- `functions/api/admin/users/[id].ts` (PUT 메소드 추가)

---

### 2. 데이터베이스 스키마 추가

#### 📊 StudentClasses 테이블 (학생-반 다대다 관계)
```sql
CREATE TABLE IF NOT EXISTS student_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  academy_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, class_id)
);
```

#### 🔒 DirectorLimitations 테이블 (학원장별 제한)
```sql
CREATE TABLE IF NOT EXISTS director_limitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  director_id INTEGER NOT NULL UNIQUE,
  academy_id INTEGER NOT NULL,
  
  -- 숙제 채점 제한
  homework_grading_daily_limit INTEGER DEFAULT 0,
  homework_grading_monthly_limit INTEGER DEFAULT 0,
  homework_grading_daily_used INTEGER DEFAULT 0,
  homework_grading_monthly_used INTEGER DEFAULT 0,
  homework_grading_daily_reset_date TEXT,
  homework_grading_monthly_reset_date TEXT,
  
  -- 학생 수 제한
  max_students INTEGER DEFAULT 0,
  
  -- 유사문제 출제 기능
  similar_problem_enabled INTEGER DEFAULT 0,
  similar_problem_daily_limit INTEGER DEFAULT 0,
  similar_problem_monthly_limit INTEGER DEFAULT 0,
  similar_problem_daily_used INTEGER DEFAULT 0,
  similar_problem_monthly_used INTEGER DEFAULT 0,
  
  -- 부족한 개념 분석 기능
  weak_concept_analysis_enabled INTEGER DEFAULT 1,
  weak_concept_daily_limit INTEGER DEFAULT 0,
  weak_concept_monthly_limit INTEGER DEFAULT 0,
  weak_concept_daily_used INTEGER DEFAULT 0,
  weak_concept_monthly_used INTEGER DEFAULT 0,
  
  -- AI 기반 역량 분석 기능
  competency_analysis_enabled INTEGER DEFAULT 1,
  competency_daily_limit INTEGER DEFAULT 0,
  competency_monthly_limit INTEGER DEFAULT 0,
  competency_daily_used INTEGER DEFAULT 0,
  competency_monthly_used INTEGER DEFAULT 0,
  
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

### 3. 학원장 제한 API 구현

#### 📡 API 엔드포인트
**파일**: `functions/api/admin/director-limitations.ts`

##### GET: 제한 정보 조회
```
GET /api/admin/director-limitations?directorId=123
GET /api/admin/director-limitations?academyId=456
```

##### POST: 제한 정보 생성/업데이트
```
POST /api/admin/director-limitations
{
  "director_id": 123,
  "academy_id": 456,
  "similar_problem_enabled": 1,
  "similar_problem_daily_limit": 10,
  "max_students": 50,
  ...
}
```

---

### 4. 제한 체크 유틸리티 함수

**파일**: `functions/lib/director-limits.ts`

#### 🔧 제공 함수
- `getDirectorLimitation()` - 학원장 제한 정보 조회
- `checkSimilarProblemLimit()` - 유사문제 출제 제한 체크
- `checkWeakConceptLimit()` - 부족한 개념 분석 제한 체크
- `checkCompetencyAnalysisLimit()` - AI 역량 분석 제한 체크
- `checkMaxStudentsLimit()` - 학생 수 제한 체크
- `incrementLimitUsage()` - 제한 사용량 증가

#### 💡 사용 예시
```typescript
// 유사문제 출제 전 제한 체크
const check = await checkSimilarProblemLimit(db, directorId);
if (!check.allowed) {
  return new Response(JSON.stringify({ error: check.message }), { status: 403 });
}

// 기능 사용 후 사용량 증가
await incrementLimitUsage(db, directorId, 'similar_problem');
```

---

### 5. 관리자 제한 설정 UI

**파일**: `src/app/dashboard/admin/director-limitations/page.tsx`

#### 🎨 UI 구성
- **학원 선택**: 드롭다운으로 학원 선택
- **탭 구성**:
  1. **기능 활성화**: 각 기능의 ON/OFF 토글
  2. **일일 제한**: 일일 사용 횟수 제한 설정
  3. **월간 제한**: 월간 사용 횟수 제한 설정
  4. **학생 수 제한**: 최대 학생 수 설정

#### 📊 제한 가능한 기능
1. **유사문제 출제** (기본: OFF)
   - 활성화/비활성화
   - 일일/월간 사용 제한
   - 현재 사용량 표시

2. **부족한 개념 분석** (기본: ON)
   - 활성화/비활성화
   - 일일/월간 사용 제한
   - 현재 사용량 표시

3. **AI 역량 분석** (기본: ON)
   - 활성화/비활성화
   - 일일/월간 사용 제한
   - 현재 사용량 표시

4. **숙제 채점**
   - 일일/월간 사용 제한
   - 현재 사용량 표시

5. **학생 수**
   - 최대 학생 수 설정 (0 = 무제한)

---

## 🔄 제한 로직 동작 방식

### 1. 제한 체크 프로세스
```
기능 요청
  ↓
학원장 ID 조회
  ↓
제한 정보 조회 (director_limitations 테이블)
  ↓
일일/월간 초기화 확인 (날짜 기준)
  ↓
기능 활성화 체크 (enabled = 1?)
  ↓
일일 제한 체크 (daily_used < daily_limit?)
  ↓
월간 제한 체크 (monthly_used < monthly_limit?)
  ↓
✅ 허용 or ❌ 거부
  ↓
(허용 시) 사용량 증가 (daily_used++, monthly_used++)
```

### 2. 자동 초기화
- **일일 초기화**: 매일 00:00 기준으로 daily_used → 0
- **월간 초기화**: 매월 1일 00:00 기준으로 monthly_used → 0
- 초기화는 제한 체크 시 자동으로 수행

### 3. 제한 없음 표시
- `limit = 0`: 무제한
- `enabled = 0`: 기능 비활성화

---

## 📦 배포 정보

### 🔗 GitHub
- **Repository**: https://github.com/kohsunwoo12345-cmyk/superplace
- **Branch**: main
- **Commits**:
  - `2863fae` - 학생 다중 반 소속 및 제한 로직
  - `2bfbc78` - 관리자 제한 설정 UI

### 🌐 라이브 사이트
- **URL**: https://superplacestudy.pages.dev
- **배포 상태**: ✅ 완료

---

## 🧪 테스트 방법

### 1. 학생 편집 테스트
1. 학생 상세 페이지 접속: `https://superplacestudy.pages.dev/dashboard/students/detail?id=1`
2. "기본 정보" 탭에서 **[수정]** 버튼 클릭
3. 소속 학원 변경 시 반 목록 자동 업데이트 확인
4. "반 추가하기" 드롭다운으로 최대 3개 반 선택
5. 비밀번호 입력 (빈 칸으로 두면 변경 안 함)
6. **[저장]** 클릭 → 성공 메시지 확인

### 2. 관리자 제한 설정 테스트
1. 관리자 대시보드 접속
2. "학원장 기능 제한 설정" 메뉴 선택: `https://superplacestudy.pages.dev/dashboard/admin/director-limitations`
3. 학원 선택
4. "기능 활성화" 탭에서 유사문제 출제 기능 **활성화**
5. "일일 제한" 탭에서 유사문제 출제 일일 제한 **5회** 설정
6. "학생 수 제한" 탭에서 최대 학생 수 **50명** 설정
7. **[저장]** 클릭 → 성공 메시지 확인

### 3. 제한 적용 테스트
1. 학생 상세 페이지에서 **"유사문제 출제"** 버튼 클릭
2. 5회 초과 시도 시 에러 메시지 확인:
   ```
   "일일 유사문제 출제 횟수를 초과했습니다. (5회 제한)"
   ```

---

## ⚠️ 주의사항

### 1. 데이터베이스 마이그레이션
- 새로운 테이블 `student_classes`, `director_limitations` 생성
- 기존 데이터와의 호환성 유지
- API에서 테이블이 없으면 자동 생성

### 2. 제한 적용 범위
- **유사문제 출제**: 기본 비활성화 (관리자가 활성화 필요)
- **개념 분석**: 기본 활성화
- **역량 분석**: 기본 활성화
- **학생 수 제한**: 신규 학생 등록 시에만 적용 (기존 학생 영향 없음)

### 3. 제한 체크 누락
- 현재는 API만 구현되어 있음
- 각 기능(유사문제, 개념 분석, 역량 분석)에서 제한 체크 로직을 **직접 호출**해야 함
- 제한 체크 미적용 시 제한이 작동하지 않음

---

## 🚀 다음 단계 (추가 구현 필요)

### 1. 제한 체크 통합
각 기능 API에 제한 체크 로직 추가:

#### 유사문제 출제 API
```typescript
// functions/api/students/similar-problems.ts
import { checkSimilarProblemLimit, incrementLimitUsage } from '@/lib/director-limits';

export const onRequestPost = async (context) => {
  // ... 학원장 ID 조회 로직
  
  // 제한 체크
  const check = await checkSimilarProblemLimit(DB, directorId);
  if (!check.allowed) {
    return new Response(JSON.stringify({ error: check.message }), { status: 403 });
  }
  
  // 유사문제 출제 로직
  // ...
  
  // 사용량 증가
  await incrementLimitUsage(DB, directorId, 'similar_problem');
};
```

#### 부족한 개념 분석 API
```typescript
// functions/api/students/weak-concepts.ts
import { checkWeakConceptLimit, incrementLimitUsage } from '@/lib/director-limits';

export const onRequestPost = async (context) => {
  // 제한 체크
  const check = await checkWeakConceptLimit(DB, directorId);
  if (!check.allowed) {
    return new Response(JSON.stringify({ error: check.message }), { status: 403 });
  }
  
  // 분석 로직
  // ...
  
  // 사용량 증가
  await incrementLimitUsage(DB, directorId, 'weak_concept');
};
```

#### AI 역량 분석 API
```typescript
// functions/api/students/competency-analysis.ts
import { checkCompetencyAnalysisLimit, incrementLimitUsage } from '@/lib/director-limits';

export const onRequestPost = async (context) => {
  // 제한 체크
  const check = await checkCompetencyAnalysisLimit(DB, directorId);
  if (!check.allowed) {
    return new Response(JSON.stringify({ error: check.message }), { status: 403 });
  }
  
  // 분석 로직
  // ...
  
  // 사용량 증가
  await incrementLimitUsage(DB, directorId, 'competency');
};
```

### 2. 프론트엔드 UI 개선
- 제한 상태 표시 (남은 횟수 등)
- 제한 도달 시 버튼 비활성화
- 유사문제 출제 기능 숨기기 (비활성화 시)

### 3. 대시보드 메뉴 추가
- 관리자 메뉴에 "학원장 제한 설정" 링크 추가

---

## 📝 요약

### ✅ 구현 완료
- ✅ 학생 다중 반 소속 (최대 3개)
- ✅ 학생 편집: 학원, 비밀번호, 반 선택
- ✅ 데이터베이스 스키마 추가
- ✅ 학원장 제한 API
- ✅ 제한 체크 유틸리티 함수
- ✅ 관리자 제한 설정 UI

### 🔄 다음 작업
- ⏳ 각 기능 API에 제한 체크 통합
- ⏳ 프론트엔드 제한 상태 표시
- ⏳ 유사문제 출제 버튼 조건부 렌더링

---

## 🎉 결론

학생 편집 기능이 크게 확장되었고, 학원장별 기능 제한 시스템의 기반이 완성되었습니다. 이제 각 기능에서 제한 체크 로직만 추가하면 완전한 제한 시스템이 작동합니다!

**배포 완료**: https://superplacestudy.pages.dev 🚀
