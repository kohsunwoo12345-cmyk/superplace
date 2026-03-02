# 🔍 브라우저 디버깅 가이드 - 학생 리포트 템플릿 문제 해결

## 📅 작성일: 2026-03-02

## 🎯 목적
대시보드에서 "학생 리포트" 템플릿을 선택하여 랜딩페이지를 생성할 때, 템플릿이 제대로 적용되지 않는 문제를 진단하기 위한 가이드입니다.

---

## ✅ 확인된 사실
1. **백엔드 API는 정상 작동**: 샘플 API로 생성한 페이지는 템플릿이 완벽하게 적용됨
   - 예시: https://superplacestudy.pages.dev/lp/sample-1772433928323
   
2. **템플릿 파일 존재 확인**: `/src/templates/student-growth-report.ts` (16KB)

3. **번들링 확인**: 로컬 빌드 시 템플릿이 JS 번들에 정상 포함됨

4. **프론트엔드 코드 확인**: 
   - `handleTemplateTypeChange`: 템플릿 버튼 클릭 시 `template_html`에 템플릿 주입
   - `handleSave`: 저장 시 `template_html`이 비어있으면 자동 복원
   - `useEffect`: 페이지 로드 시 `template_type === "student_report"`이면 자동 복원

---

## 🔧 추가된 디버깅 로그 (커밋 d207de1)

### 1. 템플릿 클릭 시
```javascript
handleTemplateTypeChange(templateType: string) {
  console.log("🔄 Template type changing to:", templateType);
  console.log("✅ Student report template loaded, length:", STUDENT_GROWTH_REPORT_TEMPLATE.length);
  console.log("✅ updatedData.template_html.length:", updatedData.template_html.length);
  console.log("📝 setData 호출 전 - updatedData.template_type:", updatedData.template_type);
  console.log("📝 setData 호출 전 - updatedData.template_html.length:", updatedData.template_html.length);
  setData(updatedData);
  
  setTimeout(() => {
    console.log("✅ setData 호출 후 - data.template_type:", data.template_type);
    console.log("✅ setData 호출 후 - data.template_html.length:", data.template_html.length);
  }, 100);
}
```

### 2. 저장 버튼 클릭 시
```javascript
handleSave() {
  console.log("💾 handleSave 시작");
  console.log("   data.template_type:", data.template_type);
  console.log("   data.template_html.length:", data.template_html?.length || 0);
  console.log("   data.template_html empty?:", !data.template_html);
  
  if (data.template_type === "student_report" && !finalTemplateHtml) {
    console.warn("⚠️ template_html이 비어있습니다! 자동 복원 중...");
    finalTemplateHtml = STUDENT_GROWTH_REPORT_TEMPLATE;
    console.log("✅ Template HTML auto-restored before save, length:", finalTemplateHtml.length);
  }
}
```

---

## 📋 테스트 절차

### 1단계: 로그인
```
https://superplacestudy.pages.dev/login
```

### 2단계: 빌더 페이지 접속
```
https://superplacestudy.pages.dev/dashboard/admin/landing-pages/builder
```

### 3단계: 개발자 도구 열기
- **Windows/Linux**: `F12` 또는 `Ctrl + Shift + I`
- **Mac**: `Cmd + Option + I`
- **Console 탭 선택**

### 4단계: 페이지 생성 테스트

#### A. 제목 입력
```
제목: 테스트 - 김철수 학생의 학습 리포트
```

#### B. "학생 리포트" 템플릿 버튼 클릭
- **기대되는 Console 로그**:
```
🔄 Template type changing to: student_report
✅ Student report template loaded, length: 16651
✅ updatedData.template_html.length: 16651
📝 setData 호출 전 - updatedData.template_type: student_report
📝 setData 호출 전 - updatedData.template_html.length: 16651
(100ms 후)
✅ setData 호출 후 - data.template_type: student_report
✅ setData 호출 후 - data.template_html.length: 16651
```

#### C. 저장 버튼 클릭
- **기대되는 Console 로그**:
```
💾 handleSave 시작
   data.template_type: student_report
   data.template_html.length: 16651
   data.template_html empty?: false
✅ template_html이 이미 존재합니다, length: 16651
📤 Sending to API: {
  slug: "lp_...",
  title: "테스트 - 김철수 학생의 학습 리포트",
  templateType: "student_report",
  templateHtmlLength: 16651,
  hasTemplateHtml: true
}
```

#### D. 생성된 페이지 확인
- Alert에 표시된 URL로 이동
- **기대 결과**: 전체 학생 리포트 템플릿 표시 (출석 현황, 과제 완수율, AI 튜터 등)

---

## 🚨 문제 진단 시나리오

### 시나리오 1: 템플릿 클릭 시 로그가 안 나옴
**원인**: JS 번들에 템플릿이 포함되지 않음
**해결**: 
1. 페이지 새로고침 (`Ctrl+F5` 강력 새로고침)
2. 브라우저 캐시 삭제
3. Cloudflare Pages 재배포 확인

### 시나리오 2: 템플릿 클릭 로그는 나오지만 `setData 호출 후` 로그에서 length가 0
**원인**: React 상태 업데이트 타이밍 문제
**해결**: 이미 `handleSave`에 자동 복원 로직이 있으므로 정상 작동해야 함

### 시나리오 3: 저장 시 `template_html empty?: true`
**원인**: 상태가 초기화됨
**해결**: 
- F12 Console에서 수동 확인:
```javascript
// Application > Local Storage > https://superplacestudy.pages.dev 확인
localStorage.getItem('landing_page_draft')
```

### 시나리오 4: API 요청에서 `templateHtmlLength: 0`
**원인**: `finalTemplateHtml`이 제대로 설정되지 않음
**로그 확인**: `⚠️ template_html이 비어있습니다! 자동 복원 중...` 메시지가 나와야 함

### 시나리오 5: API는 정상이지만 생성된 페이지가 기본 HTML
**원인**: 백엔드 저장 로직 문제
**확인**: Cloudflare 로그에서 `✅ Template HTML processed, length:` 확인

---

## 📊 보고해야 할 정보

테스트 후 다음 정보를 제공해 주세요:

### 1. Console 로그 전체 복사
```
(F12 Console에서 전체 텍스트 복사)
```

### 2. Network 탭 확인
- `/api/admin/landing-pages` 요청 클릭
- **Request Payload** 복사:
```json
{
  "slug": "...",
  "templateType": "...",
  "templateHtml": "..."
}
```

### 3. 생성된 페이지 URL
```
https://superplacestudy.pages.dev/lp/...
```

### 4. 페이지에 표시된 내용
- ✅ 전체 템플릿 표시됨
- ❌ 기본 HTML만 표시됨 (제목 + 빈 body)

---

## 🔗 참고 링크

### 정상 작동하는 샘플 페이지
```
https://superplacestudy.pages.dev/lp/sample-1772433928323
```

### 샘플 API 직접 호출
```bash
curl -X POST https://superplacestudy.pages.dev/api/test/create-sample-landing-page
```

### GitHub 커밋 히스토리
- 디버깅 로그 추가: `d207de1`
- 템플릿 복원 로직: `c5f008d`
- 토큰 인증 수정: `dc866f0`

---

## ⏰ 배포 시간
- 커밋: `d207de1` (2026-03-02 06:56 UTC)
- 예상 배포 완료: **2026-03-02 07:00 UTC** (약 3-5분)

---

## 💡 임시 해결책

### 방법 1: 샘플 API 사용
대시보드 대신 샘플 API로 직접 생성:
```bash
curl -X POST https://superplacestudy.pages.dev/api/test/create-sample-landing-page
```

### 방법 2: 브라우저 Console에서 수동 생성
```javascript
const token = localStorage.getItem('token');
const response = await fetch('/api/admin/landing-pages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    slug: `lp_manual_${Date.now()}`,
    title: '수동 생성 - 김철수 학생',
    templateType: 'student_report',
    templateHtml: `(전체 템플릿 HTML을 여기에 복사)`
  })
});
const result = await response.json();
console.log(result);
```

---

## ✅ 최종 체크리스트

- [ ] 배포 완료 확인 (3-5분 대기)
- [ ] 브라우저 강력 새로고침 (`Ctrl+F5`)
- [ ] 로그인
- [ ] 빌더 페이지 접속
- [ ] F12 Console 열기
- [ ] 제목 입력
- [ ] "학생 리포트" 버튼 클릭
- [ ] Console 로그 확인
- [ ] 저장 버튼 클릭
- [ ] Console 로그 확인
- [ ] Network 탭에서 API 요청 확인
- [ ] 생성된 페이지 확인
- [ ] 결과 보고

---

**작성자**: AI Assistant  
**최종 업데이트**: 2026-03-02 06:56 UTC  
**커밋**: d207de1
