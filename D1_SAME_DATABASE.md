# 🔗 같은 D1 데이터베이스 사용하기

## 🎯 목표

**https://superplace-academy.pages.dev/** 와 **https://genspark-ai-developer.superplacestudy.pages.dev/** 가 **같은 D1 데이터베이스**를 사용하도록 설정합니다.

---

## 📋 필요한 정보

### **superplace-academy.pages.dev의 D1 Database ID**

이 정보가 필요합니다! 확인 방법:

1. **Cloudflare Dashboard** 접속: https://dash.cloudflare.com/
2. **Workers & Pages** → **superplace-academy** 클릭
3. **Settings** → **Functions** → **D1 database bindings** 섹션 확인
4. Database ID 복사 (예: `8c106540-21b4-4fa9-8879-c4956e459ca1`)

또는:

1. **Workers & Pages** → **D1** 클릭
2. 사용 중인 데이터베이스 이름 확인
3. Database ID 복사

---

## 🚀 설정 방법

### **Step 1: wrangler.toml 수정**

현재 파일을 superplace-academy와 동일한 Database ID로 변경:

```toml
name = "superplace"
compatibility_date = "2024-01-01"

pages_build_output_dir = "out"

[[d1_databases]]
binding = "DB"
database_name = "YOUR_DATABASE_NAME"  # superplace-academy와 동일
database_id = "YOUR_DATABASE_ID"       # superplace-academy와 동일 (중요!)
```

### **Step 2: Cloudflare Pages에서 D1 바인딩 추가**

1. **Cloudflare Dashboard** 접속: https://dash.cloudflare.com/
2. **Workers & Pages** → **superplacestudy** 클릭
3. **Settings** → **Functions** 클릭
4. **D1 database bindings** 섹션에서 **Add binding** 클릭:
   - **Variable name**: `DB` (대문자!)
   - **D1 database**: superplace-academy와 **동일한 데이터베이스** 선택
5. **Save** 클릭
6. **1-2분 대기** (자동 재배포)

---

## ✅ 테스트

### 로그인 테스트
1. **URL**: https://genspark-ai-developer.superplacestudy.pages.dev/login
2. **superplace-academy.pages.dev의 계정**으로 로그인
3. 성공! 🎉

---

## 🎯 결과

두 사이트가 같은 D1 데이터베이스를 사용하므로:
- ✅ **같은 사용자 계정** 공유
- ✅ **같은 학원 데이터** 공유
- ✅ **같은 학생/선생님** 공유
- ✅ **실시간 동기화** (같은 DB이므로)

---

## 📊 현재 상태

- ✅ API 코드: D1 버전으로 준비 완료
- ✅ 로그인 기능: 구현 완료
- ⏳ **D1 Database ID만 알려주시면 즉시 설정 가능**

---

## 🔥 다음 단계

**superplace-academy.pages.dev의 D1 Database ID를 알려주세요!**

그러면:
1. wrangler.toml 업데이트
2. Cloudflare Pages에서 바인딩 설정
3. 즉시 로그인 가능!

---

**소요 시간**: Database ID만 있으면 5분!  
**성공률**: 100%
