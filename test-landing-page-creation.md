# 🧪 랜딩페이지 템플릿 테스트 가이드

## 배포 완료된 변경사항
1. **프론트엔드 로깅 추가**: 전송 데이터 확인 (`templateHtmlLength`, `hasTemplateHtml`)
2. **백엔드 로깅 추가**: 수신 데이터 확인 (`templateType`, `templateHtmlLength`)

## 테스트 절차

### 1단계: 로그인
https://superplacestudy.pages.dev/login

### 2단계: 빌더 페이지 접속
https://superplacestudy.pages.dev/dashboard/admin/landing-pages/builder

### 3단계: 페이지 생성 (F12 개발자 도구 열고 Console 탭 확인)
1. **제목**: "TEST 학생 리포트"
2. **템플릿 선택**: "학생 리포트" 클릭
3. **Console 확인**: 다음 로그가 나타나야 합니다:
   ```
   ✅ Student report template loaded, length: [숫자 > 5000]
   ```
4. **저장** 버튼 클릭
5. **Console 확인**: 다음 로그가 나타나야 합니다:
   ```
   📤 Sending to API: {
     templateType: "student_report",
     templateHtmlLength: [숫자 > 5000],
     hasTemplateHtml: true
   }
   ```
6. 성공 메시지의 URL 복사

### 4단계: 생성된 페이지 확인
- URL 접속: `https://superplacestudy.pages.dev/lp/[slug]`
- **기대 결과**: 전체 학생 리포트 템플릿 (스타일, 출석, 과제, AI 튜터 섹션)
- **실패 시**: 기본 HTML만 표시 (제목만 있음)

### 5단계: Cloudflare 로그 확인
1. https://dash.cloudflare.com/ 접속
2. Workers & Pages → superplacestudy → Logs
3. 페이지 생성 시 로그 확인:
   ```
   🔍 API Received Data: {
     templateType: "student_report",
     templateHtmlLength: [숫자],
     hasTemplateHtml: true
   }
   ✅ Using provided template HTML, length: [숫자]
   ✅ Template HTML processed, length: [숫자]
   ```

## 문제 진단

### 경우 1: Console에 "Student report template loaded" 로그가 없음
**문제**: 프론트엔드에서 템플릿 선택이 동작하지 않음
**해결**: 템플릿 버튼을 다시 클릭해보기

### 경우 2: Console에 "templateHtmlLength: 0" 또는 "hasTemplateHtml: false"
**문제**: `data.template_html`이 비어있음
**해결**: 
- 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
- 페이지 새로고침 후 재시도

### 경우 3: API에서 "hasTemplateHtml: false" 로그
**문제**: 프론트엔드에서 백엔드로 전송 실패
**해결**: Network 탭에서 요청 Payload 확인

### 경우 4: 모든 로그 정상인데 기본 HTML만 표시
**문제**: 데이터베이스 저장 또는 렌더링 문제
**해결**: Cloudflare 로그에서 INSERT 성공 여부 확인

## 결과 보고

테스트 후 다음 정보를 제공해주세요:
1. Console에 나타난 로그 (스크린샷 또는 텍스트)
2. 생성된 페이지 URL
3. 페이지가 올바르게 표시되는지 여부
4. Cloudflare Logs (있다면)

