# ✅ Cloudflare D1 데이터베이스 연결 설정 (간단 버전)

## 🎯 필요한 환경 변수 (Vercel에 설정)

이미 설정하신 것:
- ✅ `CLOUDFLARE_SITE_URL` = https://superplace-academy.pages.dev
- ✅ `CLOUDFLARE_D1_DATABASE_ID` = 8c106540-21b4-4fa9-8879-c4956e459ca1
- ✅ `CLOUDFLARE_SYNC_API_KEY` = (your-key)

**추가로 필요한 환경 변수 2개**:

### 1. CLOUDFLARE_ACCOUNT_ID (필수 ⚠️)
Cloudflare 계정 ID를 확인하는 방법:

1. https://dash.cloudflare.com 로그인
2. 오른쪽 사이드바에서 아무 사이트나 클릭
3. 브라우저 URL에서 Account ID 확인:
   ```
   https://dash.cloudflare.com/<ACCOUNT_ID>/...
   ```
4. 또는 홈 페이지 오른쪽에 표시됨

**Vercel에 설정**:
```
CLOUDFLARE_ACCOUNT_ID=your-account-id-here
```

### 2. CLOUDFLARE_D1_API_TOKEN (필수 ⚠️)
Cloudflare API 토큰을 생성하는 방법:

1. https://dash.cloudflare.com 로그인
2. 우측 상단 프로필 아이콘 → **My Profile**
3. 좌측 메뉴 **API Tokens** 클릭
4. **Create Token** 클릭
5. **Custom token** 선택 → **Get started**
6. 다음과 같이 설정:
   - **Token name**: `superplace-d1-access`
   - **Permissions**:
     - Account → D1 → Edit
   - **Account Resources**:
     - Include → Your Account
   - **Client IP Address Filtering**: (비워두기)
   - **TTL**: (원하는 기간, 권장: Never expire)
7. **Continue to summary** → **Create Token**
8. 생성된 토큰을 복사 (한 번만 표시됨!)

**Vercel에 설정**:
```
CLOUDFLARE_D1_API_TOKEN=your-api-token-here
```

또는 기존 이름 사용:
```
CLOUDFLARE_API_TOKEN=your-api-token-here
```

---

## 📝 최종 Vercel 환경 변수 목록

```bash
# Cloudflare Account (필수)
CLOUDFLARE_ACCOUNT_ID=your-account-id

# D1 Database (필수)
CLOUDFLARE_D1_DATABASE_ID=8c106540-21b4-4fa9-8879-c4956e459ca1

# API Token (필수 - 둘 중 하나)
CLOUDFLARE_D1_API_TOKEN=your-api-token
# 또는
CLOUDFLARE_API_TOKEN=your-api-token

# Optional (이미 설정됨)
CLOUDFLARE_SITE_URL=https://superplace-academy.pages.dev
CLOUDFLARE_SYNC_API_KEY=your-sync-key
```

---

## 🚀 설정 후 작업

### 1. Vercel 재배포
환경 변수 추가 후:
1. Vercel Dashboard → Deployments
2. 최신 배포 → **Redeploy**
3. ❌ **Use existing Build Cache** 체크 해제
4. **Redeploy** 클릭

### 2. 테스트
재배포 완료 후:
1. https://superplace-study.vercel.app/dashboard/admin/users 접속
2. 페이지가 로드되면 자동으로 D1에서 사용자 동기화
3. 콘솔에서 다음 메시지 확인:
   ```
   🔄 Cloudflare D1 사용자 동기화 시작...
   📊 D1에서 X명의 사용자를 가져왔습니다.
   ✅ Cloudflare D1 사용자 동기화 완료
   ```

---

## ❌ 오류 해결

### "Cloudflare D1 환경 변수가 설정되지 않았습니다"
✅ **해결**: 위의 3개 환경 변수를 모두 Vercel에 설정하고 재배포

### "401 Unauthorized" 또는 "403 Forbidden"
✅ **해결**: 
- API 토큰 권한 확인 (D1 → Edit 권한 필요)
- 토큰이 올바르게 복사되었는지 확인
- 계정 ID가 올바른지 확인

### "Database not found"
✅ **해결**:
- D1_DATABASE_ID가 올바른지 확인
- 해당 계정에 D1 데이터베이스가 존재하는지 확인

---

## ✅ 성공 확인

동기화가 성공하면 관리자 페이지에서:
- https://superplace-academy.pages.dev 에서 회원가입한 모든 사용자가 표시됨
- 학생, 학원장, 선생님이 모두 나타남
- 각 사용자의 정보가 정확하게 표시됨

---

**최종 업데이트**: 2026-01-30
**필수 환경 변수**: 3개 (ACCOUNT_ID, DATABASE_ID, API_TOKEN)
