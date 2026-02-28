# 카카오 채널 등록 - 디버깅 가이드

## 🔍 상세 로깅 추가 완료

### 배포 정보
- **커밋**: 5703719
- **URL**: https://superplacestudy.pages.dev/
- **상태**: ✅ 배포 완료
- **배포 시간**: 2026-02-28

## 📋 테스트 및 로그 확인 방법

### 1단계: 브라우저 개발자 도구 열기
1. https://superplacestudy.pages.dev/dashboard/kakao-channel/register/ 접속
2. **F12** 키를 눌러 개발자 도구 열기
3. **Console** 탭 선택

### 2단계: 카테고리 선택
1. Step 1에서 카테고리 선택 (예: 교육 > 학원)
2. Console에서 확인할 로그:
   ```
   ✅ Using hardcoded Solapi categories
   ```

### 3단계: 인증번호 요청 (Step 2)
1. 검색용 ID 입력 (예: testchannel)
2. 휴대전화 번호 입력 (예: 01012345678)
3. "인증번호 요청" 클릭
4. Console에서 확인할 로그:
   ```
   📤 Requesting token (v2 API - no categoryCode needed): {
     searchId: "testchannel",
     phoneNumber: "010****"
   }
   ```

### 4단계: 채널 생성 (Step 3) - 여기서 오류 발생
1. SMS로 받은 인증번호 입력
2. "인증 및 연동 완료" 클릭
3. **확인 다이얼로그 팝업** 확인:
   ```
   전송 정보 확인:
   검색 ID: testchannel
   전화번호: 01012345678
   카테고리: CS02
   인증번호: 123456
   
   계속하시겠습니까?
   ```
4. **"확인" 클릭** 전에 다이얼로그 정보 확인!

5. Console에서 확인할 **중요 로그**:
   ```javascript
   🔍 최종 전송 데이터 (v2): {
     searchId: "testchannel",
     searchIdOriginal: "testchannel",
     phoneNumber: "01012345678",
     categoryCode: "CS02",          // ← 이 값 확인!
     categoryCodeType: "string",    // ← 타입 확인!
     categoryCodeLength: 4,         // ← 길이 확인!
     token: 123456,                 // ← Number인지 확인!
     tokenType: "number",           // ← "number"여야 함!
     tokenOriginal: "123456",
     requestBodyStringified: "..."  // ← 실제 JSON 확인!
   }
   ```

6. 오류 발생 시 Console에서 확인할 로그:
   ```javascript
   ❌ Create channel failed: {
     success: false,
     error: "카테고리 오류: ...",
     details: "...",
     debug: {
       categoryCode: "CS02",
       categoryCodeType: "string",
       ...
     }
   }
   ```

## 🎯 확인해야 할 핵심 사항

### 확인 1: categoryCode 값
**Console 로그에서 확인:**
```javascript
categoryCode: "CS02"  // ← 이 값이 비어있거나 null이 아닌지!
```

**가능한 문제:**
- ❌ `categoryCode: ""` (빈 문자열)
- ❌ `categoryCode: null`
- ❌ `categoryCode: undefined`
- ✅ `categoryCode: "CS02"` (정상)

### 확인 2: categoryCode 타입
**Console 로그에서 확인:**
```javascript
categoryCodeType: "string"  // ← "string"이어야 함!
```

### 확인 3: token 타입
**Console 로그에서 확인:**
```javascript
token: 123456           // ← Number (따옴표 없음)
tokenType: "number"     // ← "number"여야 함!
tokenOriginal: "123456" // ← 원본은 string
```

### 확인 4: requestBodyStringified
**Console 로그에서 확인:**
```javascript
requestBodyStringified: '{"searchId":"testchannel","phoneNumber":"01012345678","categoryCode":"CS02","token":123456}'
```

이 JSON 문자열을 복사해서 확인:
- categoryCode가 포함되어 있는가?
- token이 숫자인가 (따옴표 없음)?

## 🔧 Cloudflare Functions 로그 확인

### Backend 로그 확인 방법
1. Cloudflare Dashboard 접속
2. Workers & Pages → superplacestudy 선택
3. Logs 탭 선택
4. 실시간 로그 확인

**예상 로그:**
```
🔍 Received request body: {
  searchId: "testchannel",
  phoneNumber: "01012345678",
  categoryCode: "CS02",
  token: 123456
}

📤 Solapi API request (v2) - FULL DETAILS: {
  url: "https://api.solapi.com/kakao/v2/channels",
  requestBody: {...},
  categoryCodeValue: "CS02",
  categoryCodeType: "string",
  tokenValue: 123456,
  tokenType: "number"
}
```

**오류 발생 시:**
```
❌ Solapi API error - FULL DETAILS: {
  status: 400,
  errorData: "...",
  requestBody: {
    categoryCode: "CS02",
    categoryCodeType: "string"
  }
}

❌ Parsed error JSON: {
  errorCode: "...",
  errorMessage: "카테고리를 선택해주세요"
}
```

## 📊 문제 진단 체크리스트

### [ ] Step 1: 카테고리 선택 확인
- [ ] "선택된 카테고리: CS02" 메시지가 표시되는가?
- [ ] Step 2로 넘어갈 수 있는가?

### [ ] Step 2: 카테고리 상태 유지 확인
- [ ] Step 2 상단에 "✅ 선택된 카테고리: CS02" 표시되는가?
- [ ] Console에 finalCategoryCode 값이 있는가?

### [ ] Step 3: 전송 데이터 확인
- [ ] 확인 다이얼로그에 카테고리 값이 표시되는가?
- [ ] Console의 categoryCode 값이 비어있지 않은가?
- [ ] Console의 categoryCodeType이 "string"인가?
- [ ] Console의 token이 Number 타입인가?

### [ ] Backend: API 수신 확인
- [ ] Cloudflare 로그에 "🔍 Received request body" 출력되는가?
- [ ] categoryCode가 제대로 수신되었는가?
- [ ] token이 Number 타입으로 수신되었는가?

### [ ] Solapi API: 요청 확인
- [ ] "📤 Solapi API request" 로그가 출력되는가?
- [ ] requestBody에 categoryCode가 포함되어 있는가?
- [ ] Solapi API 응답이 무엇인가?

## 🚨 예상 문제 시나리오

### 시나리오 1: categoryCode가 빈 문자열
**증상:**
```javascript
categoryCode: ""
categoryCodeType: "string"
categoryCodeLength: 0
```

**원인:** Step 1에서 카테고리 선택이 제대로 저장되지 않음

**해결:** 
1. Step 1로 돌아가기
2. 카테고리 다시 선택
3. "선택된 카테고리" 메시지 확인

### 시나리오 2: token이 string 타입
**증상:**
```javascript
token: "123456"
tokenType: "string"
```

**원인:** parseInt가 제대로 작동하지 않음

**해결:** 
- 이미 코드에서 parseInt 처리됨
- 만약 여전히 string이면 코드 버그

### 시나리오 3: Solapi API가 다른 형식 요구
**증상:**
```
Solapi API error: "카테고리를 선택해주세요"
```
하지만 categoryCode는 제대로 전송됨

**원인:** Solapi API가 다른 형식의 categoryCode를 요구할 수 있음

**해결 방법:**
1. 실제 Solapi 문서에서 categoryCode 형식 확인
2. 하드코딩된 카테고리 코드 변경 필요

## 📝 다음 단계

### 로그 수집 후 공유
1. 브라우저 Console의 전체 로그 복사
2. 특히 다음 로그 중요:
   - `🔍 최종 전송 데이터 (v2)`
   - `❌ Create channel failed`
3. 확인 다이얼로그에 표시된 정보 캡처

### Cloudflare 로그 확인
1. Cloudflare Dashboard → Logs
2. `🔍 Received request body` 로그 확인
3. `❌ Solapi API error` 로그 확인

이 정보를 통해 정확한 문제 원인을 파악할 수 있습니다!

---

**디버깅 버전 배포**: 2026-02-28  
**커밋**: 5703719  
**테스트 URL**: https://superplacestudy.pages.dev/dashboard/kakao-channel/register/
