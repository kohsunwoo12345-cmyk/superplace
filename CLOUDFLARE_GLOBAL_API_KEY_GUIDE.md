# 🔑 Cloudflare API Key 대안 가이드

## ⚠️ "Create Custom Token"이 없는 경우

"Create Custom Token" 옵션이 보이지 않는다면 **Global API Key**를 사용할 수 있습니다.

---

## 방법 1: Global API Key 사용 (간단함)

### 1단계: Global API Key 찾기

1. https://dash.cloudflare.com 로그인
2. 우측 상단 **프로필 아이콘** 클릭
3. **My Profile** 선택
4. 좌측 메뉴 **API Tokens** 클릭
5. **"API Keys"** 섹션으로 스크롤 (페이지 아래쪽)
6. **"Global API Key"** 찾기
7. **"View"** 버튼 클릭
8. 비밀번호 입력
9. API Key 복사

### 2단계: Vercel 환경 변수 설정

Vercel Dashboard에서 다음 변수들을 설정:

```bash
# Cloudflare Account ID (Dashboard URL에서 확인)
CLOUDFLARE_ACCOUNT_ID=your-account-id

# D1 Database ID (이미 알고 계신 값)
CLOUDFLARE_D1_DATABASE_ID=8c106540-21b4-4fa9-8879-c4956e459ca1

# Global API Key (방금 복사한 것)
CLOUDFLARE_D1_API_TOKEN=your-global-api-key

# Cloudflare 계정 이메일
CLOUDFLARE_EMAIL=your-email@example.com
```

⚠️ **주의**: Global API Key는 모든 권한을 가지므로 보안에 주의하세요!

---

## 방법 2: API Token 페이지 다시 확인

혹시 놓쳤을 수 있는 위치들:

### 위치 1: 페이지 상단
```
┌────────────────────────────────────┐
│ API Tokens                         │
├────────────────────────────────────┤
│                                    │
│ [Create Token] ← 이 버튼 클릭      │
│                                    │
└────────────────────────────────────┘
```

### 위치 2: Templates 섹션 아래
```
┌────────────────────────────────────┐
│ API Token Templates                │
│ - Edit zone DNS                    │
│ - Read analytics                   │
│ ...                                │
├────────────────────────────────────┤
│ Create Custom Token ← 여기!        │
│ [Get started]                      │
└────────────────────────────────────┘
```

### 위치 3: 다른 이름으로 표시
- "Create a custom token"
- "Custom Token"
- "Configure custom token"

---

## 방법 3: 코드 수정 (Global API Key 지원)

코드를 수정하여 Global API Key를 사용하도록 변경하겠습니다.

### 필요한 환경 변수
```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_D1_DATABASE_ID=8c106540-21b4-4fa9-8879-c4956e459ca1
CLOUDFLARE_API_KEY=your-global-api-key
CLOUDFLARE_EMAIL=your-email@example.com
```

---

## 🔍 Account ID 확인 방법

### 방법 1: Dashboard URL에서
1. https://dash.cloudflare.com 접속
2. 아무 사이트나 클릭
3. 브라우저 주소창 확인:
   ```
   https://dash.cloudflare.com/[이 부분이 Account ID]/...
   ```

### 방법 2: 홈 화면에서
1. https://dash.cloudflare.com 접속
2. 오른쪽 사이드바에 **Account ID** 표시됨
3. 복사 버튼으로 복사

### 방법 3: API로 확인
```bash
curl https://api.cloudflare.com/client/v4/accounts \
  -H "X-Auth-Email: your-email@example.com" \
  -H "X-Auth-Key: your-global-api-key"
```

---

## 📋 설정 단계 (Global API Key 사용)

### 1단계: 필요한 정보 수집

✅ **Cloudflare Email**: (로그인 이메일)
```
your-email@example.com
```

✅ **Global API Key**: (My Profile → API Keys에서)
```
your-global-api-key-here
```

✅ **Account ID**: (Dashboard URL 또는 홈 화면에서)
```
your-account-id-here
```

✅ **D1 Database ID**: (이미 있음)
```
8c106540-21b4-4fa9-8879-c4956e459ca1
```

### 2단계: Vercel 환경 변수 설정

**Vercel Dashboard** → **Settings** → **Environment Variables**

다음 4개 변수 추가:

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_D1_DATABASE_ID=8c106540-21b4-4fa9-8879-c4956e459ca1
CLOUDFLARE_API_KEY=your-global-api-key
CLOUDFLARE_EMAIL=your-email@example.com
```

**모든 환경에 적용**:
- ✅ Production
- ✅ Preview
- ✅ Development

### 3단계: 코드 수정 (제가 할게요!)

Global API Key를 지원하도록 코드를 수정하겠습니다.

### 4단계: Vercel 재배포

환경 변수 설정 후:
1. **Deployments** 탭
2. 최신 배포 → **Redeploy**
3. ❌ **Use existing Build Cache** 체크 해제
4. **Redeploy** 클릭

---

## ✅ 테스트

재배포 완료 후:
1. https://superplace-study.vercel.app/dashboard/admin/users 접속
2. 자동으로 D1에서 사용자 동기화
3. 회원가입한 모든 사용자 표시

---

## 🔒 보안 권장사항

Global API Key는 **모든 권한**을 가지므로:

1. ✅ Vercel 환경 변수만 사용 (코드에 포함하지 말 것)
2. ✅ Production 환경만 사용
3. ✅ 주기적으로 Key 갱신
4. ✅ 사용하지 않을 때는 비활성화

**나중에 Custom Token을 사용할 수 있게 되면 변경하는 것을 권장합니다.**

---

## 💡 요약

**현재 상황**: "Create Custom Token" 없음

**해결 방법**: 
1. ✅ **Global API Key 사용** (가장 간단)
2. ⏳ 코드 수정 (제가 지금 할게요)
3. ✅ Vercel 환경 변수 4개 설정
4. ✅ 재배포

**필요한 정보**:
- Cloudflare Email
- Global API Key
- Account ID
- D1 Database ID (이미 있음)

---

지금 바로 Global API Key를 사용하도록 코드를 수정해드릴까요? 😊
