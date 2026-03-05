# 🔧 D1 Database 마이그레이션 실행 가이드

**문제**: `D1_ERROR: table BotPurchaseRequest has no column named email`

**원인**: `CREATE TABLE IF NOT EXISTS`는 기존 테이블이 있으면 스키마를 업데이트하지 않음

**해결**: ALTER TABLE로 컬럼 추가

---

## 🚀 즉시 실행 (권장)

### 방법 1: 브라우저에서 API 직접 호출

1. **관리자 계정으로 로그인**:
   ```
   URL: https://superplacestudy.pages.dev/login
   ```

2. **브라우저 개발자 도구 열기**:
   ```
   Windows/Linux: F12 또는 Ctrl+Shift+I
   Mac: Cmd+Option+I
   ```

3. **Console 탭에서 다음 코드 실행**:
   ```javascript
   // 1. 관리자 토큰 가져오기
   const token = localStorage.getItem('token');
   console.log('토큰:', token);

   // 2. 마이그레이션 API 호출
   fetch('https://superplacestudy.pages.dev/api/admin/migrate-bot-purchase-table', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     }
   })
   .then(res => res.json())
   .then(data => {
     console.log('✅ 마이그레이션 결과:', data);
     if (data.success) {
       alert('✅ 마이그레이션 성공! 구매 신청을 다시 시도하세요.');
     } else {
       alert('❌ 실패: ' + data.error);
     }
   })
   .catch(err => console.error('❌ 오류:', err));
   ```

4. **성공 메시지 확인**:
   ```
   ✅ 마이그레이션 성공! 구매 신청을 다시 시도하세요.
   ```

5. **쇼핑몰에서 구매 신청 재시도**:
   ```
   URL: https://superplacestudy.pages.dev/store
   ```

---

### 방법 2: curl 명령 사용

1. **관리자 토큰 복사**:
   - 로그인 → F12 → Console
   - 실행: `localStorage.getItem('token')`
   - 출력된 토큰 복사

2. **터미널에서 실행**:
   ```bash
   curl -X POST https://superplacestudy.pages.dev/api/admin/migrate-bot-purchase-table \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
     -H "Content-Type: application/json"
   ```

3. **응답 확인**:
   ```json
   {
     "success": true,
     "message": "BotPurchaseRequest table migration completed",
     "results": [...]
   }
   ```

---

### 방법 3: Cloudflare D1 Console (수동)

**배포가 완료될 때까지 기다리고 싶지 않다면**:

1. **Cloudflare Dashboard 접속**:
   ```
   https://dash.cloudflare.com
   ```

2. **D1 Database 열기**:
   ```
   Workers & Pages → superplacestudy → Settings → Bindings → D1 Database
   → "Open D1 console" 클릭
   ```

3. **SQL 실행**:
   ```sql
   -- 현재 컬럼 확인
   PRAGMA table_info(BotPurchaseRequest);
   
   -- 컬럼 추가 (email이 없는 경우만)
   ALTER TABLE BotPurchaseRequest ADD COLUMN email TEXT;
   ALTER TABLE BotPurchaseRequest ADD COLUMN name TEXT;
   ALTER TABLE BotPurchaseRequest ADD COLUMN requestAcademyName TEXT;
   ALTER TABLE BotPurchaseRequest ADD COLUMN phoneNumber TEXT;
   
   -- 최종 확인
   PRAGMA table_info(BotPurchaseRequest);
   ```

4. **결과 확인**:
   ```
   컬럼 목록에 email, name, requestAcademyName, phoneNumber 포함 확인
   ```

---

## 🧪 마이그레이션 확인

### 1. 컬럼 추가 확인

**Cloudflare D1 Console**:
```sql
PRAGMA table_info(BotPurchaseRequest);
```

**예상 출력** (일부):
```
cid | name                  | type    | notnull | dflt_value | pk
----|----------------------|---------|---------|------------|----
... | email                | TEXT    | 0       | NULL       | 0
... | name                 | TEXT    | 0       | NULL       | 0
... | requestAcademyName   | TEXT    | 0       | NULL       | 0
... | phoneNumber          | TEXT    | 0       | NULL       | 0
```

### 2. 구매 신청 테스트

1. 로그아웃 (시크릿 모드 권장)
2. https://superplacestudy.pages.dev/store 접속
3. AI 봇 선택 → "구매하기"
4. 필수 정보 입력:
   ```
   이메일: test@example.com
   이름: 홍길동
   학원 이름: 테스트 학원
   연락처: 010-1234-5678
   ```
5. "구매 신청하기" 클릭
6. ✅ "구매 신청이 완료되었습니다!" 메시지 확인

### 3. 데이터베이스 확인

**Cloudflare D1 Console**:
```sql
SELECT 
  id,
  email,
  name,
  requestAcademyName,
  phoneNumber,
  studentCount,
  months,
  status,
  createdAt
FROM BotPurchaseRequest
ORDER BY createdAt DESC
LIMIT 1;
```

**예상 결과**:
```
email: test@example.com
name: 홍길동
requestAcademyName: 테스트 학원
phoneNumber: 010-1234-5678
status: PENDING
```

### 4. 승인 페이지 확인

1. 관리자 로그인
2. https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals
3. 최신 신청 확인:
   ```
   신청자 정보:
   - 이름: 홍길동 ✅
   - 이메일: test@example.com ✅
   - 학원: 테스트 학원 ✅
   - 연락처: 010-1234-5678 ✅
   ```

---

## ⚠️ 문제 해결

### 문제 1: "Unauthorized" 오류

**원인**: 관리자 토큰이 만료되었거나 유효하지 않음

**해결**:
1. 로그아웃 → 재로그인
2. 새 토큰 복사
3. 마이그레이션 재실행

### 문제 2: "Admin permission required" 오류

**원인**: 현재 계정이 관리자가 아님

**해결**:
1. ADMIN 또는 SUPER_ADMIN 계정으로 로그인
2. 마이그레이션 재실행

### 문제 3: "duplicate column name" 오류

**원인**: 컬럼이 이미 추가됨

**해결**:
- ✅ 정상 (이미 마이그레이션 완료)
- 구매 신청 테스트 진행

### 문제 4: 여전히 "no column named email" 오류

**원인**: 
- 배포가 완료되지 않음 (마이그레이션 API가 아직 배포 안 됨)
- 또는 마이그레이션이 실패함

**해결**:
1. 5분 대기 (배포 완료 시간)
2. 마이그레이션 API 재호출
3. 실패 시 Cloudflare D1 Console에서 수동 실행 (방법 3)

---

## 📊 타임라인

| 시간 | 작업 | 상태 |
|------|------|------|
| 05:30 | 마이그레이션 API 커밋 | ✅ 완료 |
| 05:35 | Cloudflare Pages 배포 시작 | ⏳ 진행 중 |
| 05:40 | 배포 완료 예상 | ⏳ 대기 |
| 05:41 | 마이그레이션 API 호출 가능 | 📋 준비 |
| 05:42 | 구매 신청 테스트 | 📋 준비 |

---

## ✅ 최종 체크리스트

- [ ] 1. 마이그레이션 API 호출 (방법 1, 2, 또는 3)
- [ ] 2. `PRAGMA table_info` 실행 → 4개 컬럼 확인
- [ ] 3. 쇼핑몰에서 구매 신청
- [ ] 4. ✅ "구매 신청이 완료되었습니다!" 확인
- [ ] 5. D1에서 데이터 확인
- [ ] 6. 승인 페이지에서 정보 표시 확인

---

## 🎯 요약

**문제**: D1 테이블에 email 컬럼 없음  
**원인**: CREATE TABLE IF NOT EXISTS는 기존 테이블 스킵  
**해결**: ALTER TABLE로 컬럼 추가  

**즉시 실행**:
```javascript
// 브라우저 Console (F12)
fetch('https://superplacestudy.pages.dev/api/admin/migrate-bot-purchase-table', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
}).then(res => res.json()).then(console.log);
```

**성공 후**: 쇼핑몰에서 구매 신청 재시도 ✅

---

**작성일**: 2026-03-05 05:32 KST  
**커밋**: `1d2455d`  
**배포 예상**: 05:35 ~ 05:40 KST
