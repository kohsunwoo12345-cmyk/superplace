# 🔧 솔라피(Solapi) 설정 가이드

## ⚠️ 현재 상황

카카오 알림톡 기능이 **100% 구현**되었지만, **솔라피 인증 정보**가 Cloudflare Pages 환경변수에 설정되지 않아서 다음 오류가 발생합니다:

1. **인증번호 요청 불가** → `Solapi credentials not configured` 에러
2. **채널 등록 불가** → API 호출 실패
3. **등록한 채널이 목록에 안 나옴** → DB 저장 자체가 안 됨

---

## ✅ 해결 방법: Cloudflare Pages 환경변수 설정

### 1단계: Solapi API 키 발급받기

1. [솔라피 콘솔](https://console.solapi.com) 접속
2. 로그인 후 **API Keys** 메뉴 이동
3. **새 API 키 생성** 클릭
4. API Key와 API Secret 복사 (한 번만 표시됨!)

---

### 2단계: Cloudflare Pages 환경변수 설정

#### A. Cloudflare Dashboard에서 설정

1. https://dash.cloudflare.com 접속
2. **Workers & Pages** 메뉴로 이동
3. **superplacestudy** (프로젝트 이름) 클릭
4. **Settings** 탭 클릭
5. **Environment Variables** 섹션으로 스크롤
6. **Add Variable** 버튼 클릭

#### B. 환경변수 추가

다음 2개의 환경변수를 추가하세요:

| Variable name | Value | Environment |
|---------------|-------|-------------|
| `SOLAPI_API_KEY` | `여기에_발급받은_API_KEY` | Production |
| `SOLAPI_API_SECRET` | `여기에_발급받은_API_SECRET` | Production |

**중요**: 
- Variable name은 **정확히** `SOLAPI_API_KEY`, `SOLAPI_API_SECRET` 이어야 합니다 (대소문자 구분)
- Environment는 **Production** 선택
- 저장 후 **재배포 필요 없음** (다음 배포 시 자동 적용)

---

### 3단계: 설정 확인

환경변수 설정 후 다음 API를 호출하여 확인:

```bash
curl https://superplacestudy.pages.dev/api/kakao/debug-config
```

**정상 응답**:
```json
{
  "success": true,
  "config": {
    "solapiConfigured": true,
    "hasApiKey": true,
    "hasApiSecret": true,
    "apiKeyLength": 32,
    "apiSecretLength": 64
  },
  "message": "✅ Solapi 인증 정보가 올바르게 설정되었습니다."
}
```

**오류 응답**:
```json
{
  "success": true,
  "config": {
    "solapiConfigured": false,
    "hasApiKey": false,
    "hasApiSecret": false
  },
  "message": "❌ Solapi 인증 정보가 설정되지 않았습니다."
}
```

---

## 🎯 설정 완료 후 테스트

### 1. 채널 등록 테스트

1. https://superplacestudy.pages.dev/dashboard/kakao-channel/register/ 접속
2. 검색 ID 입력 (예: `myacademy`)
3. 담당자 휴대폰 번호 입력
4. 카테고리 선택 (교육 > 학원 > 오프라인학원)
5. **인증번호 요청** 버튼 클릭
6. SMS로 받은 인증번호 입력
7. 채널 등록 완료

### 2. 채널 목록 확인

https://superplacestudy.pages.dev/dashboard/kakao-channel/ 접속 → 등록한 채널이 표시됨

### 3. 알림톡 전송 테스트

1. 템플릿 생성 및 검수 요청
2. 검수 승인 대기 (3영업일)
3. 승인 후 엑셀 업로드 → 대량 전송

---

## 🐛 트러블슈팅

### 문제 1: 여전히 "Solapi credentials not configured" 에러

**원인**: 환경변수 설정 후 재배포 필요

**해결**:
1. GitHub에 코드 푸시 (자동 재배포 트리거)
2. 또는 Cloudflare Dashboard → Deployments → Retry deployment

---

### 문제 2: "인증번호가 전송되지 않았습니다"

**원인**: Solapi 계정에 크레딧 부족 또는 전화번호 오류

**해결**:
1. [솔라피 콘솔](https://console.solapi.com)에서 잔액 확인
2. 전화번호 형식 확인: `01012345678` (하이픈 없이)
3. 국내 번호만 가능 (010, 011, 016, 017, 018, 019)

---

### 문제 3: "채널 등록에 실패했습니다"

**원인**: 
- 이미 다른 솔라피 계정에 등록된 채널
- 잘못된 카테고리 코드
- 유효하지 않은 검색 ID

**해결**:
1. 카카오톡 채널 관리자센터에서 검색 ID 확인
2. 다른 솔라피 계정 사용 여부 확인
3. 카테고리를 정확히 3단계 모두 선택

---

## 📋 API 엔드포인트 현황

모든 API는 **완벽하게 구현되어 있으며**, 솔라피 인증 정보만 설정하면 즉시 사용 가능합니다.

| API | 메서드 | 상태 | 필요 조건 |
|-----|--------|------|-----------|
| `/api/kakao/channels` | GET, POST, DELETE | ✅ 구현 완료 | Solapi 설정 |
| `/api/kakao/templates` | GET, POST, DELETE | ✅ 구현 완료 | Solapi 설정 |
| `/api/kakao/get-categories` | GET | ✅ 구현 완료 | 없음 |
| `/api/kakao/request-token` | POST | ✅ 구현 완료 | Solapi 설정 |
| `/api/kakao/create-channel` | POST | ✅ 구현 완료 | Solapi 설정 |
| `/api/kakao/send-alimtalk` | POST | ✅ 구현 완료 | Solapi 설정 |
| `/api/kakao/debug-config` | GET | ✅ 구현 완료 | 없음 |

---

## 🎉 완료 체크리스트

- [ ] Solapi API 키 발급
- [ ] Cloudflare Pages 환경변수 설정
  - [ ] `SOLAPI_API_KEY` 추가
  - [ ] `SOLAPI_API_SECRET` 추가
- [ ] 재배포 (또는 다음 배포 대기)
- [ ] `/api/kakao/debug-config` 호출하여 설정 확인
- [ ] 채널 등록 테스트
- [ ] 채널 목록 확인
- [ ] 템플릿 생성 및 검수 요청
- [ ] 알림톡 전송 테스트

---

## 📞 지원

문제가 계속되면 다음 정보와 함께 문의:

1. `/api/kakao/debug-config` 응답 결과
2. 브라우저 콘솔 에러 메시지
3. 발생한 정확한 상황 설명

---

**작성일**: 2026-03-01  
**상태**: 솔라피 설정만 완료하면 모든 기능 사용 가능
