# 🚀 Vercel 배포 완전 가이드
## Smart Academy 학원 학습 관리 시스템

---

## ⚠️ 중요 공지

**Cloudflare Pages는 이 프로젝트를 배포할 수 없습니다!**

### 이유:
- NextAuth.js가 Edge Runtime을 완전히 지원하지 않음
- Prisma ORM이 Node.js 전용
- SQLite 데이터베이스가 파일 시스템 필요
- bcryptjs 등 Node.js 모듈 사용

### 해결책:
**Vercel을 사용하세요!** (Next.js 제작사의 플랫폼)

---

## 🎯 왜 Vercel인가?

| 항목 | Vercel | Cloudflare Pages |
|------|--------|------------------|
| Next.js 지원 | ✅ 완벽 | ⚠️ 제한적 |
| NextAuth 지원 | ✅ 완벽 | ❌ 불가능 |
| Prisma 지원 | ✅ 완벽 | ❌ 불가능 |
| 배포 난이도 | ⭐ 쉬움 | ⭐⭐⭐⭐⭐ 불가능 |
| 무료 플랜 | ✅ 있음 | ✅ 있음 |
| 자동 배포 | ✅ 자동 | ✅ 자동 |
| **추천도** | ✅✅✅✅✅ | ❌❌❌❌❌ |

---

## 📋 배포 단계 (총 7단계, 약 15분)

### 1️⃣ Vercel 접속 및 가입 (3분)

1. **Vercel 사이트 열기**
   ```
   https://vercel.com
   ```

2. **GitHub로 가입/로그인**
   - "Sign Up" 또는 "Login" 클릭
   - "Continue with GitHub" 선택
   - GitHub 계정으로 인증

3. **무료 Hobby 플랜 선택**
   - 이름 입력
   - "Deploy" 버튼 클릭

---

### 2️⃣ 프로젝트 추가 (2분)

1. **대시보드에서**
   - "Add New..." 버튼 클릭
   - "Project" 선택

2. **GitHub 저장소 연결**
   - "Import Git Repository" 섹션에서
   - `kohsunwoo12345-cmyk/superplace` 찾기
   - "Import" 클릭

3. **브랜치 선택**
   - Production Branch: `main`

---

### 3️⃣ 프로젝트 설정 (자동!) (1분)

Vercel이 자동으로 감지합니다:

```
✅ Framework Preset: Next.js (자동 감지)
✅ Root Directory: ./
✅ Build Command: npm run build
✅ Output Directory: .next
✅ Install Command: npm install
```

**아무것도 변경하지 마세요!** 자동 설정이 완벽합니다.

---

### 4️⃣ 환경 변수 설정 (5분) ⭐ 중요!

"Environment Variables" 섹션 찾기

#### 변수 1: DATABASE_URL
```
Name: DATABASE_URL
Value: file:./prisma/dev.db
```

#### 변수 2: NEXTAUTH_URL  
```
Name: NEXTAUTH_URL
Value: (아직 입력하지 말고 일단 비워두기)
```
**나중에 배포 URL을 받은 후 업데이트합니다!**

#### 변수 3: NEXTAUTH_SECRET
```
Name: NEXTAUTH_SECRET
Value: [아래에서 생성]
```

**시크릿 생성 방법:**
1. 새 탭에서 열기: https://generate-secret.vercel.app/32
2. 생성된 긴 문자열 복사
3. Value 필드에 붙여넣기

---

### 5️⃣ 배포 시작! (3분)

1. **"Deploy" 버튼 클릭**

2. **빌드 진행 확인**
   - 화면에서 빌드 로그 실시간 확인
   - "Building..." 상태 표시
   - 약 2-3분 소요

3. **배포 완료 대기**
   - ✅ "Deployment Ready" 메시지 확인
   - 배포 URL이 표시됩니다
   - 예: `https://superplace-abc123.vercel.app`

---

### 6️⃣ NEXTAUTH_URL 업데이트 (2분) ⭐ 필수!

배포가 완료되면:

1. **배포 URL 복사**
   - 예: `https://superplace-abc123.vercel.app`

2. **프로젝트 설정으로 이동**
   - 상단 "Settings" 클릭
   - 왼쪽 "Environment Variables" 클릭

3. **NEXTAUTH_URL 수정**
   - NEXTAUTH_URL 변수 찾기
   - "Edit" 클릭
   - 복사한 URL 붙여넣기
   - "Save" 클릭

4. **재배포**
   - 상단 "Deployments" 탭 클릭
   - 최신 배포 찾기
   - "..." 메뉴 → "Redeploy" 클릭
   - "Redeploy" 확인

---

### 7️⃣ 접속 확인! (1분)

재배포가 완료되면:

```
https://your-project.vercel.app
```

**확인 사항:**
- ✅ Smart Academy 메인 페이지가 보이는지
- ✅ "학원장 로그인" 버튼이 있는지
- ✅ "학생 로그인" 버튼이 있는지
- ✅ 로그인 페이지로 이동되는지

---

## 🎉 배포 완료!

### 최종 확인 체크리스트

- [ ] Vercel 계정 생성 완료
- [ ] GitHub 저장소 연결 완료
- [ ] 환경 변수 3개 설정 완료
  - [ ] DATABASE_URL
  - [ ] NEXTAUTH_URL (배포 URL로 업데이트)
  - [ ] NEXTAUTH_SECRET
- [ ] 첫 배포 완료
- [ ] NEXTAUTH_URL 업데이트 완료
- [ ] 재배포 완료
- [ ] 사이트 정상 작동 확인

---

## 📊 환경 변수 최종 확인

Vercel 설정에서 다음과 같이 보여야 합니다:

```
DATABASE_URL     = file:./prisma/dev.db
NEXTAUTH_URL     = https://your-project.vercel.app
NEXTAUTH_SECRET  = a1B2c3D4e5F6g7H8... (긴 랜덤 문자열)
```

---

## 🔄 자동 배포

이제부터는:
- GitHub에 코드를 푸시하면
- Vercel이 자동으로 빌드 및 배포
- 2-3분 후 변경사항 반영

```bash
git add .
git commit -m "새 기능 추가"
git push origin main
```

→ 자동으로 배포됩니다!

---

## ⚙️ 데이터베이스 마이그레이션

로컬에서 데이터베이스 스키마를 변경한 경우:

```bash
# 1. 로컬에서 마이그레이션
npx prisma db push

# 2. Git에 커밋 및 푸시
git add prisma/schema.prisma
git commit -m "데이터베이스 스키마 업데이트"
git push origin main
```

Vercel이 자동으로 새 스키마로 배포합니다.

---

## 🆘 문제 해결

### 문제 1: 빌드 실패

**증상:** "Build Failed" 메시지

**해결:**
1. Vercel 대시보드에서 빌드 로그 확인
2. 에러 메시지 확인
3. 로컬에서 `npm run build` 실행해서 같은 에러 재현
4. 에러 수정 후 다시 푸시

### 문제 2: 흰 화면

**증상:** 사이트가 열리지만 내용이 없음

**해결:**
1. 환경 변수 3개 모두 설정했는지 확인
2. NEXTAUTH_URL이 실제 배포 URL과 일치하는지 확인
3. 재배포 실행

### 문제 3: 로그인 안 됨

**증상:** 로그인 버튼 클릭 시 에러

**해결:**
1. NEXTAUTH_SECRET이 설정되었는지 확인
2. NEXTAUTH_URL이 정확한지 확인
3. 브라우저 개발자 도구 콘솔 확인 (F12)

### 문제 4: 데이터베이스 에러

**증상:** "Prisma Error" 또는 "Database Error"

**해결:**
1. DATABASE_URL이 정확한지 확인
2. Prisma 스키마가 최신인지 확인
3. 로컬에서 `npx prisma generate` 실행 후 푸시

---

## 🎯 추가 설정 (선택)

### 커스텀 도메인 연결

1. **Vercel 대시보드에서**
   - 프로젝트 선택
   - "Settings" → "Domains"
   - "Add" 클릭

2. **도메인 입력**
   - 예: `academy.example.com`
   - DNS 설정 안내 따라하기

### 성능 모니터링

Vercel이 자동으로 제공:
- ✅ 응답 시간 분석
- ✅ 에러 추적
- ✅ 트래픽 통계

대시보드 "Analytics" 탭에서 확인

---

## 📚 유용한 링크

- **Vercel 대시보드**: https://vercel.com/dashboard
- **배포 문서**: https://vercel.com/docs
- **Next.js 문서**: https://nextjs.org/docs
- **Prisma 문서**: https://www.prisma.io/docs

---

## 💡 팁

### 빠른 재배포
```bash
# 변경사항을 빠르게 배포
git add .
git commit -m "빠른 수정"
git push
```

### 배포 롤백
Vercel 대시보드에서:
1. "Deployments" 탭
2. 이전 버전 선택
3. "Promote to Production" 클릭

### 환경 변수 추가
새 환경 변수 추가 후:
1. Settings → Environment Variables
2. 새 변수 추가
3. **반드시 재배포!**

---

## 🎉 완료!

이제 학원 학습 관리 시스템이 온라인으로 실행 중입니다!

**최종 URL:**
```
https://your-project.vercel.app
```

학원장 계정을 생성하고 학생들을 관리할 수 있습니다!

---

## 📞 도움이 필요하신가요?

- Vercel 서포트: https://vercel.com/support
- GitHub Issues: 저장소의 Issues 탭
- 이메일: 프로젝트 관리자에게 문의

---

**마지막 업데이트:** 2026-01-18  
**작성자:** AI Assistant  
**프로젝트:** Smart Academy Learning Management System
