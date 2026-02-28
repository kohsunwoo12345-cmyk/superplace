# 카카오 채널 등록 - 카테고리 에러 수정 완료

## 🔴 문제 상황
```
카카오 서비스 오류 리턴(카테고리를 선택해주세요.)
```
- Step 1에서 카테고리를 선택했는데도 계속 "카테고리를 선택해주세요" 에러 발생
- Step 2에서 인증번호 요청 시 400 Bad Request 오류

## 🔍 원인 분석

### Solapi API 요구사항
Solapi API는 **두 단계** 모두에서 categoryCode가 필요합니다:

1. **토큰 요청 API** (`POST /kakao/v1/plus-friends/token`)
   - ❌ 기존: searchId, phoneNumber만 전송
   - ✅ 수정: searchId, phoneNumber, **categoryCode** 전송

2. **채널 생성 API** (`POST /kakao/v1/plus-friends`)
   - ✅ 이미 구현됨: searchId, phoneNumber, categoryCode, token 전송

### 기존 코드 문제
- 프론트엔드: Step 1에서 카테고리를 선택하지만, Step 2의 토큰 요청에서 전송하지 않음
- API: request-token.ts가 categoryCode를 받지 않고 전송하지 않음

## ✅ 해결 방법

### 1. 프론트엔드 수정 (`src/app/dashboard/kakao-channel/register/page.tsx`)

**카테고리 검증 추가**
```typescript
const handleRequestToken = async () => {
  if (!searchId || !phoneNumber) {
    setError('검색용 ID와 담당자 휴대전화 번호를 입력해주세요.');
    return;
  }

  // 카테고리 검증 추가
  if (!finalCategoryCode) {
    setError('카테고리를 먼저 선택해주세요.');
    return;
  }
  
  // ... 
}
```

**API 호출 시 categoryCode 전송**
```typescript
const response = await fetch('/api/kakao/request-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    searchId: cleanSearchId, 
    phoneNumber,
    categoryCode: finalCategoryCode  // 추가
  }),
});
```

**버튼 비활성화 조건 개선**
```typescript
<Button 
  onClick={handleRequestToken} 
  disabled={loading || !searchId || !phoneNumber || !finalCategoryCode}
  // finalCategoryCode 체크 추가
>
```

### 2. API 수정 (`functions/api/kakao/request-token.ts`)

**입력 파라미터 추가**
```typescript
const body = await context.request.json();
const { searchId, phoneNumber, categoryCode } = body;  // categoryCode 추가

if (!searchId || !phoneNumber || !categoryCode) {  // 검증 추가
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'searchId, phoneNumber, categoryCode are required' 
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Solapi API 요청에 categoryCode 포함**
```typescript
const requestBody = {
  searchId: cleanSearchId,
  phoneNumber: phoneNumber,
  categoryCode: categoryCode,  // 추가
};
```

## 📋 전체 프로세스 (수정 후)

### Step 1: 카테고리 선택
1. 대분류 선택 (예: CS - 교육)
2. 중분류 선택 (예: CS02 - 학원)
3. `finalCategoryCode` 상태에 "CS02" 저장
4. "다음 단계" 버튼 활성화

### Step 2: 채널 정보 입력 및 인증번호 요청
1. 선택된 카테고리 표시: ✅ CS02
2. 검색용 ID 입력 (@ 자동 제거)
3. 담당자 휴대전화 입력
4. **"인증번호 요청" 버튼 클릭**
   ```json
   POST /api/kakao/request-token
   {
     "searchId": "myacademy",
     "phoneNumber": "01012345678",
     "categoryCode": "CS02"  // ← 이제 포함됨!
   }
   ```
5. Solapi API 호출 성공 → SMS 인증번호 발송

### Step 3: 인증번호 확인 및 채널 생성
1. SMS로 받은 6자리 인증번호 입력
2. **"인증 및 연동 완료" 버튼 클릭**
   ```json
   POST /api/kakao/create-channel
   {
     "searchId": "myacademy",
     "phoneNumber": "01012345678",
     "categoryCode": "CS02",
     "token": "123456"
   }
   ```
3. 채널 연동 완료 → pfId 발급

## 🚀 배포 정보
- **이전 커밋**: c2217ba (searchId @ 기호 제거)
- **현재 커밋**: 85ef70c (categoryCode 추가)
- **브랜치**: main
- **배포 URL**: https://superplacestudy.pages.dev/
- **배포 상태**: ✅ 성공 (HTTP 200)
- **배포 시간**: 2026-02-28

## 🧪 테스트 방법
1. https://superplacestudy.pages.dev/dashboard/kakao-channel/register/ 접속
2. **Step 1**: 카테고리 선택
   - 교육 (CS) → 학원 (CS02) 선택
   - ✅ "선택된 카테고리: CS02" 확인
3. **Step 2**: 채널 정보 입력
   - ✅ 상단에 "선택된 카테고리: CS02" 표시 확인
   - 검색용 ID: myacademy (또는 @myacademy)
   - 휴대전화: 01012345678
   - "인증번호 요청" 클릭
   - ✅ SMS 수신 확인
4. **Step 3**: 인증 완료
   - SMS 인증번호 입력
   - "인증 및 연동 완료" 클릭
   - ✅ "카카오톡 채널이 성공적으로 연동되었습니다!" 메시지 확인

## 📊 변경 파일
- ✅ `functions/api/kakao/request-token.ts` - categoryCode 파라미터 추가
- ✅ `src/app/dashboard/kakao-channel/register/page.tsx` - categoryCode 전송 로직 추가

## 🔗 관련 문서
- [이전 수정: searchId @ 기호 제거](./KAKAO_CHANNEL_FIX_SUMMARY.md)
- [Solapi 카카오 알림톡 가이드](https://guide.solapi.com/f32847ef-390e-4d1f-a724-e2d019d7901e)
- [카카오톡 채널 관리자센터](https://business.kakao.com/dashboard)

## ✨ 주요 개선 사항
1. **완전한 API 스펙 준수**: 토큰 요청 및 채널 생성 모두에서 categoryCode 전송
2. **명확한 검증**: 카테고리 미선택 시 사용자에게 즉시 안내
3. **버튼 상태 관리**: 필수 정보 미입력 시 버튼 비활성화
4. **디버그 개선**: 모든 요청 파라미터를 로그에 출력

## 📝 카테고리 코드 예시
```
CS (교육)
  ├── CS01: 교육기관
  ├── CS02: 학원
  └── CS03: 온라인교육

PH (의료/건강)
  ├── PH01: 병원/의원
  ├── PH02: 약국
  └── PH03: 한의원

BT (뷰티)
  ├── BT01: 미용실
  ├── BT02: 피부관리
  └── BT03: 네일샵
```

---

**수정 완료 시간**: 2026-02-28  
**상태**: ✅ 배포 완료 및 테스트 가능  
**다음 단계**: 실제 카카오 채널로 연동 테스트
