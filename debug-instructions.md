# 🔍 랜딩페이지 템플릿 적용 문제 디버깅 가이드

## ✅ 현재 확인된 정상 동작
1. **샘플 페이지 정상**: https://superplacestudy.pages.dev/lp/sample-1772387033711
   - 템플릿 HTML 완벽하게 적용됨
   - 스타일, 데이터 모두 표시

2. **코드 정상**:
   - 프론트엔드: `templateHtml` 필드로 전송 ✅
   - 백엔드 API: `html_content` 컬럼에 저장 ✅
   - 렌더링 함수: `html_content` 조회 후 반환 ✅

## ❓ 확인 필요 사항

### 1️⃣ 문제 페이지 URL 제공
**대시보드에서 생성한 페이지** 중 템플릿이 적용되지 않은 실제 URL을 알려주세요.

예시:
- https://superplacestudy.pages.dev/lp/[실제-slug]

### 2️⃣ 생성 시 템플릿 선택 확인
빌더 페이지에서 다음을 확인했는지 알려주세요:
- [ ] 템플릿 타입으로 **"학생 리포트"** 선택했는가?
- [ ] 제목을 입력했는가?
- [ ] "저장" 버튼을 클릭했는가?
- [ ] 성공 메시지와 URL이 표시되었는가?

### 3️⃣ 브라우저 콘솔 오류
생성 후 다음을 확인해주세요:
1. https://superplacestudy.pages.dev/dashboard/admin/landing-pages/builder 접속
2. F12 (개발자 도구) 열기
3. "학생 리포트" 템플릿 선택
4. Console 탭에 다음 로그가 나오는지 확인:
   ```
   ✅ Student report template loaded, length: [숫자]
   ```
5. "저장" 버튼 클릭 후 Network 탭에서 `/api/admin/landing-pages` 요청의 Response 확인

### 4️⃣ 목록에서 페이지 상태 확인
https://superplacestudy.pages.dev/dashboard/admin/landing-pages 접속 후:
- [ ] 생성한 페이지가 목록에 표시되는가?
- [ ] 표시된다면, 해당 페이지의 슬러그(slug)가 무엇인가?

## 🛠️ 즉시 테스트 방법

### A. 새 페이지 생성 테스트
1. https://superplacestudy.pages.dev/login 로그인
2. https://superplacestudy.pages.dev/dashboard/admin/landing-pages/builder 접속
3. 다음 입력:
   - **제목**: "테스트 학생 리포트"
   - **템플릿 타입**: "학생 리포트" 선택
4. "저장" 버튼 클릭
5. 성공 메시지에서 URL 복사
6. 해당 URL 접속하여 템플릿 확인

### B. Cloudflare 로그 확인
1. https://dash.cloudflare.com/ 접속
2. Workers & Pages → superplacestudy → Logs
3. 페이지 생성 시 로그에서 다음 확인:
   ```
   ✅ Template HTML processed, length: [숫자]
   ✅ 구 스키마 INSERT 성공
   ```

## 📞 다음 단계
위 정보를 제공해주시면:
1. 정확한 문제 원인 파악
2. 해당 페이지의 DB 상태 확인
3. 필요시 데이터 복구 또는 수정

