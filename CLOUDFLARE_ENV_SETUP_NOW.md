# ⚡ CloudFlare Pages 환경 변수 설정 가이드 (즉시 적용)

## 🎯 목표

CloudFlare Pages가 Vercel과 동일한 데이터베이스를 사용하도록 환경 변수를 설정합니다.

---

## 📋 1단계: Vercel 환경 변수 확인

### Vercel Dashboard에서 확인

1. **Vercel Dashboard 접속**
   - https://vercel.com/dashboard
   - `superplace` 프로젝트 클릭

2. **환경 변수 페이지로 이동**
   - 좌측 메뉴: **Settings** 클릭
   - 상단 탭: **Environment Variables** 클릭

3. **다음 환경 변수들의 값을 메모장에 복사**

   #### ✅ 복사할 환경 변수 (5개)
   
   | 변수 이름 | 설명 | 복사 방법 |
   |----------|------|----------|
   | `DATABASE_URL` | PostgreSQL 연결 문자열 | 👁️ Show 클릭 → 전체 복사 |
   | `NEXTAUTH_SECRET` | NextAuth 비밀 키 | 👁️ Show 클릭 → 복사 |
   | `GOOGLE_GEMINI_API_KEY` | Gemini API 키 | 👁️ Show 클릭 → 복사 |
   | `GEMINI_API_KEY` | Gemini API 키 (백업) | 👁️ Show 클릭 → 복사 |
   | `OPENAI_API_KEY` (선택) | OpenAI API 키 | 👁️ Show 클릭 → 복사 |

---

## 🌐 2단계: CloudFlare Pages 환경 변수 설정

### CloudFlare Dashboard에서 설정

1. **CloudFlare Dashboard 접속**
   - https://dash.cloudflare.com/
   - 로그인

2. **프로젝트 선택**
   - 좌측 메뉴: **Workers & Pages** 클릭
   - 프로젝트 목록에서 **superplace-study** 클릭 (또는 해당 프로젝트명)

3. **환경 변수 페이지로 이동**
   - 상단 탭: **Settings** 클릭
   - 아래로 스크롤: **Environment variables** 섹션 찾기

4. **환경 변수 추가**

   각 변수마다 **Add variable** 버튼을 클릭하고 다음 정보 입력:

---

### 📌 변수 1: DATABASE_URL

```
Variable name: DATABASE_URL
Value: [Vercel에서 복사한 DATABASE_URL 값 붙여넣기]
```

**예시 값**:
```
postgres://default:xxxxx@ep-xxxxx-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require
```

**Environment 선택**:
- ✅ Production
- ⚠️ Preview (선택사항)

**Save** 클릭

---

### 📌 변수 2: NEXTAUTH_URL

```
Variable name: NEXTAUTH_URL
Value: https://superplace-study.pages.dev
```

⚠️ **중요**: 
- Vercel 값과 다릅니다!
- CloudFlare Pages 도메인을 입력해야 합니다
- 커스텀 도메인 사용 시 해당 도메인 입력

**Environment 선택**:
- ✅ Production

**Save** 클릭

---

### 📌 변수 3: NEXTAUTH_SECRET

```
Variable name: NEXTAUTH_SECRET
Value: [Vercel에서 복사한 NEXTAUTH_SECRET 값 붙여넣기]
```

**예시 값**:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Environment 선택**:
- ✅ Production

**Save** 클릭

---

### 📌 변수 4: GOOGLE_GEMINI_API_KEY

```
Variable name: GOOGLE_GEMINI_API_KEY
Value: [Vercel에서 복사한 GOOGLE_GEMINI_API_KEY 값 붙여넣기]
```

**예시 값**:
```
AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Environment 선택**:
- ✅ Production

**Save** 클릭

---

### 📌 변수 5: GEMINI_API_KEY

```
Variable name: GEMINI_API_KEY
Value: [변수 4와 동일한 값 붙여넣기]
```

**Environment 선택**:
- ✅ Production

**Save** 클릭

---

### 📌 변수 6 (선택): OPENAI_API_KEY

Vercel에 설정되어 있다면:

```
Variable name: OPENAI_API_KEY
Value: [Vercel에서 복사한 OPENAI_API_KEY 값 붙여넣기]
```

**Environment 선택**:
- ✅ Production

**Save** 클릭

---

## 🔄 3단계: CloudFlare Pages 재배포

환경 변수 설정 후 반드시 재배포해야 적용됩니다.

1. **Deployments 탭 클릭**

2. **최신 배포 찾기**
   - 가장 위에 있는 배포 (Latest deployment)

3. **재배포 실행**
   - 배포 오른쪽의 **⋯** (점 3개) 메뉴 클릭
   - **Retry deployment** 선택
   - 또는 **Manage deployment** > **Retry deployment** 클릭

4. **빌드 진행 상황 확인**
   - 빌드 로그 자동 표시
   - 약 2-3분 소요
   - ✅ **Success** 상태 확인

---

## ✅ 4단계: 동기화 확인

### 배포 완료 후 확인

1. **CloudFlare Pages 접속**
   ```
   https://superplace-study.pages.dev
   ```
   
2. **관리자 페이지 접근**
   ```
   https://superplace-study.pages.dev/auth/signin
   ```
   
3. **Vercel 계정으로 로그인**
   - Vercel에서 사용하던 이메일/비밀번호로 로그인
   - ✅ 로그인 성공 = 데이터베이스 동기화 완료!

4. **사용자 목록 확인**
   ```
   https://superplace-study.pages.dev/dashboard/admin/users
   ```
   
5. **Vercel과 비교**
   ```
   Vercel:      https://superplace-study.vercel.app/dashboard/admin/users
   CloudFlare:  https://superplace-study.pages.dev/dashboard/admin/users
   ```
   
   ✅ **동일한 사용자 목록 표시 = 동기화 성공!**

---

## 🎯 환경 변수 체크리스트

배포 전 확인:

- [ ] `DATABASE_URL` - Vercel과 동일한 값 설정
- [ ] `NEXTAUTH_URL` - CloudFlare Pages 도메인으로 설정
- [ ] `NEXTAUTH_SECRET` - Vercel과 동일한 값 설정
- [ ] `GOOGLE_GEMINI_API_KEY` - Vercel과 동일한 값 설정
- [ ] `GEMINI_API_KEY` - 위와 동일한 값 설정
- [ ] 모든 변수가 **Production** 환경에 적용됨
- [ ] **Retry deployment** 실행 완료
- [ ] 빌드 성공 확인

배포 후 확인:

- [ ] CloudFlare Pages 사이트 접속 성공
- [ ] Vercel 계정으로 로그인 성공
- [ ] 관리자 페이지 접근 성공
- [ ] Vercel과 동일한 사용자 목록 표시
- [ ] 실시간 동기화 테스트 성공

---

## 🐛 문제 해결

### 로그인 실패

**증상**: 로그인 시도 시 오류 발생

**원인**:
1. `NEXTAUTH_URL`이 잘못 설정됨
2. `NEXTAUTH_SECRET`이 누락되거나 잘못됨

**해결**:
1. CloudFlare 환경 변수 확인:
   - `NEXTAUTH_URL` = `https://superplace-study.pages.dev`
   - `NEXTAUTH_SECRET` = Vercel과 동일한 값
2. 환경 변수 수정 후 **Retry deployment**
3. 브라우저 캐시 삭제 후 재시도

---

### 사용자 데이터 없음

**증상**: 로그인은 되지만 사용자 목록이 비어있음

**원인**: `DATABASE_URL`이 Vercel과 다름

**해결**:
1. Vercel Dashboard에서 `DATABASE_URL` 다시 복사
2. CloudFlare Pages 환경 변수 확인
3. 값이 **완전히 동일**한지 확인 (끝까지 복사됐는지)
4. 환경 변수 수정 후 **Retry deployment**

---

### 데이터베이스 연결 오류

**증상**: `connect ETIMEDOUT` 또는 `P1001` 오류

**원인**: 
1. `DATABASE_URL` 형식 오류
2. `?sslmode=require` 파라미터 누락

**해결**:
1. `DATABASE_URL`이 다음을 포함하는지 확인:
   ```
   postgres://...?sslmode=require
   ```
2. Vercel에서 전체 URL을 다시 복사
3. 환경 변수 수정 후 **Retry deployment**

---

### 빌드 실패

**증상**: 배포 시 빌드 오류 발생

**원인**: 필수 환경 변수 누락

**해결**:
1. CloudFlare Deployments > 실패한 배포 > View logs
2. 에러 메시지에서 누락된 환경 변수 확인
3. Settings > Environment variables에서 해당 변수 추가
4. **Retry deployment**

---

## 📞 추가 지원

### 스크린샷 가이드
각 단계의 스크린샷이 필요하면 다음 문서 참조:
- `CLOUDFLARE_PAGES_DEPLOYMENT.md`
- `DATABASE_SYNC_GUIDE.md`

### 빠른 시작
5분 완성 가이드:
- `QUICK_SYNC_GUIDE.md`

---

## ✨ 완료!

모든 환경 변수 설정이 완료되고 재배포가 성공하면, CloudFlare Pages에서 Vercel과 동일한 사용자 데이터를 확인할 수 있습니다!

```
Vercel (기존)
    ↓ DATABASE_URL (동일)
PostgreSQL Database
    ↓ DATABASE_URL (동일)
CloudFlare Pages (신규)

✅ 실시간 동기화 완료!
```

---

**작성자**: GenSpark AI Developer  
**날짜**: 2025-01-31
