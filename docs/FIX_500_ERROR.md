# 🔧 500 에러 해결 가이드

## 🚨 현재 상황

**에러 메시지**:
```
F12: api/auth/signup/:1  Failed to load resource: the server responded with a status of 500 ()
```

**원인**: Cloudflare Pages에서 D1 데이터베이스 바인딩이 설정되지 않음

---

## ✅ 해결 방법 (5분 소요)

### 1단계: Cloudflare Dashboard 접속
1. https://dash.cloudflare.com 접속
2. **Workers & Pages** 메뉴 클릭
3. **`superplacestudy`** 프로젝트 선택

### 2단계: D1 바인딩 추가
1. **Settings** 탭 클릭
2. 왼쪽 메뉴에서 **Functions** 클릭
3. **D1 database bindings** 섹션 찾기
4. **Add binding** 버튼 클릭

### 3단계: 바인딩 설정
```
Variable name: DB              (⚠️ 대문자 필수)
D1 database:   superplace-db   (드롭다운에서 선택)
```

### 4단계: 저장 및 재배포
1. **Save** 버튼 클릭
2. **Deployments** 탭으로 이동
3. 최신 배포의 **...** 메뉴 → **Retry deployment** 클릭
4. 배포 완료 대기 (5-10분)

---

## 🔍 바인딩 설정 후 확인 방법

### 방법 1: 브라우저에서 다시 회원가입 시도
1. https://superplacestudy.pages.dev/register 접속
2. 정보 입력 후 회원가입 클릭
3. **성공 시**: "회원가입이 완료되었습니다" 메시지
4. **실패 시**: 구체적인 에러 메시지 표시 (이제 더 명확한 메시지 제공)

### 방법 2: API 직접 호출 (F12 콘솔)
```javascript
fetch('https://superplacestudy.pages.dev/api/auth/signup/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'test1234',
    name: '테스트',
    role: 'DIRECTOR',
    academyName: '테스트학원',
    academyAddress: '서울시 강남구'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ 성공:', data);
})
.catch(err => {
  console.error('❌ 실패:', err);
});
```

---

## 📊 에러 메시지 변화

### 이전 (바인딩 설정 전)
```json
{
  "status": 500,
  "message": "(알 수 없는 오류)"
}
```

### 현재 (코드 개선 후)
```json
{
  "success": false,
  "message": "데이터베이스가 연결되지 않았습니다",
  "info": "DB binding is not configured. Check wrangler.toml and Cloudflare Pages settings."
}
```

### 바인딩 설정 후 (정상)
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다",
  "user": {
    "id": "user-xxx",
    "email": "test@example.com",
    "name": "테스트",
    "role": "DIRECTOR",
    "academyId": "academy-xxx"
  },
  "academyCode": "ABC12345"
}
```

---

## 📝 완료된 작업

### 1. API 에러 핸들링 개선
**파일**: 
- `src/app/api/auth/signup/route.ts`
- `src/app/api/auth/login/route.ts`

**변경 사항**:
```typescript
// Before: 500 에러만 발생, 원인 불명
const { env } = getRequestContext();
const db = env.DB;

// After: 구체적인 에러 메시지 반환
let db;
try {
  const { env } = getRequestContext();
  db = env.DB;
} catch (contextError) {
  return NextResponse.json({
    success: false,
    message: '데이터베이스 연결 실패',
    info: 'Request context not available. Make sure D1 binding is configured.',
    error: contextError.message
  }, { status: 500 });
}

if (!db) {
  return NextResponse.json({
    success: false,
    message: '데이터베이스가 연결되지 않았습니다',
    info: 'DB binding is not configured. Check Cloudflare Pages settings.'
  }, { status: 500 });
}
```

### 2. 설정 가이드 문서 추가
**파일**: `docs/CLOUDFLARE_D1_BINDING_SETUP.md`

**포함 내용**:
- ✅ 단계별 D1 바인딩 설정 방법
- ✅ 스크린샷 가이드
- ✅ 테스트 방법
- ✅ 트러블슈팅 가이드
- ✅ 에러 메시지 설명

---

## 🚀 Git 커밋 및 배포

### 커밋 정보
- **커밋 해시**: `3aca5f6`
- **메시지**: "fix: Improve D1 database connection error handling"
- **변경 파일**: 3개
  - `src/app/api/auth/signup/route.ts` (수정)
  - `src/app/api/auth/login/route.ts` (수정)
  - `docs/CLOUDFLARE_D1_BINDING_SETUP.md` (신규)

### 배포 상태
- ✅ GitHub push 완료
- 🚀 Cloudflare Pages 자동 배포 중 (5-10분 소요)
- 🌐 배포 URL: https://superplacestudy.pages.dev

---

## ⚡ 빠른 해결 체크리스트

- [ ] **1단계**: Cloudflare Dashboard → Workers & Pages → superplacestudy 접속
- [ ] **2단계**: Settings → Functions → D1 database bindings 확인
- [ ] **3단계**: Add binding 클릭 → Variable: `DB`, Database: `superplace-db`
- [ ] **4단계**: Save 클릭
- [ ] **5단계**: Deployments → 최신 배포 → Retry deployment
- [ ] **6단계**: 배포 완료 대기 (5-10분)
- [ ] **7단계**: https://superplacestudy.pages.dev/register 에서 회원가입 테스트
- [ ] **8단계**: ✅ 성공 확인!

---

## 🔍 추가 확인 사항

### D1 데이터베이스 존재 확인
1. Cloudflare Dashboard → **D1** 메뉴
2. **`superplace-db`** 데이터베이스 존재 확인
3. Database ID: `8c106540-21b4-4fa9-8879-c4956e459ca1`

### wrangler.toml 설정 확인 (이미 올바름)
```toml
[[d1_databases]]
binding = "DB"
database_name = "superplace-db"
database_id = "8c106540-21b4-4fa9-8879-c4956e459ca1"
```

---

## 📞 문제 지속 시

위의 모든 단계를 완료했는데도 여전히 500 에러가 발생하면:

1. **브라우저 F12** → Network 탭 → API 응답 확인
2. 응답 내용 복사 (이제 구체적인 에러 메시지 제공)
3. **Cloudflare Logs** 확인
   - Dashboard → Workers & Pages → superplacestudy → Logs
4. 에러 메시지를 알려주시면 추가 지원 가능

---

## 🎯 예상 결과

### 바인딩 설정 완료 후:
1. ✅ 회원가입 API 정상 작동 (200 OK)
2. ✅ 로그인 API 정상 작동 (200 OK)
3. ✅ 사용자 테이블에 데이터 저장
4. ✅ 학원 테이블에 데이터 저장
5. ✅ 대시보드 접속 가능

---

## 💡 왜 이런 문제가 발생했나?

### 문제 원인
- `wrangler.toml`에 D1 바인딩이 정의되어 있음 ✅
- 하지만 **Cloudflare Pages**는 `wrangler.toml`을 자동으로 읽지 않음 ❌
- **Pages Functions**에서는 수동으로 바인딩을 추가해야 함 ⚠️

### 해결 방법
- Cloudflare Pages Dashboard에서 수동으로 D1 바인딩 설정
- Settings → Functions → D1 database bindings 추가

---

**이제 D1 바인딩만 설정하면 모든 API가 정상 작동합니다!** ✨

**다음 단계**: 위의 "빠른 해결 체크리스트"를 따라 D1 바인딩을 설정해주세요! 🚀
