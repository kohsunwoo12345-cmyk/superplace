# 🔴 사용량 한도 표시 문제 - 최종 실행 보고서

**작성일:** 2026-03-07  
**최종 커밋:** `5658e3b5`  
**상태:** ⚠️ Cloudflare Functions 미작동 (빌드 설정 문제)

---

## 📊 실행 결과

### ✅ 완료된 작업

1. **D1 데이터베이스 테이블 생성** 
   - `homework_submissions` 테이블 생성 및 인덱스
   - `landing_pages` 테이블 생성 및 인덱스
   - `usage_logs` 테이블 생성 및 인덱스
   - 테스트 데이터 추가

2. **Next.js 설정 변경**
   - `output: 'export'` 제거 (커밋 `5d7d3b0b`)
   - `@cloudflare/next-on-pages` 빌드로 전환 (커밋 `c3e0577c`)
   - `wrangler.toml` 출력 디렉토리 수정 (커밋 `5658e3b5`)

3. **코드 변경**
   - Functions API 다수 추가 (`/api/subscription/*`)
   - 테이블 초기화 API 작성
   - 디버그 API 작성

### ❌ 여전히 해결되지 않은 문제

**Cloudflare Functions가 배포되지 않음**
```bash
$ curl https://superplace-academy.pages.dev/test
404 Not Found
```

**원인:**
- Cloudflare Pages의 빌드 명령어가 올바르지 않음
- 또는 Functions 디렉토리가 빌드 출력에 포함되지 않음

---

## 🔧 Cloudflare Dashboard 설정 확인 필요

### 📍 확인할 위치
```
Cloudflare Dashboard
→ Workers & Pages
→ superplace-academy (또는 프로젝트명)
→ Settings
→ Builds & deployments
```

### ✅ 올바른 설정

| 항목 | 값 |
|------|-----|
| **Build command** | `npx @cloudflare/next-on-pages` |
| **Build output directory** | `.vercel/output/static` |
| **Root directory** | `/` (비어 있거나 루트) |
| **Node version** | 18.x 이상 |

---

## 📋 현재 문제 요약

### 근본 원인
Cloudflare Pages가 여전히 정적 파일만 배포하고 **Functions 디렉토리를 무시**하고 있음.

### 증상
- `/test` API → 404
- `/api/subscription/check` → 404  
- 설정 페이지에서 사용량 한도 모두 0으로 표시

### 해결 필요 사항
**Cloudflare Pages 빌드 설정을 수동으로 변경**해야 함:
1. Dashboard에서 Build command를 `npx @cloudflare/next-on-pages`로 설정
2. Build output directory를 `.vercel/output/static`으로 설정
3. 재배포

---

## 🎯 즉시 해결 방법 (임시)

Cloudflare Functions가 작동할 때까지 **D1 Console에서 직접 데이터 조회**:

### 1. 현재 데이터 확인
```sql
-- 숙제 검사 수
SELECT COUNT(*) as homework_count FROM homework_submissions WHERE submittedAt IS NOT NULL;

-- 랜딩페이지 수  
SELECT COUNT(*) as landing_count FROM landing_pages;

-- AI 분석 수
SELECT COUNT(*) as ai_count FROM usage_logs WHERE type = 'ai_analysis';

-- 유사문제 수
SELECT COUNT(*) as similar_count FROM usage_logs WHERE type = 'similar_problem';
```

### 2. 실제 사용 데이터 추가

사용자의 실제 academyId를 알고 있다면:

```sql
-- academyId가 '1'인 학원의 테스트 데이터
-- (실제 academyId로 변경 필요)

INSERT INTO homework_submissions (id, userId, submittedAt, gradedAt, score, feedback, subject, createdAt)
SELECT 
  'hw_' || u.id || '_' || datetime('now'), 
  u.id,
  datetime('now'),
  datetime('now'),
  85,
  '좋아요!',
  '수학',
  datetime('now')
FROM User u
WHERE u.academyId = '1' AND u.role = 'STUDENT'
LIMIT 5;

INSERT INTO landing_pages (id, academyId, title, status, createdAt)
VALUES 
  ('lp_' || hex(randomblob(8)), '1', '학원 홍보 페이지', 'published', datetime('now')),
  ('lp_' || hex(randomblob(8)), '1', '수강 신청 페이지', 'published', datetime('now'));

INSERT INTO usage_logs (id, userId, subscriptionId, type, createdAt)
SELECT 
  'log_' || u.id || '_' || hex(randomblob(4)),
  u.id,
  1,
  'ai_analysis',
  datetime('now')
FROM User u  
WHERE u.academyId = '1' AND u.role = 'STUDENT'
LIMIT 3;
```

---

## 📝 다음 단계

### A. Cloudflare Pages 설정 변경 (권장)

1. **Cloudflare Dashboard 접속**
   - https://dash.cloudflare.com
   - Workers & Pages → superplace-academy

2. **Settings → Builds & deployments**
   - Build command: `npx @cloudflare/next-on-pages`
   - Build output: `.vercel/output/static`
   - 저장

3. **수동 재배포**
   - Deployments 탭
   - "Retry deployment" 클릭

4. **5-10분 후 확인**
   ```bash
   curl https://superplace-academy.pages.dev/test
   # 예상: {"success":true,"message":"API is working!"}
   ```

### B. 또는 Vercel 배포 (대안)

Cloudflare Pages 대신 Vercel에 배포:

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
cd /home/user/webapp
vercel --prod
```

Vercel은 Next.js를 네이티브 지원하므로 Functions가 즉시 작동합니다.

---

## ✅ 최종 확인 사항

- [ ] D1 Console에서 SQL 실행 완료 (테이블 생성)
- [ ] 테스트 데이터 추가 완료
- [ ] Cloudflare Pages 빌드 설정 확인
- [ ] Build command: `npx @cloudflare/next-on-pages`
- [ ] Build output: `.vercel/output/static`
- [ ] 재배포 실행
- [ ] `/test` API 응답 확인 (200 OK)
- [ ] `/api/subscription/check` API 응답 확인
- [ ] 설정 페이지에서 사용량 한도 표시 확인

---

## 🔍 트러블슈팅

### 여전히 404가 나오면?

1. **Cloudflare Pages 빌드 로그 확인**
   - Deployments → 최신 배포 클릭
   - Build log 확인
   - "Functions" 관련 로그 찾기

2. **로컬에서 테스트**
   ```bash
   cd /home/user/webapp
   npm run preview
   # http://localhost:8788 에서 확인
   ```

3. **Functions 디렉토리 확인**
   ```bash
   ls -la .vercel/output/static/_worker.js
   # 파일이 있어야 함
   ```

---

**작성자:** Claude  
**최종 업데이트:** 2026-03-07 (커밋 5658e3b5)
