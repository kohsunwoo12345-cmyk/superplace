# 🎨 랜딩페이지 템플릿 설치 가이드

## 📋 현재 상황
- 템플릿 관리 기능은 완성되어 있음
- SQL 파일에 5개의 기본 템플릿이 준비되어 있음
- **문제**: D1 데이터베이스에 템플릿이 실제로 삽입되지 않음

## ✅ 해결 방법

### 1️⃣ 템플릿 자동 설치 API 실행

다음 명령어로 템플릿을 데이터베이스에 삽입:

```bash
curl -X POST https://superplacestudy.pages.dev/api/setup/templates \
  -H "Content-Type: application/json" \
  -d '{"password":"setup-templates-2026"}'
```

또는 브라우저 콘솔에서:

```javascript
fetch('/api/setup/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'setup-templates-2026' })
})
.then(r => r.json())
.then(console.log);
```

### 2️⃣ 예상 응답

**성공 시:**
```json
{
  "success": true,
  "message": "템플릿 5개 삽입 완료",
  "inserted": 5,
  "total": 5
}
```

**이미 존재할 경우:**
```json
{
  "success": true,
  "message": "템플릿이 이미 5개 존재합니다.",
  "existing": 5
}
```

## 📚 설치되는 템플릿 목록

### 1. 🌟 학생 성장 리포트 (기본)
- **ID**: `tpl_student_report_001`
- **용도**: 학생의 학습 성과와 성장을 보여주는 프리미엄 템플릿
- **변수**: studentName, period, attendanceRate, homeworkRate, avgScore, teacherComment, academyName, generatedDate

### 2. 🎓 모던 학원 소개
- **ID**: `tpl_academy_intro_001`
- **용도**: 세련되고 전문적인 학원 소개 페이지
- **변수**: academyName, tagline, feature1, feature2, feature3

### 3. 🎉 이벤트 & 세미나
- **ID**: `tpl_event_001`
- **용도**: 특별 이벤트와 세미나 안내 페이지
- **변수**: eventTitle, eventDate, eventTime, description, benefit1, benefit2, benefit3

### 4. 🚀 무료 체험 신청
- **ID**: `tpl_free_trial_001`
- **용도**: 무료 체험 수업 신청을 위한 전환 최적화 페이지
- **변수**: subtitle, benefit1, benefit2, benefit3

### 5. 👥 학부모 커뮤니티
- **ID**: `tpl_community_001`
- **용도**: 학부모 소통과 참여를 위한 커뮤니티 페이지
- **변수**: communityName, tagline, introText, feature1, feature2, feature3, feature4

## 🔍 확인 방법

### 템플릿 페이지 접속
```
https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates
```

### API로 직접 확인
```bash
# 토큰 필요
curl https://superplacestudy.pages.dev/api/landing/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🛠️ 문제 해결

### 템플릿이 여전히 안 보이는 경우

1. **캐시 클리어**
   - 하드 리프레시: `Ctrl + Shift + R` (Windows/Linux) 또는 `Cmd + Shift + R` (Mac)

2. **로그아웃 후 재로그인**
   - 토큰이 갱신되어야 할 수 있음

3. **DB 확인** (Cloudflare D1 Console)
   ```sql
   SELECT id, name, description, isDefault, usageCount 
   FROM LandingPageTemplate 
   ORDER BY isDefault DESC, createdAt ASC;
   ```

4. **API 로그 확인**
   - Cloudflare Dashboard → Pages → superplacestudy → Functions → View logs
   - 검색 키워드: "Template setup", "LandingPageTemplate"

## 🔐 보안 참고사항

현재 설치 API 비밀번호: `setup-templates-2026`

**권장사항**: 템플릿 설치 후 다음 중 하나를 선택:
1. API 파일 삭제: `functions/api/setup/templates.ts`
2. 비밀번호 변경

## 📝 추가 템플릿 생성

템플릿 페이지에서 직접 생성 가능:
1. `/dashboard/admin/landing-pages/templates` 접속
2. "새 템플릿 추가" 버튼 클릭
3. HTML 코드 작성 (변수: `{{variableName}}` 형식)
4. 저장

## 🎯 다음 단계

템플릿 설치 후:
1. `/dashboard/admin/landing-pages` - 랜딩페이지 생성
2. 템플릿 선택 → 변수 값 입력 → 미리보기 → 배포
3. 고유 URL 생성되어 외부 공유 가능

---

**API 엔드포인트**: `/api/setup/templates`  
**파일 위치**: `functions/api/setup/templates.ts`  
**SQL 참조**: `insert_templates.sql`
