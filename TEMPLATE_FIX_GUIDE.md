# 🛠️ 랜딩페이지 템플릿 FOREIGN KEY 오류 해결 가이드

## 문제 상황
```
D1_ERROR: FOREIGN KEY constraint failed: SQLITE_CONSTRAINT
```
- `LandingPageTemplate` 테이블의 `createdById` 필드가 `NOT NULL` + FOREIGN KEY 제약조건이 있어서 템플릿 삽입 실패

## 해결 방법 (2분 소요)

### 1️⃣ 템플릿 설치 페이지 접속
https://superplacestudy.pages.dev/install-templates.html

### 2️⃣ 비밀번호 입력 (이미 입력되어 있음)
```
setup-templates-2026
```

### 3️⃣ 테이블 재생성 버튼 클릭
**🛠️ 테이블 수정 + 템플릿 설치 (FOREIGN KEY 오류 해결)** 버튼 클릭

### 4️⃣ 확인 팝업에서 "확인" 클릭
- 기존 테이블 삭제
- FOREIGN KEY 없이 새 테이블 생성
- 5개 템플릿 자동 삽입

### 5️⃣ 성공 메시지 확인
```
✅ 템플릿 5개 삽입 완료
✅ 총 5개 템플릿 설치 완료!
지금 바로 템플릿을 사용할 수 있습니다.
```

### 6️⃣ 템플릿 확인
https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates

## 설치되는 템플릿 목록

1. **🌟 학생 성장 리포트** (기본)
   - 변수: studentName, period, attendanceRate, homeworkRate, avgScore, teacherComment, academyName, generatedDate
   
2. **🎓 모던 학원 소개**
   - 변수: academyName, tagline, feature1, feature2, feature3
   
3. **🎉 이벤트 & 세미나**
   - 변수: eventTitle, eventDate, eventTime, description, benefit1, benefit2, benefit3
   
4. **🚀 무료 체험 신청**
   - 변수: subtitle, benefit1, benefit2, benefit3
   
5. **👥 학부모 커뮤니티**
   - 변수: communityName, tagline, introText, feature1, feature2, feature3, feature4

## 기술적 세부사항

### 변경된 테이블 스키마
```sql
CREATE TABLE LandingPageTemplate (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  html TEXT NOT NULL,
  variables TEXT,
  isDefault INTEGER DEFAULT 0,
  usageCount INTEGER DEFAULT 0,
  createdById TEXT,                    -- ✅ NOT NULL 제거, FOREIGN KEY 없음
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 변경 사항
- ❌ 이전: `createdById TEXT NOT NULL` + FOREIGN KEY 제약조건
- ✅ 현재: `createdById TEXT` (NULL 허용, FOREIGN KEY 없음)

## API 엔드포인트

### POST /api/setup/templates
```json
{
  "password": "setup-templates-2026",
  "forceRecreate": true
}
```

**forceRecreate: true**
- 기존 `LandingPageTemplate` 테이블 삭제
- FOREIGN KEY 제약조건 없이 새 테이블 생성
- 5개 기본 템플릿 자동 삽입

## 배포 상태
- Commit: `126d727`
- 배포 완료 예상: 2-3분 후
- 라이브 URL: https://superplacestudy.pages.dev

## 다음 단계

1. ✅ 템플릿 설치 완료 확인
2. ✅ 템플릿 관리 페이지에서 5개 템플릿 확인
3. ✅ 랜딩페이지 생성 테스트
4. ✅ 생성된 랜딩페이지 URL 확인

## 문제 해결

### 여전히 오류가 발생하는 경우
1. Hard refresh (Ctrl+Shift+R 또는 Cmd+Shift+R)
2. 2-3분 후 다시 시도 (Cloudflare Pages 배포 대기)
3. 브라우저 캐시 삭제 후 재시도

### 추가 지원 필요 시
- 에러 메시지 전체 복사
- 스크린샷 첨부
- 템플릿 관리 페이지 URL 공유
