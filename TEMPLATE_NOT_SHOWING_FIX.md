# 🚨 템플릿이 안 보이는 문제 - 완전 해결 가이드

## 📋 현재 상황

**문제:**
- SQL 실행했음
- https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates 에서 템플릿이 안 보임
- 랜딩페이지 생성 시에도 템플릿 선택 불가

**목표:**
- 템플릿 목록에서 "학생 성장 리포트 v1.0" 표시
- 랜딩페이지 생성 시 템플릿 선택 가능

---

## ✅ 1단계: 배포 완료 확인 (5~10분 대기)

**최신 커밋:** `7d1cc50` - 템플릿 API 로깅 강화

**Cloudflare Pages 배포 확인:**
```
https://dash.cloudflare.com
→ Workers & Pages
→ superplacestudy 선택
→ Latest Deployment 상태 확인
```

**배포 완료 기준:**
- Status: ✅ Success
- 시간: 커밋 후 5~10분 경과

---

## ✅ 2단계: Cloudflare D1에서 템플릿 확인

### D1 Console 접속
```
https://dash.cloudflare.com
→ Workers & Pages
→ D1
→ 해당 데이터베이스 선택
→ Console 탭
```

### 확인 쿼리 실행

**쿼리 1: 템플릿 존재 확인**
```sql
SELECT id, name, description, isDefault, usageCount, createdAt 
FROM LandingPageTemplate;
```

**기대 결과:**
```
id: template_growth_report_v1
name: 학생 성장 리포트 v1.0
description: 상세한 성장 일기 형식의...
isDefault: 1
usageCount: 0
createdAt: 2024-02-18...
```

**쿼리 2: 템플릿 개수 확인**
```sql
SELECT COUNT(*) as total FROM LandingPageTemplate;
```

**기대 결과:** `total: 1` (또는 그 이상)

---

## ✅ 3단계: 웹 브라우저에서 디버깅

### 템플릿 페이지 접속
```
URL: https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates
```

### 브라우저 개발자 도구 열기
```
F12 키 또는
우클릭 → 검사(Inspect)
→ Console 탭 선택
```

### 로그 확인 (중요!)

**정상 로그:**
```javascript
📋 Token exists: true
📋 Templates API Response: {success: true, templates: [...], total: 1}
📋 Response status: 200 true
📋 Templates count: 1
✅ Templates loaded successfully: [{id: "template_growth_report_v1", ...}]
```

**문제 로그 - 401 Unauthorized:**
```javascript
❌ 템플릿 목록 조회 실패: {success: false, error: "Unauthorized"}
```
**해결:** 로그아웃 후 재로그인

**문제 로그 - 빈 배열:**
```javascript
📋 Templates count: 0
ℹ️ API Message: "LandingPageTemplate 테이블이 아직 생성되지 않았습니다."
```
**해결:** 1단계 SQL (테이블 생성) 다시 실행

**문제 로그 - 500 에러:**
```javascript
❌ 템플릿 목록 조회 실패: {success: false, error: "..."}
```
**해결:** 디버깅 SQL 실행 (DEBUG_TEMPLATE_CHECK.sql)

---

## ✅ 4단계: 랜딩페이지 생성 페이지 확인

### 랜딩페이지 생성 페이지 접속
```
URL: https://superplacestudy.pages.dev/dashboard/admin/landing-pages/create
```

### Console 로그 확인

**정상 로그:**
```javascript
📋 Templates API Response: {success: true, templates: [...], total: 1}
📋 Templates count: 1
✅ Default template selected: {id: "template_growth_report_v1", name: "학생 성장 리포트 v1.0", ...}
```

**UI 확인:**
- "6️⃣ HTML 템플릿 선택" 섹션
- "학생 성장 리포트 v1.0" 카드 표시
- "기본 템플릿" 뱃지
- 자동 선택 (보라색 테두리)

---

## 🛠️ 문제별 해결 방법

### 문제 1: 테이블이 없다
**증상:**
```
Templates count: 0
Message: "LandingPageTemplate 테이블이 아직 생성되지 않았습니다."
```

**해결:**
```sql
-- Cloudflare D1 Console에서 실행
CREATE TABLE IF NOT EXISTS LandingPageTemplate (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  html TEXT NOT NULL,
  variables TEXT,
  isDefault INTEGER DEFAULT 0,
  usageCount INTEGER DEFAULT 0,
  createdById TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_landing_template_creator 
ON LandingPageTemplate(createdById);

CREATE INDEX IF NOT EXISTS idx_landing_template_default 
ON LandingPageTemplate(isDefault);
```

---

### 문제 2: 템플릿이 없다
**증상:**
```
Templates count: 0
(테이블은 있지만 데이터 없음)
```

**해결 방법 A: 웹 UI에서 직접 생성 (가장 간단)**

1. https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates 접속
2. "✨ 새 템플릿 만들기" 버튼 클릭
3. 다음 정보 입력:

```
템플릿 이름: 학생 성장 리포트 v1.0

설명: 상세한 성장 일기 형식의 학생 학습 리포트. 출석, AI 학습, 숙제 현황을 아름다운 디자인으로 표현합니다.

HTML 코드: (STUDENT_GROWTH_REPORT_TEMPLATE.html 내용 복사)
```

4. "생성하기" 버튼 클릭

**해결 방법 B: SQL INSERT 실행**

`INSERT_STUDENT_GROWTH_REPORT_TEMPLATE.sql` 파일 전체를 D1 Console에 붙여넣기

**주의:** 파일이 매우 크므로 (660줄) 복사할 때 끊기지 않도록 주의!

---

### 문제 3: FOREIGN KEY 에러
**증상:**
```
FOREIGN KEY constraint failed
```

**원인:** User 테이블에 id='1'인 사용자 없음

**해결:**
```sql
-- User 확인
SELECT id, email, name FROM User WHERE id = '1';

-- 없으면 추가
INSERT OR IGNORE INTO User (id, email, name, role, password, createdAt, updatedAt)
VALUES ('1', 'admin@superplace.com', 'Admin User', 'SUPER_ADMIN', 'hashed_password', datetime('now'), datetime('now'));

-- 다시 템플릿 INSERT 실행
```

---

### 문제 4: 401 Unauthorized
**증상:**
```
Console: ❌ 템플릿 목록 조회 실패: {success: false, error: "Unauthorized"}
```

**원인:** 토큰 만료 또는 없음

**해결:**
```
1. localStorage.clear() (Console에서 실행)
2. 로그아웃
3. 재로그인 (admin@superplace.com / admin1234)
4. 페이지 새로고침
```

---

### 문제 5: 캐시 문제
**증상:**
- SQL에서는 템플릿이 있음
- 웹에서는 안 보임

**해결:**
```
1. Ctrl + Shift + Del (캐시 삭제)
2. "캐시된 이미지 및 파일" 체크
3. "전체 기간" 선택
4. "데이터 삭제" 버튼
5. 브라우저 재시작
6. 로그인 후 다시 확인
```

---

## 🔍 완전 디버깅 체크리스트

### ✅ 체크 1: 배포 완료
- [ ] Cloudflare Pages 배포 상태: Success
- [ ] 최신 커밋: 7d1cc50
- [ ] 배포 시간: 5~10분 경과

### ✅ 체크 2: 데이터베이스
- [ ] LandingPageTemplate 테이블 존재
- [ ] 템플릿 데이터 1개 이상
- [ ] User 테이블에 id='1' 존재

### ✅ 체크 3: API
- [ ] /api/landing/templates 응답 200
- [ ] success: true
- [ ] templates: [...] (배열에 데이터 있음)
- [ ] total: 1 이상

### ✅ 체크 4: 웹 UI
- [ ] 템플릿 페이지에서 템플릿 표시
- [ ] 생성 페이지에서 템플릿 선택 가능
- [ ] 기본 템플릿 자동 선택

### ✅ 체크 5: 브라우저
- [ ] Console에 에러 없음
- [ ] 토큰 유효
- [ ] 캐시 삭제 완료

---

## 📊 실전 테스트 시나리오

### 시나리오 1: 완전 초기 설정

**단계:**
```
1. D1 Console → CREATE TABLE 실행
2. D1 Console → INSERT 실행 (방법 A 또는 B)
3. 5~10분 대기 (배포 완료)
4. 브라우저에서 로그인
5. 템플릿 페이지 확인
6. F12 → Console 로그 확인
```

**예상 시간:** 15분

---

### 시나리오 2: 템플릿만 없는 경우

**단계:**
```
1. D1 Console → SELECT 쿼리로 확인
2. 웹 UI에서 템플릿 생성 (권장)
   또는 SQL INSERT 실행
3. 브라우저 새로고침 (Ctrl+F5)
4. 템플릿 확인
```

**예상 시간:** 3분

---

### 시나리오 3: 캐시 문제

**단계:**
```
1. SQL에서 템플릿 존재 확인 ✅
2. 웹에서 안 보임 ❌
3. Ctrl+Shift+Del → 캐시 삭제
4. 로그아웃 → 재로그인
5. 하드 리프레시 (Ctrl+Shift+R)
6. 템플릿 확인
```

**예상 시간:** 2분

---

## 💡 빠른 확인 스크립트 (Console)

**브라우저 Console에서 실행:**

```javascript
// 토큰 확인
const token = localStorage.getItem('token');
console.log('Token:', token ? '✅ Exists' : '❌ Missing');

// Templates API 직접 호출
fetch('/api/landing/templates', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  console.log('📋 Templates:', data);
  console.log('Count:', data.templates?.length || 0);
  if (data.templates && data.templates.length > 0) {
    console.log('✅ Template found:', data.templates[0].name);
  } else {
    console.log('❌ No templates');
  }
})
.catch(err => console.error('❌ Error:', err));
```

---

## 🎯 최종 확인

**모든 것이 정상이라면:**

1. **템플릿 페이지:**
   ```
   https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates
   ```
   - "학생 성장 리포트 v1.0" 카드 표시
   - "기본 템플릿" 뱃지
   - 사용 횟수: 0회

2. **랜딩페이지 생성 페이지:**
   ```
   https://superplacestudy.pages.dev/dashboard/admin/landing-pages/create
   ```
   - "6️⃣ HTML 템플릿 선택" 섹션
   - "학생 성장 리포트 v1.0" 자동 선택 (보라색 테두리)

3. **Console 로그:**
   ```
   📋 Templates API Response: {success: true, ...}
   📋 Templates count: 1
   ✅ Templates loaded successfully
   ```

---

## 🚀 다음 단계

템플릿이 정상적으로 표시되면:

1. **샘플 랜딩페이지 생성**
2. **변수 입력 테스트**
3. **생성된 URL 확인**
4. **디자인 검증**
5. **실제 데이터로 리포트 생성**

---

**작성:** Claude (AI Coding Agent)  
**버전:** v2.0 (디버깅 강화)  
**최종 업데이트:** 2026-02-18  
**커밋:** 7d1cc50
