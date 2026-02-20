# 🎨 랜딩페이지 완전 설정 가이드

## ⚠️ 현재 문제
- "테이블이 없다"는 팝업 문구 발생
- 랜딩페이지 템플릿 사용 불가

## ✅ 완전 해결 방법 (3단계)

### 📍 단계 1: 테이블 생성 + 템플릿 설치 (자동)

**URL 접속:**
```
https://superplacestudy.pages.dev/install-templates.html
```

**실행:**
1. 비밀번호 입력: `setup-templates-2026`
2. **"⚡ 자동 설치 (테이블 + 템플릿)"** 버튼 클릭
3. 완료 메시지 확인

**결과:**
- ✅ `LandingPageTemplate` 테이블 생성
- ✅ `landing_pages` 테이블 확인/생성
- ✅ 5개 기본 템플릿 자동 설치

---

### 📍 단계 2: 템플릿 확인

**URL 접속:**
```
https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates
```

**예상 결과:**
```
✅ 5개 템플릿 표시:
1. 🌟 학생 성장 리포트 (기본)
2. 🎓 모던 학원 소개
3. 🎉 이벤트 & 세미나
4. 🚀 무료 체험 신청
5. 👥 학부모 커뮤니티
```

---

### 📍 단계 3: 랜딩페이지 생성 테스트

**방법 A: 테스트 페이지 사용 (추천)**

**URL 접속:**
```
https://superplacestudy.pages.dev/test-landing-create.html
```

**실행:**
1. "자동으로 가져오기" 버튼 클릭 (토큰 자동 로드)
2. 학생 정보 입력 (또는 기본값 사용)
3. "랜딩페이지 만들기" 버튼 클릭
4. 생성된 URL 클릭하여 확인

**예시 생성 결과:**
```
✅ 랜딩페이지 생성 완료!

📋 정보:
- ID: lp_xxxxx
- Slug: test-1708434567890
- 제목: 김철수 학생 리포트

🔗 URL:
https://superplacestudy.pages.dev/lp/test-1708434567890
```

---

**방법 B: 대시보드에서 생성**

**URL 접속:**
```
https://superplacestudy.pages.dev/dashboard/admin/landing-pages
```

**실행:**
1. "새 랜딩페이지 만들기" 버튼 클릭
2. 템플릿 선택
3. 변수 값 입력
4. 미리보기 → 저장
5. 생성된 URL 확인

---

## 🔍 설치 확인 체크리스트

### ✅ 1단계 확인
```bash
# Cloudflare D1 Console에서 실행:
SELECT name FROM sqlite_master WHERE type='table' AND name='LandingPageTemplate';
# 결과: LandingPageTemplate 행이 나와야 함
```

### ✅ 2단계 확인
```bash
# Cloudflare D1 Console에서 실행:
SELECT COUNT(*) as count FROM LandingPageTemplate;
# 결과: count = 5 이상
```

### ✅ 3단계 확인
```bash
# Cloudflare D1 Console에서 실행:
SELECT COUNT(*) as count FROM landing_pages;
# 결과: count = 생성한 랜딩페이지 개수
```

---

## 📚 API 엔드포인트 정리

### 설치 관련
| 엔드포인트 | 메소드 | 용도 |
|-----------|--------|------|
| `/api/setup/create-tables` | POST | 테이블 생성 |
| `/api/setup/templates` | POST | 템플릿 설치 |

### 템플릿 관리
| 엔드포인트 | 메소드 | 용도 |
|-----------|--------|------|
| `/api/landing/templates` | GET | 템플릿 목록 |
| `/api/landing/templates` | POST | 템플릿 생성 |
| `/api/landing/templates` | PUT | 템플릿 수정 |
| `/api/landing/templates?id=xxx` | DELETE | 템플릿 삭제 |

### 랜딩페이지 관리
| 엔드포인트 | 메소드 | 용도 |
|-----------|--------|------|
| `/api/admin/landing-pages` | GET | 랜딩페이지 목록 |
| `/api/admin/landing-pages` | POST | 랜딩페이지 생성 |
| `/api/admin/landing-pages` | PUT | 랜딩페이지 수정 |
| `/api/admin/landing-pages?id=xxx` | DELETE | 랜딩페이지 삭제 |

---

## 🎯 실제 사용 예시

### 예시 1: 학생 성장 리포트 생성

```javascript
// 1. 로그인
const token = localStorage.getItem('token');

// 2. 랜딩페이지 생성
const response = await fetch('/api/admin/landing-pages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    slug: 'student-kim-2024-1',
    title: '김철수 학생 리포트',
    subtitle: '2024년 1학기 학습 성과',
    templateId: 'tpl_student_report_001',
    templateType: 'template',
    inputData: {
      studentName: '김철수',
      period: '2024년 1학기',
      attendanceRate: '95',
      homeworkRate: '88',
      avgScore: '92',
      teacherComment: '성실한 태도로...',
      academyName: '슈퍼플레이스 학원',
      generatedDate: '2024년 2월 20일'
    },
    showQrCode: true,
    isActive: true
  })
});

const data = await response.json();
console.log('생성된 URL:', `/lp/${data.slug}`);
```

### 예시 2: 템플릿 변수 확인

```javascript
// 템플릿 정보 조회
const response = await fetch('/api/landing/templates', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();
const template = data.templates.find(t => t.id === 'tpl_student_report_001');

console.log('필요한 변수:', template.variables);
// ["studentName", "period", "attendanceRate", ...]
```

---

## 🐛 문제 해결

### 문제 1: "테이블이 없습니다" 오류
**원인**: `LandingPageTemplate` 테이블 미생성

**해결**:
```
https://superplacestudy.pages.dev/install-templates.html
→ "⚡ 자동 설치" 버튼 클릭
```

### 문제 2: 템플릿 목록이 비어있음
**원인**: 템플릿 데이터 미삽입

**해결**:
```
https://superplacestudy.pages.dev/install-templates.html
→ "2단계: 템플릿 설치하기" 버튼 클릭
```

### 문제 3: 랜딩페이지 생성 실패
**원인**: 권한 없음 또는 필수 필드 누락

**확인사항**:
1. 로그인 상태 확인
2. 토큰 유효성 확인 (`localStorage.getItem('token')`)
3. 필수 필드 확인 (slug, title, templateId)

### 문제 4: 생성된 랜딩페이지 접속 안됨
**원인**: slug가 잘못되었거나 isActive=false

**확인**:
```sql
SELECT id, slug, title, isActive FROM landing_pages ORDER BY createdAt DESC LIMIT 10;
```

---

## 📦 배포 정보

- **Commit**: `3d0f07f`
- **Push**: ✅ 완료
- **Cloudflare Pages**: 자동 배포 중 (약 2-3분)
- **Live URL**: https://superplacestudy.pages.dev/

---

## 🔗 유용한 링크

| 이름 | URL |
|------|-----|
| 템플릿 설치 | https://superplacestudy.pages.dev/install-templates.html |
| 랜딩페이지 테스트 생성 | https://superplacestudy.pages.dev/test-landing-create.html |
| 템플릿 관리 | https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates |
| 랜딩페이지 관리 | https://superplacestudy.pages.dev/dashboard/admin/landing-pages |

---

## ✅ 최종 체크리스트

- [ ] 1. 템플릿 자동 설치 완료 (`/install-templates.html`)
- [ ] 2. 템플릿 5개 확인 (`/dashboard/admin/landing-pages/templates`)
- [ ] 3. 테스트 랜딩페이지 생성 (`/test-landing-create.html`)
- [ ] 4. 생성된 랜딩페이지 URL 접속 확인 (`/lp/xxx`)
- [ ] 5. 실제 학생 데이터로 랜딩페이지 생성 테스트

---

**모든 단계 완료 후 결과물:**
✅ 테이블 생성
✅ 템플릿 5개 설치
✅ 랜딩페이지 생성 가능
✅ 고유 URL로 외부 공유 가능

**문의사항이 있으면 생성된 랜딩페이지 URL을 공유해주세요!**
