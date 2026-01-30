# 🔑 Cloudflare API 토큰 생성 가이드 (상세)

## ⚠️ 중요: D1 권한이 필요합니다!

제공하신 템플릿 목록에는 **D1 권한이 없습니다**.
따라서 **Custom Token**을 직접 만들어야 합니다.

---

## 📋 단계별 설정 방법

### 1단계: API Tokens 페이지 접속

1. https://dash.cloudflare.com 로그인
2. 우측 상단 **프로필 아이콘** 클릭
3. **My Profile** 선택
4. 좌측 메뉴에서 **API Tokens** 클릭
5. **Create Token** 버튼 클릭

### 2단계: Custom Token 선택

**템플릿 선택 화면에서**:
- ❌ "Edit zone DNS" 선택 안 함
- ❌ "Read Cloudflare Stream and Images" 선택 안 함
- ✅ **"Create Custom Token"** 선택
- 또는 페이지 맨 아래 **"Get started"** (Custom token 섹션)

### 3단계: 토큰 설정

#### Token name (토큰 이름)
```
superplace-d1-access
```

#### Permissions (권한 설정) ⚠️ 중요!

**Account 권한 추가**:
1. **Add** 또는 **+** 버튼 클릭
2. 첫 번째 드롭다운에서 **"Account"** 선택
3. 두 번째 드롭다운에서 **"D1"** 선택 ← 이게 중요!
4. 세 번째 드롭다운에서 **"Edit"** 선택

**최종 권한**:
```
Account → D1 → Edit
```

**화면 예시**:
```
┌─────────────────────────────────────────────┐
│ Permissions                                 │
├─────────────────────────────────────────────┤
│ Account  ▼ │ D1  ▼ │ Edit  ▼ │    [x]     │
└─────────────────────────────────────────────┘
```

#### Account Resources (계정 리소스)

**Include 설정**:
```
Include → All accounts from a specific user
```
또는
```
Include → Specific account → [Your Account 선택]
```

#### Client IP Address Filtering (선택사항)
- **비워두기** (모든 IP에서 접근 가능)
- 또는 Vercel IP 범위 지정 (고급)

#### TTL (만료 기간)
권장:
```
Never expire (만료 안 함)
```
또는 원하는 기간 설정

### 4단계: 토큰 생성 및 복사

1. **Continue to summary** 클릭
2. 설정 확인:
   ```
   ✅ Account → D1 → Edit
   ✅ Include: Your Account
   ```
3. **Create Token** 클릭
4. **토큰이 표시됨** (한 번만 보임!)
5. 토큰 전체를 복사 (예시):
   ```
   cloudflare-api-token-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

⚠️ **주의**: 토큰은 생성 직후에만 표시되므로 반드시 복사하세요!

---

## 🔍 D1 권한을 찾을 수 없나요?

### 방법 1: 스크롤 다운
- Permissions 드롭다운을 클릭했을 때
- 리스트가 길기 때문에 **아래로 스크롤**해야 합니다
- "D1"은 알파벳 순서로 중간쯤에 있습니다

### 방법 2: 검색 기능
- 일부 브라우저에서는 드롭다운 내에서 타이핑하면 검색됩니다
- "D1" 입력해보세요

### 방법 3: Account 레벨 확인
- 첫 번째 드롭다운이 **"Account"**인지 확인
- "Zone"이 아니라 **"Account"**여야 합니다

### D1이 정말 없다면?
Cloudflare 계정에 D1 기능이 활성화되지 않았을 수 있습니다:

1. https://dash.cloudflare.com 접속
2. 좌측 메뉴에서 **"Workers & Pages"** 클릭
3. **"D1"** 탭 확인
4. D1 데이터베이스가 보이는지 확인
5. 없다면 D1을 먼저 활성화해야 합니다

---

## ✅ Vercel 환경 변수 설정

토큰을 복사했다면 Vercel에 추가:

### Vercel Dashboard
1. 프로젝트 선택 (superplace)
2. **Settings** → **Environment Variables**
3. 다음 변수 추가:

```bash
# 이름
CLOUDFLARE_D1_API_TOKEN

# 값 (복사한 토큰)
cloudflare-api-token-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 적용 환경
✅ Production
✅ Preview  
✅ Development
```

4. **Save** 클릭

### 다른 필요한 환경 변수

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id-here
CLOUDFLARE_D1_DATABASE_ID=8c106540-21b4-4fa9-8879-c4956e459ca1
```

---

## 🧪 토큰 테스트

토큰이 올바르게 작동하는지 테스트:

```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/d1/database/YOUR_DATABASE_ID/query" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT 1 as test"}'
```

**예상 응답**:
```json
{
  "success": true,
  "result": [{"test": 1}]
}
```

---

## ❌ 자주 발생하는 오류

### "Permission denied" 또는 "Insufficient permissions"
✅ **해결**: 
- 토큰 권한에 **"Account → D1 → Edit"**가 있는지 확인
- "Zone" 레벨이 아니라 **"Account"** 레벨인지 확인

### "Invalid token" 또는 "Authentication failed"
✅ **해결**:
- 토큰을 정확하게 복사했는지 확인
- 앞뒤 공백이 없는지 확인
- 토큰이 만료되지 않았는지 확인

### "Resource not found"
✅ **해결**:
- CLOUDFLARE_ACCOUNT_ID가 올바른지 확인
- CLOUDFLARE_D1_DATABASE_ID가 올바른지 확인
- 해당 계정에 D1 데이터베이스가 실제로 존재하는지 확인

---

## 📸 스크린샷 가이드

토큰 생성 화면에서 확인해야 할 것:

### 1. Custom Token 선택
```
┌─────────────────────────────────────┐
│ Create Custom Token                 │
│                                     │
│ Create a token with custom          │
│ permissions.                        │
│                                     │
│        [Get started]                │
└─────────────────────────────────────┘
```

### 2. Permissions 설정
```
┌──────────────────────────────────────────┐
│ Permissions                              │
├──────────────────────────────────────────┤
│ Permission Group  ▼ │ Resource ▼ │ ...  │
├──────────────────────────────────────────┤
│ Account          ▼ │ D1       ▼ │ Edit ▼│
└──────────────────────────────────────────┘
```

### 3. 생성 완료
```
┌──────────────────────────────────────────┐
│ API Token successfully created           │
├──────────────────────────────────────────┤
│ cloudflare-api-token-xxxxxxxxxxxx...     │
│                                          │
│ ⚠️ This token will only be shown once   │
└──────────────────────────────────────────┘
```

---

## 🎯 완료 체크리스트

- [ ] Cloudflare Dashboard 로그인
- [ ] API Tokens 페이지 접속
- [ ] Create Custom Token 선택
- [ ] Account → D1 → Edit 권한 설정
- [ ] 계정 리소스 선택
- [ ] 토큰 생성
- [ ] 토큰 복사 (한 번만 표시됨!)
- [ ] Vercel에 CLOUDFLARE_D1_API_TOKEN 추가
- [ ] Vercel에 CLOUDFLARE_ACCOUNT_ID 추가
- [ ] Vercel 재배포
- [ ] 테스트: /dashboard/admin/users 접속

---

**작성일**: 2026-01-30
**필수 권한**: Account → D1 → Edit
**만료 설정**: Never expire 권장
