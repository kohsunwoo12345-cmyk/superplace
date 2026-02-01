# 🔍 Cloudflare D1 연결 문제 진단 가이드

## 📋 재배포 완료 후 확인 단계

### 1단계: 환경 변수 확인

재배포 완료 후 다음 URL에 접속하세요:
```
https://superplace-study.vercel.app/api/test-d1-env
```

**예상 결과**:
```json
{
  "message": "Cloudflare D1 환경 변수 확인",
  "isD1Configured": true,
  "environmentVariables": {
    "CLOUDFLARE_ACCOUNT_ID": "✅ 설정됨",
    "CLOUDFLARE_D1_DATABASE_ID": "✅ 설정됨",
    "CLOUDFLARE_API_KEY": "✅ 설정됨",
    "CLOUDFLARE_EMAIL": "✅ 설정됨"
  },
  "recommendation": "✅ 모든 환경 변수가 설정되었습니다!"
}
```

### 만약 ❌가 보인다면?

**Vercel 환경 변수 다시 확인**:
1. https://vercel.com → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 4개가 모두 있는지 확인:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_D1_DATABASE_ID`
   - `CLOUDFLARE_API_KEY`
   - `CLOUDFLARE_EMAIL`
4. 각 변수마다 **Production/Preview/Development 모두 체크**되어 있는지 확인
5. 하나라도 체크 안 되어 있으면 **Edit** → 체크 → **Save**
6. 재배포

---

### 2단계: Vercel Function 로그 확인

1. https://vercel.com → 프로젝트 선택
2. **Deployments** → 최신 배포 클릭
3. **Functions** 탭
4. `/api/admin/users` 클릭
5. 로그에서 오류 메시지 확인

**찾아야 할 키워드**:
- `❌ Cloudflare D1 환경 변수가 설정되지 않았습니다`
- `🔑 Using API Token authentication`
- `🔑 Using Global API Key authentication`
- `📊 D1에서 X명의 사용자를 가져왔습니다`

---

### 3단계: 브라우저 콘솔 확인

1. https://superplace-study.vercel.app/dashboard/admin/users 접속
2. **F12** 눌러서 개발자 도구 열기
3. **Console** 탭 선택
4. 오류 메시지 확인

**찾아야 할 것**:
- 빨간색 오류 메시지
- Network 탭에서 `/api/admin/users` 요청의 상태 코드
- Response 내용

---

## 🔧 일반적인 문제와 해결법

### 문제 1: "사용자가 안 나와요"

**원인**: 환경 변수 설정 안 됨

**해결**:
```bash
# Vercel 환경 변수 확인
1. CLOUDFLARE_ACCOUNT_ID ✅
2. CLOUDFLARE_D1_DATABASE_ID ✅
3. CLOUDFLARE_API_KEY ✅
4. CLOUDFLARE_EMAIL ✅
```

모두 체크 후 재배포!

---

### 문제 2: "환경 변수는 설정했는데도 안 돼요"

**원인**: 재배포 시 캐시 사용

**해결**:
1. Vercel Deployments
2. 점 3개(⋮) → **Redeploy**
3. ❌ **"Use existing Build Cache"** 체크 해제
4. **Redeploy** 클릭

---

### 문제 3: "401 Unauthorized" 오류

**원인**: API Key가 잘못됨

**해결**:
1. Cloudflare에서 Global API Key 다시 확인
2. 복사할 때 앞뒤 공백 없는지 확인
3. Vercel 환경 변수 다시 설정
4. 재배포

---

### 문제 4: "404 Not Found" 오류

**원인**: Account ID 또는 Database ID가 잘못됨

**해결**:
1. **Account ID 재확인**:
   - https://dash.cloudflare.com 접속
   - URL에서 확인: `https://dash.cloudflare.com/[여기]/...`

2. **Database ID 재확인**:
   - Workers & Pages → D1 → 데이터베이스 클릭
   - Database ID 복사

---

## 📸 스크린샷으로 확인하기

### Vercel 환경 변수 확인
```
┌────────────────────────────────────────────┐
│ Environment Variables                      │
├────────────────────────────────────────────┤
│ Name                          Value        │
├────────────────────────────────────────────┤
│ CLOUDFLARE_ACCOUNT_ID         1a2b3c...   │
│ ✅ Production ✅ Preview ✅ Development   │
├────────────────────────────────────────────┤
│ CLOUDFLARE_D1_DATABASE_ID     8c1065...   │
│ ✅ Production ✅ Preview ✅ Development   │
├────────────────────────────────────────────┤
│ CLOUDFLARE_API_KEY            a1b2c3...   │
│ ✅ Production ✅ Preview ✅ Development   │
├────────────────────────────────────────────┤
│ CLOUDFLARE_EMAIL              your@email  │
│ ✅ Production ✅ Preview ✅ Development   │
└────────────────────────────────────────────┘
```

---

## 🆘 그래도 안 되면?

다음 정보를 알려주세요:

1. **테스트 엔드포인트 결과**:
   ```
   https://superplace-study.vercel.app/api/test-d1-env
   ```
   결과 전체 복사해서 알려주기

2. **Vercel Function 로그**:
   - Deployments → Functions → `/api/admin/users`
   - 로그 스크린샷 또는 복사

3. **브라우저 콘솔 오류**:
   - F12 → Console 탭
   - 빨간색 오류 메시지 복사

4. **환경 변수 목록**:
   - Settings → Environment Variables
   - 변수 이름만 (값은 가리고) 스크린샷

---

## ✅ 체크리스트

디버깅 순서:

- [ ] 1. 테스트 엔드포인트 접속 (`/api/test-d1-env`)
- [ ] 2. 모든 환경 변수가 "✅ 설정됨"인지 확인
- [ ] 3. Vercel 환경 변수 페이지에서 4개 변수 확인
- [ ] 4. 각 변수마다 3개 환경 모두 체크되어 있는지 확인
- [ ] 5. 캐시 없이 재배포
- [ ] 6. Vercel Function 로그 확인
- [ ] 7. 브라우저 콘솔 확인

---

**다음 단계**: 먼저 테스트 엔드포인트 결과를 알려주세요!

**URL**: https://superplace-study.vercel.app/api/test-d1-env

이 결과를 보면 정확히 어디가 문제인지 알 수 있습니다! 🔍
