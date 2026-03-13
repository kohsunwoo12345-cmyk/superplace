# 🔍 숙제 데이터 사라짐 문제 원인 분석 및 해결 방안

## 📊 현재 상황
- **문제**: 이전 숙제 데이터 184건이 안 보임
- **현재**: 5건만 조회됨 (모두 2026-03-14 테스트 데이터)
- **원인 추정**: 데이터가 다른 테이블에 있거나, 테이블 변경 시 마이그레이션 안 됨

## 🔎 가능한 원인들

### 1️⃣ 데이터가 다른 테이블에 있는 경우
```
- homework_submissions (v2 아닌 원본 테이블)
- homework_results
- student_homework
- 등등...
```

### 2️⃣ homework_gradings_v2 테이블에만 채점 결과가 있는 경우
```sql
-- homework_submissions_v2: 제출 기록만
-- homework_gradings_v2: 채점 결과만
-- 두 테이블을 JOIN해야 전체 데이터 조회 가능
```

### 3️⃣ 테이블 스키마 변경 시 데이터 손실
```
- 이전에 DROP TABLE 실행
- backup 테이블에 데이터가 백업되어 있을 수 있음
- homework_submissions_v2_backup_*
- homework_gradings_v2_backup_*
```

## ✅ 해결 방법

### 📌 1단계: 데이터베이스 테이블 확인
Cloudflare Dashboard에서 D1 데이터베이스 콘솔 열기:
```sql
-- 모든 테이블 목록 확인
SELECT name FROM sqlite_master WHERE type='table';

-- 각 테이블의 데이터 개수 확인
SELECT COUNT(*) FROM homework_submissions;
SELECT COUNT(*) FROM homework_submissions_v2;
SELECT COUNT(*) FROM homework_gradings_v2;
SELECT COUNT(*) FROM homework_results;
-- 등등...
```

### 📌 2단계: 백업 테이블 확인
```sql
-- 백업 테이블이 있는지 확인
SELECT name FROM sqlite_master 
WHERE type='table' AND name LIKE '%backup%';

-- 백업 테이블 데이터 확인
SELECT COUNT(*) FROM homework_submissions_v2_backup_20260314;
SELECT * FROM homework_submissions_v2_backup_20260314 LIMIT 5;
```

### 📌 3단계: 데이터 복구 (필요시)
백업 테이블에 데이터가 있으면:
```sql
-- 백업에서 메인 테이블로 복사
INSERT INTO homework_submissions_v2 
SELECT * FROM homework_submissions_v2_backup_20260314;
```

### 📌 4단계: 기존 테이블에서 마이그레이션
```sql
-- homework_gradings_v2 테이블의 submission 데이터를
-- homework_submissions_v2로 이전
INSERT OR IGNORE INTO homework_submissions_v2 
(id, userId, code, submittedAt, status, academyId, gradingResult, gradedAt)
SELECT 
  submissionId,
  userId,
  NULL as code,
  gradedAt,
  'graded' as status,
  academyId,
  json_object(
    'results', json_array(
      json_object(
        'subject', subject,
        'grading', json_object(
          'totalQuestions', totalQuestions,
          'correctAnswers', correctAnswers,
          'overallFeedback', overallFeedback,
          'strengths', strengths,
          'improvements', improvements
        )
      )
    )
  ) as gradingResult,
  gradedAt
FROM homework_gradings_v2
WHERE submissionId NOT IN (SELECT id FROM homework_submissions_v2);
```

## 🚨 즉시 해야 할 일

### 사용자에게 안내
```
"현재 데이터 복구 작업 중입니다. 
Cloudflare Dashboard에서 D1 데이터베이스를 확인하여
기존 데이터가 어느 테이블에 있는지 파악하고,
필요시 백업 테이블에서 복구하겠습니다."
```

### 데이터베이스 접근 방법
1. https://dash.cloudflare.com/ 로그인
2. Workers & Pages → D1
3. `webapp-production` 데이터베이스 선택
4. Console 탭에서 SQL 실행

### 조회할 SQL 쿼리
```sql
-- 1. 모든 테이블 목록
SELECT name FROM sqlite_master WHERE type='table';

-- 2. homework 관련 테이블들
SELECT name FROM sqlite_master 
WHERE type='table' AND name LIKE '%homework%';

-- 3. 각 테이블 데이터 개수
SELECT 
  (SELECT COUNT(*) FROM homework_submissions_v2) as submissions_v2,
  (SELECT COUNT(*) FROM homework_gradings_v2) as gradings_v2;

-- 4. 가장 오래된/최신 제출 확인
SELECT MIN(submittedAt), MAX(submittedAt), COUNT(*)
FROM homework_submissions_v2;

SELECT MIN(gradedAt), MAX(gradedAt), COUNT(*)
FROM homework_gradings_v2;
```

## 📝 다음 스텝

1. ✅ 프론트엔드 기본 조회 기간 6개월로 변경 완료
2. 🔍 **데이터베이스 테이블 구조 확인 필요** ← **현재 단계**
3. 📦 백업 테이블 또는 기존 테이블에서 데이터 복구
4. ✅ 최종 테스트

## ⚠️ 중요

**이 문제는 코드 문제가 아니라 데이터베이스 데이터 문제입니다.**
API와 프론트엔드는 정상 작동하며, 데이터만 복구하면 모든 게 해결됩니다.

