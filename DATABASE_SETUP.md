# 📊 Cloudflare D1 데이터베이스 설정 가이드

## 🎯 개요
Cloudflare D1은 서버리스 SQLite 데이터베이스입니다.
Static Export와 함께 Cloudflare Functions를 사용하여 API를 만듭니다.

---

## 📋 필수 준비사항

1. **Cloudflare 계정** (이미 있음 ✅)
2. **Wrangler CLI** 설치
3. **GitHub 연동** (이미 완료 ✅)

---

## 🚀 Step-by-Step 설정

### **Step 1: Wrangler CLI로 D1 생성**

터미널에서 실행:

```bash
cd /home/user/webapp
npx wrangler d1 create superplace-db
```

출력 예시:
```
✅ Successfully created DB 'superplace-db'

[[d1_databases]]
binding = "DB"
database_name = "superplace-db"
database_id = "abc123-def456-ghi789"  # 👈 이 ID를 복사!
```

---

### **Step 2: wrangler.toml에 Database ID 입력**

`wrangler.toml` 파일을 열고 `database_id`를 업데이트:

```toml
[[d1_databases]]
binding = "DB"
database_name = "superplace-db"
database_id = "abc123-def456-ghi789"  # Step 1에서 복사한 ID
```

---

### **Step 3: 데이터베이스 스키마 생성**

마이그레이션 실행:

```bash
npx wrangler d1 execute superplace-db --file=./migrations/0001_init.sql
```

성공 메시지:
```
✅ Successfully executed SQL
```

---

### **Step 4: Cloudflare Pages에서 D1 바인딩**

#### **4-1. Cloudflare Dashboard 접속**
👉 https://dash.cloudflare.com/

#### **4-2. 프로젝트 설정**
1. **Workers & Pages** → **superplacestudy** 클릭
2. **Settings** 탭 → **Functions** 섹션
3. **D1 database bindings** 추가:
   - Variable name: `DB`
   - D1 database: `superplace-db` 선택
4. **Save** 클릭

---

### **Step 5: 배포 및 테스트**

#### **5-1. Git 커밋 및 푸시**
```bash
git add -A
git commit -m "feat: Cloudflare D1 데이터베이스 설정"
git push origin genspark_ai_developer
```

#### **5-2. 배포 대기 (2-3분)**

#### **5-3. API 테스트**
배포 후 테스트:
```
https://genspark-ai-developer.superplacestudy.pages.dev/api/test
```

성공 응답:
```json
{
  "success": true,
  "message": "Database connected!",
  "result": { "test": 1 }
}
```

---

## 📁 프로젝트 구조

```
/home/user/webapp/
├── functions/              # Cloudflare Functions (API Routes 대체)
│   └── api/
│       └── test.ts        # 테스트 API
├── migrations/             # D1 마이그레이션
│   └── 0001_init.sql      # 초기 스키마
├── wrangler.toml          # Cloudflare 설정
└── out/                   # 빌드 출력 (Static Export)
```

---

## 🔧 다음 단계

### **Phase 2: 실제 API 구현**

1. **사용자 API**
   - `functions/api/users.ts`
   - 회원가입, 로그인, 프로필

2. **학원 API**
   - `functions/api/academies.ts`
   - 학원 생성, 조회, 수정

3. **학생 API**
   - `functions/api/students.ts`
   - 학생 등록, 조회, 관리

4. **인증 미들웨어**
   - `functions/_middleware.ts`
   - JWT 토큰 검증

---

## 📊 D1 vs PostgreSQL

| 기능 | D1 (SQLite) | PostgreSQL |
|------|-------------|------------|
| 호스팅 | Cloudflare | Neon/Supabase |
| 무료 플랜 | 5GB | 0.5GB (Neon) |
| Prisma 지원 | ❌ | ✅ |
| 글로벌 성능 | ✅ 매우 빠름 | 🔶 지역 제한 |
| SQL 문법 | SQLite | PostgreSQL |

---

## 💡 문제 해결

### **"database_id를 못 찾겠어요"**
```bash
# D1 데이터베이스 목록 확인
npx wrangler d1 list
```

### **"Functions가 작동하지 않아요"**
1. Cloudflare Dashboard에서 D1 바인딩 확인
2. `wrangler.toml`의 database_id 확인
3. 재배포 후 2-3분 대기

### **"로컬에서 테스트하고 싶어요"**
```bash
# 로컬 D1 개발
npx wrangler pages dev out --d1 DB=superplace-db
```

---

## 📞 도움이 필요하면

1. D1 데이터베이스 ID를 알려주세요
2. 에러 메시지를 공유해주세요
3. Cloudflare Dashboard 스크린샷

---

**지금 Step 1부터 시작하세요!** 🚀
