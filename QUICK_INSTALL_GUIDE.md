# 🚀 학생 성장 리포트 템플릿 - 빠른 설치 가이드

## 📋 개요

**목적:** 학생 성장 리포트 템플릿을 데이터베이스에 추가하여 즉시 사용 가능하게 합니다.

**소요 시간:** 약 2분

---

## ✅ 1단계: 테이블 생성 (최초 1회만)

### Cloudflare D1 Console 접속
```
Cloudflare Dashboard 
→ Workers & Pages 
→ D1 
→ 해당 데이터베이스 선택 
→ Console 탭
```

### SQL 실행
**파일:** `CREATE_LANDING_PAGE_TEMPLATE_TABLE.sql` 내용 복사 후 실행

```sql
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

**확인:**
```sql
SELECT name FROM sqlite_master 
WHERE type='table' AND name='LandingPageTemplate';
```

결과에 `LandingPageTemplate`이 나오면 성공! ✅

---

## ✅ 2단계: 템플릿 데이터 삽입

### SQL 실행
**파일:** `INSERT_STUDENT_GROWTH_REPORT_TEMPLATE.sql` 내용 **전체** 복사 후 실행

**주의사항:**
- ⚠️ **전체 내용**을 복사해야 합니다 (660줄)
- ⚠️ Cloudflare D1 Console은 긴 쿼리를 지원합니다
- ⚠️ 복사할 때 따옴표가 제대로 복사되었는지 확인

### 복사 방법

**Windows:**
```bash
# Git Bash 또는 WSL에서
cat INSERT_STUDENT_GROWTH_REPORT_TEMPLATE.sql | clip
```

**Mac:**
```bash
# 터미널에서
cat INSERT_STUDENT_GROWTH_REPORT_TEMPLATE.sql | pbcopy
```

**Linux:**
```bash
# 터미널에서
cat INSERT_STUDENT_GROWTH_REPORT_TEMPLATE.sql | xclip -selection clipboard
```

**직접 복사:**
1. `INSERT_STUDENT_GROWTH_REPORT_TEMPLATE.sql` 파일 열기
2. Ctrl+A (전체 선택)
3. Ctrl+C (복사)
4. Cloudflare D1 Console에 붙여넣기
5. Run 버튼 클릭

**확인:**
```sql
SELECT id, name, description, isDefault, usageCount, createdAt 
FROM LandingPageTemplate 
WHERE name = '학생 성장 리포트 v1.0';
```

결과 예시:
```
id: template_growth_report_v1
name: 학생 성장 리포트 v1.0
description: 상세한 성장 일기 형식의...
isDefault: 1
usageCount: 0
createdAt: 2024-02-18 ...
```

---

## ✅ 3단계: 웹 페이지에서 확인

### 로그인
```
URL: https://superplacestudy.pages.dev/login
계정: admin@superplace.com
비밀번호: admin1234
```

### 템플릿 확인
```
URL: https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates
```

**기대 결과:**
- ✅ "학생 성장 리포트 v1.0" 템플릿 표시
- ✅ 설명: "상세한 성장 일기 형식의..."
- ✅ 기본 템플릿 뱃지
- ✅ 사용 횟수: 0회

---

## ✅ 4단계: 샘플 랜딩페이지 생성

### 랜딩페이지 생성 페이지 이동
```
메뉴: 랜딩페이지 관리 > 새 랜딩페이지 만들기
또는
URL: https://superplacestudy.pages.dev/dashboard/admin/landing-pages/create
```

### 템플릿 선택
```
템플릿: 학생 성장 리포트 v1.0 (드롭다운에서 선택)
```

### 샘플 데이터 입력

**기본 정보:**
```
학생 이름: 김민준
학습 기간: 2024년 1월 1일 ~ 1월 31일
학원 이름: 슈퍼플레이스 학원
발급일: 2024년 2월 1일
```

**출석 현황:**
```
전체 수업일: 20일
출석 일수: 19일
결석 일수: 1일
지각 일수: 0일
출석률: 95%
```

**AI 학습 활동:**
```
AI 대화 횟수: 45회
평균 대화 길이: 15개 메시지
주요 질문 주제: 수학 문제 풀이
평균 응답 시간: 2분 30초
```

**숙제 제출 현황:**
```
완료한 숙제: 18개
완료율: 90%
평균 점수: 88점
최고 점수: 100점
평균 제출 시간: 마감 1일 전
```

**성장 스토리:**
```
가장 인상 깊었던 순간: 어려운 수학 문제를 스스로 해결하며 자신감을 얻은 순간, AI 챗봇과 적극적으로 대화하며 궁금증을 해결하는 모습이 인상적이었습니다.

개선이 필요한 부분: 가끔 숙제 제출 기한을 놓치는 경우가 있어요. 시간 관리 능력을 키우면 더욱 좋을 것 같습니다.

다음 목표: 다음 달에는 숙제 완료율 100%를 목표로 하고, AI 챗봇과의 대화 횟수를 50회 이상으로 늘려보세요!
```

**선생님 평가:**
```
선생님 이름: 김선생님

선생님 코멘트: 민준이는 항상 밝은 미소로 수업에 참여하며, 모르는 것이 있으면 주저하지 않고 질문합니다. 특히 수학 문제를 풀 때 끈기 있게 도전하는 모습이 정말 인상적입니다. 앞으로도 이런 학습 태도를 유지한다면 큰 발전이 기대됩니다.
```

### 생성 버튼 클릭
```
버튼: "생성하기" 또는 "Create Landing Page"
```

**기대 결과:**
```
✅ 성공 메시지: "랜딩페이지가 생성되었습니다."
✅ 고유 URL 발급: https://superplacestudy.pages.dev/landing/xxxxx
```

---

## ✅ 5단계: 결과 확인

### 생성된 랜딩페이지 열기
```
발급된 URL 클릭 또는 복사하여 새 탭에서 열기
```

**확인 항목:**
- ✅ 보라색 그라데이션 헤더
- ✅ 학생 이름 표시
- ✅ 출석 현황 통계 카드 3개
- ✅ 프로그레스 바 애니메이션
- ✅ AI 학습 활동 섹션
- ✅ 숙제 제출 현황 섹션
- ✅ 학습 성장 일기
- ✅ 선생님 종합 평가
- ✅ 마무리 메시지

### 모바일 테스트
```
1. 크롬 개발자 도구 (F12)
2. 디바이스 툴바 (Ctrl+Shift+M)
3. iPhone/iPad/Galaxy 등 선택
4. 반응형 디자인 확인
```

---

## 🔧 트러블슈팅

### 문제 1: 테이블이 없다고 나옴
**증상:**
```
no such table: LandingPageTemplate
```

**해결:**
```
1. 1단계 SQL (테이블 생성) 실행
2. 확인 쿼리로 테이블 존재 검증
3. 2단계 다시 실행
```

### 문제 2: FOREIGN KEY 에러
**증상:**
```
FOREIGN KEY constraint failed
```

**원인:** User 테이블에 id='1'인 사용자 없음

**해결:**
```sql
-- User 확인
SELECT id, email FROM User WHERE id = '1';

-- 없으면 생성 (임시)
INSERT INTO User (id, email, name, role, password, createdAt, updatedAt)
VALUES ('1', 'admin@superplace.com', 'Admin', 'SUPER_ADMIN', 'temp', datetime('now'), datetime('now'));
```

### 문제 3: 템플릿이 목록에 안 보임
**증상:**
- 웹 페이지에서 "템플릿이 없습니다" 메시지

**해결:**
```
1. D1 Console에서 확인 쿼리 실행
2. 브라우저 캐시 삭제 (Ctrl+Shift+Del)
3. 로그아웃 후 재로그인
4. 페이지 새로고침 (Ctrl+F5)
```

### 문제 4: SQL이 너무 길다고 나옴
**증상:**
- Cloudflare Console에서 "Query too long" 에러

**해결 방법 1 (권장):**
```
Cloudflare Wrangler CLI 사용:
1. npm install -g wrangler
2. wrangler login
3. wrangler d1 execute [DB_NAME] --file=INSERT_STUDENT_GROWTH_REPORT_TEMPLATE.sql
```

**해결 방법 2:**
```
API를 통해 직접 생성:
1. 로그인 (admin@superplace.com)
2. 템플릿 관리 > 새 템플릿 만들기
3. STUDENT_GROWTH_REPORT_TEMPLATE.html 내용 복사
4. 이름: 학생 성장 리포트 v1.0
5. 설명: 상세한 성장 일기...
6. "생성하기" 클릭
```

---

## 📊 성공 체크리스트

- [ ] 1단계: LandingPageTemplate 테이블 생성 완료
- [ ] 2단계: 템플릿 데이터 INSERT 완료
- [ ] 3단계: 웹에서 템플릿 목록에서 확인
- [ ] 4단계: 샘플 랜딩페이지 생성 성공
- [ ] 5단계: 생성된 페이지 정상 표시 확인

**모두 체크되었다면:** 🎉 **성공적으로 설치 완료!**

---

## 🎯 다음 단계

### 실제 데이터로 리포트 생성
```
1. 학생 데이터 준비 (출석, AI 활동, 숙제 등)
2. 데이터를 변수에 매핑
3. 랜딩페이지 생성
4. URL을 학부모님께 전송 (이메일/SMS)
```

### 자동화 설정
```
1. 월말 자동 데이터 집계 (cron)
2. 리포트 자동 생성
3. 이메일/SMS 자동 발송
```

### 템플릿 커스터마이징
```
1. 색상 변경 (브랜드 컬러)
2. 섹션 추가/삭제
3. 변수 추가 (새로운 데이터)
```

---

## 📚 관련 문서

- `STUDENT_GROWTH_REPORT_TEMPLATE.html` - HTML 템플릿
- `STUDENT_GROWTH_REPORT_TEMPLATE_GUIDE.md` - 상세 가이드
- `CREATE_LANDING_PAGE_TEMPLATE_TABLE.sql` - 테이블 생성 SQL
- `INSERT_STUDENT_GROWTH_REPORT_TEMPLATE.sql` - 템플릿 INSERT SQL

---

## 💡 팁

### 빠른 테스트
```
샘플 데이터를 미리 준비해두면 빠르게 테스트 가능:
→ JSON 파일로 저장
→ 필요할 때 복사+붙여넣기
```

### 데이터 수집 자동화
```
학생 활동 데이터를 실시간으로 집계하여
월말에 자동으로 리포트 생성
```

### 다양한 템플릿
```
이 템플릿을 복사하여
- 주간 리포트
- 학기별 리포트
- 학부모 상담용 리포트
등 다양한 버전 제작 가능
```

---

**제작:** Claude (AI Coding Agent)  
**작성일:** 2026-02-18  
**버전:** v1.0  
**상태:** ✅ 설치 준비 완료
