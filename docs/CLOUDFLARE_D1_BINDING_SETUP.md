# 🔧 Cloudflare Pages D1 데이터베이스 바인딩 설정 가이드

## 🚨 현재 문제

회원가입/로그인 API에서 500 에러 발생:
```
Failed to load resource: the server responded with a status of 500 ()
```

**원인**: Cloudflare Pages에서 D1 데이터베이스 바인딩이 제대로 연결되지 않음

---

## ✅ 해결 방법: Cloudflare Pages에서 D1 바인딩 추가

### 1단계: Cloudflare Dashboard 접속

1. **URL**: https://dash.cloudflare.com
2. **계정 로그인**
3. **Workers & Pages** 메뉴 클릭
4. **`superplacestudy`** 프로젝트 선택

---

### 2단계: Settings에서 D1 바인딩 추가

1. **Settings** 탭 클릭
2. 왼쪽 메뉴에서 **Functions** 클릭
3. **D1 database bindings** 섹션 찾기
4. **Add binding** 버튼 클릭

---

### 3단계: D1 바인딩 설정

다음 정보를 입력:

| 필드 | 값 |
|------|-----|
| **Variable name** | `DB` |
| **D1 database** | `superplace-db` 선택 |

**중요**: 
- Variable name은 **반드시** `DB`로 설정 (대문자)
- D1 database는 드롭다운에서 `superplace-db` 선택

---

### 4단계: Production 및 Preview 환경 모두 설정

#### Production 환경
1. **Production** 탭에서 위의 바인딩 추가
2. **Save** 버튼 클릭

#### Preview 환경 (선택사항)
1. **Preview** 탭에서도 동일하게 바인딩 추가
2. **Save** 버튼 클릭

---

### 5단계: 재배포

바인딩을 추가한 후 프로젝트를 재배포해야 합니다:

**방법 1: Git Push로 자동 배포**
```bash
# 아무 파일이나 수정 후 커밋
git commit --allow-empty -m "trigger: Redeploy after D1 binding setup"
git push origin main
```

**방법 2: Cloudflare Dashboard에서 수동 재배포**
1. **Deployments** 탭 클릭
2. 최신 배포의 **...** 메뉴 클릭
3. **Retry deployment** 선택

---

## 🔍 D1 데이터베이스 정보

### 현재 설정 (wrangler.toml)
```toml
[[d1_databases]]
binding = "DB"
database_name = "superplace-db"
database_id = "8c106540-21b4-4fa9-8879-c4956e459ca1"
```

### D1 데이터베이스 확인 방법

1. **Cloudflare Dashboard** → **Workers & Pages**
2. 왼쪽 메뉴에서 **D1** 클릭
3. **`superplace-db`** 데이터베이스 선택 (ID: `8c106540-21b4-4fa9-8879-c4956e459ca1`)
4. **Console** 탭에서 SQL 쿼리 실행 가능

### 데이터베이스 테이블 확인 SQL
```sql
-- 모든 테이블 목록 확인
SELECT name FROM sqlite_master WHERE type='table';

-- users 테이블 확인
SELECT COUNT(*) as count FROM users;

-- academy 테이블 확인
SELECT COUNT(*) as count FROM academy;

-- students 테이블 확인
SELECT COUNT(*) as count FROM students;
```

---

## 🧪 바인딩 설정 후 테스트

### 1. 배포 완료 확인 (5-10분 소요)
- Cloudflare Dashboard → **Deployments** 탭
- 최신 배포 상태가 **Success**인지 확인

### 2. 회원가입 API 테스트
```bash
# 브라우저 콘솔 (F12)에서 실행
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
.then(console.log)
.catch(console.error);
```

**기대 결과**:
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다",
  "user": { ... },
  "academyCode": "ABC12345"
}
```

**실패 시 예상 에러 메시지**:
```json
{
  "success": false,
  "message": "데이터베이스가 연결되지 않았습니다",
  "info": "DB binding is not configured. Check wrangler.toml and Cloudflare Pages settings."
}
```

---

## 📋 체크리스트

### D1 바인딩 설정 확인
- [ ] Cloudflare Dashboard → Workers & Pages → `superplacestudy` 접속
- [ ] Settings → Functions → D1 database bindings 확인
- [ ] Variable name: `DB` 설정됨
- [ ] D1 database: `superplace-db` 선택됨
- [ ] Production 환경에 바인딩 추가됨
- [ ] Preview 환경에 바인딩 추가됨 (선택사항)
- [ ] 프로젝트 재배포 완료

### 테스트 확인
- [ ] 배포 완료 (Deployments 탭에서 Success 확인)
- [ ] 회원가입 API 테스트 성공
- [ ] 로그인 API 테스트 성공
- [ ] 대시보드 접속 성공

---

## 🔍 추가 디버깅 방법

### Cloudflare Logs 확인
1. **Cloudflare Dashboard** → **Workers & Pages**
2. **`superplacestudy`** 프로젝트 선택
3. **Logs** 탭 클릭
4. 실시간 로그 확인

### 에러 메시지 종류

#### 1. "Request context not available"
→ `getRequestContext()` 함수가 작동하지 않음
→ API 코드 수정 필요 (이미 수정됨)

#### 2. "DB binding is not configured"
→ D1 바인딩이 설정되지 않음
→ 위의 "해결 방법" 섹션 참조

#### 3. "Failed to ensure tables"
→ 테이블 생성 중 SQL 오류
→ D1 콘솔에서 수동으로 테이블 생성 필요

---

## 🎯 바인딩 설정 스크린샷 가이드

### Settings → Functions → D1 database bindings 화면에서:

```
┌─────────────────────────────────────────┐
│ D1 database bindings                     │
├─────────────────────────────────────────┤
│ Variable name: DB                        │
│ D1 database:   superplace-db ▼          │
│                                          │
│ [Add binding]                            │
└─────────────────────────────────────────┘
```

---

## ✅ 최종 확인

바인딩 설정 후:
1. ✅ 프로젝트 재배포 완료
2. ✅ 회원가입 API 200 OK
3. ✅ 로그인 API 200 OK
4. ✅ 대시보드 정상 작동

---

## 📞 문제 지속 시

위의 모든 단계를 완료했는데도 500 에러가 지속되면:

1. **브라우저 콘솔 (F12)** → Network 탭에서 API 응답 확인
2. **Cloudflare Logs** 확인
3. 에러 메시지를 복사해서 알려주세요
4. 다음 정보도 함께 제공:
   - D1 바인딩 설정 스크린샷
   - 배포 상태 (Success/Failed)
   - 정확한 에러 메시지

---

**이 가이드를 따라 D1 바인딩을 설정하면 회원가입/로그인 API가 정상 작동합니다!** ✨
