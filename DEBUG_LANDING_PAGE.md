# 랜딩페이지 빈 페이지 디버깅 가이드

## 🔍 문제 상황
랜딩페이지 생성 후 접속 시 **빈 페이지**가 나타남

## 📊 배포 정보
- 커밋: 69a7d2b1
- 수정 내역:
  1. ✅ 템플릿 HTML 자동 로드 (DB에서 가져오기)
  2. ✅ 디버깅 API 추가
- 배포 예상 완료: 5분 후

## 🧪 테스트 방법

### 1단계: 새 랜딩페이지 생성
```
URL: https://superplace-academy.pages.dev/dashboard/admin/landing-pages/create
```
1. 학생 선택
2. 제목: "디버그 테스트"
3. 기간 선택
4. **생성** 버튼 클릭
5. 알림창의 slug 복사 (예: `lp_1234567890_abc123`)

### 2단계: 디버그 API로 내용 확인
```
https://superplace-academy.pages.dev/api/debug/landing-page-content?slug=여기에_복사한_slug
```

**예시:**
```
https://superplace-academy.pages.dev/api/debug/landing-page-content?slug=lp_1234567890_abc123
```

### 3단계: 응답 확인

#### ✅ 정상인 경우:
```json
{
  "success": true,
  "html": {
    "exists": true,
    "length": 5000,  // 길이가 0이 아님
    "isEmpty": false,
    "hasDoctype": true,
    "hasHtmlTag": true,
    "hasBody": true
  }
}
```
→ HTML이 있으면 렌더링 로직 문제

#### ❌ 문제 1: HTML이 없는 경우
```json
{
  "html": {
    "exists": false,
    "length": 0,
    "isEmpty": true
  }
}
```
→ **템플릿이 저장되지 않음** (템플릿 생성 필요)

#### ❌ 문제 2: 페이지를 찾을 수 없음
```json
{
  "success": false,
  "error": "Landing page not found"
}
```
→ **DB에 저장 안 됨** (생성 로직 실패)

## 🎯 해결 방법

### 문제 1: 템플릿이 없는 경우
```
1. /dashboard/admin/landing-pages/templates 접속
2. "새 템플릿 만들기" 클릭
3. 템플릿 이름: "기본 템플릿"
4. HTML 입력 (샘플 HTML 제공 가능)
5. "기본 템플릿으로 설정" 체크
6. 저장
```

### 문제 2: DB 저장 실패
- Cloudflare Pages 로그 확인
- 브라우저 콘솔 (F12) 확인
- 네트워크 탭에서 POST 요청 응답 확인

## 📋 보고 필요 정보

다음 정보를 알려주세요:

1. **디버그 API 응답** (전체 JSON 복사)
2. **html.length 값**: 0? 또는 숫자?
3. **html.isEmpty**: true? false?
4. **브라우저 콘솔 오류** (F12 → Console)

---

## ⚡ 5분 후 실행

1. 새 랜딩페이지 생성
2. slug 복사
3. 디버그 API 호출: `/api/debug/landing-page-content?slug=복사한_slug`
4. 응답 JSON 전체를 복사해서 보고

이 정보로 정확한 원인을 파악하겠습니다! 🎯
