# 카카오 채널 연동 테스트 가이드

## 📋 사전 준비

### 1. Solapi 계정 준비
```
1. https://solapi.com 접속
2. 회원가입 (무료)
3. API 키 발급
   - 대시보드 → API Keys → 새 API 키 생성
   - API Key와 API Secret 복사
4. 무료 크레딧 확인 (SMS 발송용)
```

### 2. 카카오 비즈니스 채널 준비
```
1. https://business.kakao.com 접속
2. 카카오톡 채널 개설 (무료)
3. 채널 검색용 ID 확인 (@로 시작)
   예: @superplace
4. 채널 담당자 휴대전화 번호 준비
```

---

## 🧪 테스트 방법

### 방법 1: 웹 UI 테스트 (권장)

**URL**: https://superplacestudy.pages.dev/dashboard/kakao-channel/register

**순서**:
1. 페이지 접속
2. Step 1: 인증번호 요청
   - 채널 검색용 ID 입력 (예: @superplace)
   - 담당자 휴대전화 입력 (예: 01012345678)
   - "인증번호 요청" 버튼 클릭
3. 📱 SMS 수신 대기 (1-2분)
4. Step 2: 인증 및 연동
   - SMS로 받은 6자리 인증번호 입력
   - 채널 카테고리 선택
   - "인증 및 연동 완료" 버튼 클릭
5. ✅ 완료 메시지 확인

**예상 SMS 내용**:
```
[Solapi] 카카오톡 채널 연동
인증번호: 123456
5분 내에 입력하세요.
```

---

### 방법 2: Node.js 스크립트 테스트

**파일**: `test-solapi.js`

**실행**:
```bash
# 환경변수 설정
export SOLAPI_API_KEY="your_api_key_here"
export SOLAPI_API_SECRET="your_api_secret_here"

# 테스트 실행
node test-solapi.js
```

**주석 해제하여 실제 SMS 발송**:
```javascript
// test-solapi.js 파일에서 아래 주석 해제
const result = await messageService.requestKakaoChannelToken({
  searchId: '@your_real_channel',
  phoneNumber: '01012345678'
});
console.log("✅ 인증번호 발송 성공:", result);
```

---

### 방법 3: API 직접 호출 테스트

**1. 카테고리 조회**:
```bash
curl https://superplacestudy.pages.dev/api/kakao/channel-categories
```

**2. 인증번호 요청**:
```bash
curl -X POST https://superplacestudy.pages.dev/api/kakao/request-token \
  -H "Content-Type: application/json" \
  -d '{
    "searchId": "@your_channel",
    "phoneNumber": "01012345678"
  }'
```

**3. 채널 연동**:
```bash
curl -X POST https://superplacestudy.pages.dev/api/kakao/create-channel \
  -H "Content-Type: application/json" \
  -d '{
    "searchId": "@your_channel",
    "phoneNumber": "01012345678",
    "categoryCode": "CATEGORY_001",
    "token": "123456"
  }'
```

---

## 🔧 Cloudflare Pages 환경변수 설정

**위치**: Cloudflare Pages 대시보드 → Settings → Environment variables

**필수 환경변수**:
```
SOLAPI_API_KEY = "your_solapi_api_key"
SOLAPI_API_SECRET = "your_solapi_api_secret"
```

**설정 후**:
1. Cloudflare Pages 자동 재배포 대기
2. 또는 수동 재배포: Deployments → Retry deployment

---

## ✅ 테스트 체크리스트

### 인증번호 발송 테스트
- [ ] 웹 페이지에서 채널 정보 입력
- [ ] "인증번호 요청" 버튼 클릭
- [ ] SMS 수신 확인 (1-2분 이내)
- [ ] 인증번호 6자리 확인

### 채널 연동 테스트
- [ ] 인증번호 입력 (숫자만 6자리)
- [ ] 카테고리 선택
- [ ] "인증 및 연동 완료" 버튼 클릭
- [ ] 성공 메시지 확인
- [ ] DB에 채널 정보 저장 확인

### 에러 케이스 테스트
- [ ] 잘못된 채널 ID 입력 → 에러 메시지
- [ ] 잘못된 전화번호 입력 → 에러 메시지
- [ ] 잘못된 인증번호 입력 → 인증 실패
- [ ] 만료된 인증번호 입력 → 인증 실패

---

## 🐛 문제 해결

### SMS가 오지 않을 때
1. **전화번호 확인**
   - 하이픈 없이 숫자만 입력했는지 확인
   - 010으로 시작하는 유효한 번호인지 확인

2. **카카오 채널 확인**
   - 채널 검색용 ID가 정확한지 확인
   - @를 포함했는지 확인
   - 카카오 비즈니스 센터에서 채널이 활성화되어 있는지 확인

3. **Solapi 크레딧 확인**
   - Solapi 대시보드에서 잔액 확인
   - SMS 발송 가능 크레딧이 있는지 확인

4. **API 키 확인**
   - Cloudflare Pages 환경변수가 올바르게 설정되어 있는지 확인
   - API 키와 Secret이 유효한지 확인

### 인증번호 입력 오류
1. **인증번호 형식**
   - 6자리 숫자만 입력
   - 공백이나 특수문자 제외

2. **유효시간**
   - 인증번호는 5분 후 만료
   - 만료 시 "← 인증번호 재요청" 버튼으로 재발송

3. **인증 실패 시**
   - 인증번호를 정확히 입력했는지 재확인
   - 최신 SMS인지 확인 (이전 인증번호 아님)

### API 오류
```javascript
// 에러 응답 예시
{
  "success": false,
  "error": "SOLAPI API credentials not configured"
}
```

**해결**:
- Cloudflare Pages 환경변수 설정 확인
- 배포 완료 후 재시도

---

## 📊 예상 결과

### 성공 케이스
```json
{
  "success": true,
  "message": "카카오톡 채널이 성공적으로 연동되었습니다!",
  "channel": {
    "pfId": "KA01PF240000000000000000000000000",
    "searchId": "@superplace",
    "status": "active"
  }
}
```

### 실패 케이스
```json
{
  "success": false,
  "error": "Invalid verification code"
}
```

---

## 💡 추가 정보

### SMS 발송 비용
- 1건당 약 15-20원 (Solapi 기준)
- 무료 크레딧으로 테스트 가능

### 인증번호 유효시간
- 일반적으로 5분
- Solapi에서 자동 관리

### 채널 연동 후
- pfId 발급 (카카오 채널 고유 ID)
- DB에 자동 저장
- 알림톡 템플릿 등록 가능
- 알림톡 발송 가능

---

## 📞 지원

문제가 계속되면:
1. Solapi 고객센터: https://solapi.com/support
2. 카카오 비즈니스 센터 고객센터: 1544-4293
3. GitHub Issues: 프로젝트 저장소 이슈 등록
