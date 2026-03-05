# 🔍 D1_ERROR 해결 보고서

## 📋 요약

**문제**: `D1_ERROR: table BotPurchaseRequest has no column named email: SQLITE_ERROR`  
**원인**: `CREATE TABLE IF NOT EXISTS`는 기존 테이블에 컬럼을 추가하지 않음  
**해결책**: D1 콘솔 또는 관리자 API를 통한 수동 마이그레이션 필요  
**소요 시간**: 약 3분  
**상태**: ⚠️ **사용자 조치 필요**

---

## 🔍 문제 분석

### 발생 위치
```
POST https://superplacestudy.pages.dev/api/bot-purchase-requests/create
→ 500 Internal Server Error
→ D1_ERROR: table BotPurchaseRequest has no column named email
```

### 기술적 원인

SQLite의 `CREATE TABLE IF NOT EXISTS` 구문은:
- ✅ 테이블이 없으면 생성
- ❌ 테이블이 있으면 아무것도 하지 않음
- ❌ 기존 테이블에 새 컬럼을 추가하지 않음

따라서 코드에서 email, name, requestAcademyName, phoneNumber 컬럼을 포함한 CREATE문을 작성해도, **기존 테이블이 이미 존재하면 새 컬럼이 추가되지 않습니다**.

### 코드 변경 내역

**✅ 완료된 작업:**

1. **create.ts 수정** (commit `7cf5e4a`)
   - 자동 마이그레이션 로직 추가
   - 4개 컬럼 자동 추가 시도
   - 하지만 D1의 제약으로 인해 작동하지 않음

2. **테이블 스키마 업데이트**
   ```sql
   ALTER TABLE BotPurchaseRequest ADD COLUMN email TEXT;
   ALTER TABLE BotPurchaseRequest ADD COLUMN name TEXT;
   ALTER TABLE BotPurchaseRequest ADD COLUMN requestAcademyName TEXT;
   ALTER TABLE BotPurchaseRequest ADD COLUMN phoneNumber TEXT;
   ```

3. **문서화**
   - `MANUAL_MIGRATION_GUIDE.md` - 상세 마이그레이션 가이드
   - `verify-purchase-migration.js` - 실시간 검증 스크립트
   - `test-purchase-with-migration.js` - 자동화 테스트

---

## ✅ 해결 방법

### 방법 1: Cloudflare D1 콘솔 (권장)

**장점:**
- ✅ 가장 안전하고 직관적
- ✅ 관리자 권한 불필요
- ✅ 즉시 적용 가능

**단계:**

1. **Cloudflare Dashboard 접속**
   ```
   https://dash.cloudflare.com
   ```

2. **Workers & Pages → superplacestudy 선택**

3. **Settings → Bindings → D1 Database**
   - "Open D1 console" 버튼 클릭

4. **SQL 실행 (4개 명령)**
   ```sql
   ALTER TABLE BotPurchaseRequest ADD COLUMN email TEXT;
   ALTER TABLE BotPurchaseRequest ADD COLUMN name TEXT;
   ALTER TABLE BotPurchaseRequest ADD COLUMN requestAcademyName TEXT;
   ALTER TABLE BotPurchaseRequest ADD COLUMN phoneNumber TEXT;
   ```

   💡 **Tip**: "duplicate column name" 오류가 나면 해당 컬럼은 이미 존재하는 것이므로 무시하고 다음 명령 실행

5. **검증**
   ```sql
   PRAGMA table_info(BotPurchaseRequest);
   ```
   
   다음 컬럼들이 표시되어야 함:
   - `email`
   - `name`
   - `requestAcademyName`
   - `phoneNumber`

---

### 방법 2: 관리자 API

**전제조건:**
- SUPER_ADMIN 또는 ADMIN 권한
- 로그인 상태

**실행 코드:**
```javascript
// 브라우저 콘솔 (F12)에서 실행
fetch('https://superplacestudy.pages.dev/api/admin/migrate-bot-purchase-table', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('Migration result:', data);
  if (data.success) {
    alert('✅ 마이그레이션 성공!');
    location.reload();
  } else {
    alert('❌ 실패: ' + data.error);
  }
});
```

---

## 🧪 테스트 방법

### 자동 테스트 스크립트
```bash
cd /home/user/webapp

# 1. 마이그레이션 가이드 및 실시간 테스트
node verify-purchase-migration.js

# 2. 마이그레이션 후 재검증
node test-purchase-with-migration.js
```

### 수동 테스트

**1. 구매 신청 테스트**
```
URL: https://superplacestudy.pages.dev/store
```

1. AI 봇 선택 (예: 수학 PDF 테스트 봇)
2. 구매 정보 입력:
   - ✉️ 이메일: `test@academy.com`
   - 👤 이름: `홍길동`
   - 🏫 학원명: `테스트 학원`
   - 📞 연락처: `010-1234-5678`
   - 👥 학생 수: `10명`
   - 📅 개월 수: `12개월`
3. "구매 신청" 버튼 클릭
4. ✅ **성공 메시지 확인**

**2. 승인 페이지 검증**
```
URL: https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals
```

1. 관리자로 로그인
2. 구매 신청 목록에서 방금 생성한 신청 찾기
3. 다음 정보가 모두 표시되는지 확인:
   - ✅ 이메일: test@academy.com
   - ✅ 이름: 홍길동
   - ✅ 학원명: 테스트 학원
   - ✅ 연락처: 010-1234-5678
   - ✅ 학생 수: 10명
   - ✅ 기간: 12개월
   - ✅ 총액: 120,000원

---

## 📊 예상 결과

### ✅ 마이그레이션 성공 시

**API 응답:**
```json
{
  "success": true,
  "message": "BotPurchaseRequest table migration completed",
  "results": [
    {
      "step": "Add email column",
      "success": true
    },
    {
      "step": "Add name column",
      "success": true
    },
    {
      "step": "Add requestAcademyName column",
      "success": true
    },
    {
      "step": "Add phoneNumber column",
      "success": true
    }
  ]
}
```

**구매 신청 응답:**
```json
{
  "success": true,
  "requestId": "bpr_1709703709123_abc12345",
  "message": "Purchase request submitted successfully"
}
```

### ❌ 마이그레이션 전 (현재 상태)

**API 응답:**
```json
{
  "error": "Failed to create request",
  "message": "D1_ERROR: table BotPurchaseRequest has no column named email: SQLITE_ERROR"
}
```

---

## 🔗 관련 링크

| 항목 | URL |
|------|-----|
| 🛍️ 구매 페이지 | https://superplacestudy.pages.dev/store |
| ✅ 승인 관리 | https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals |
| 💾 D1 콘솔 | https://dash.cloudflare.com/ |
| 📦 GitHub | https://github.com/kohsunwoo12345-cmyk/superplace |

---

## 📝 체크리스트

마이그레이션 완료 후 다음을 확인하세요:

- [ ] D1 콘솔에서 4개 컬럼 추가 완료
- [ ] `PRAGMA table_info(BotPurchaseRequest)` 실행하여 컬럼 존재 확인
- [ ] 구매 신청 페이지에서 테스트 구매 진행
- [ ] "구매 신청이 성공적으로 제출되었습니다" 메시지 확인
- [ ] 관리자 승인 페이지에서 신청 내역 확인
- [ ] 이메일, 이름, 학원명, 연락처가 모두 표시되는지 확인
- [ ] 승인 처리 테스트
- [ ] 학원에 봇이 정상 할당되는지 확인
- [ ] 학생이 봇을 사용할 수 있는지 확인

---

## 🎯 다음 단계

### 1단계: 마이그레이션 실행 ⚠️ **현재 단계**
- **방법 1** 또는 **방법 2** 선택하여 실행
- 약 3분 소요

### 2단계: 검증
```bash
node verify-purchase-migration.js
```

### 3단계: 전체 플로우 테스트
1. 외부 사용자 구매 신청
2. 관리자 승인
3. 학원에 봇 할당
4. 학생이 봇 사용

### 4단계: 완료 확인 ✅
- 모든 구매 신청이 정상 처리됨
- 승인 페이지에 모든 필드 표시됨
- 봇 사용이 정상 작동함

---

## 💡 Troubleshooting

### Q: "Unauthorized" 오류 발생
**A**: 관리자 계정으로 로그인했는지 확인. SUPER_ADMIN 또는 ADMIN 권한 필요.

### Q: "duplicate column name" 오류
**A**: 정상. 해당 컬럼은 이미 존재. 다음 컬럼 추가 계속 진행.

### Q: 마이그레이션 후에도 같은 오류
**A**: 
1. Cloudflare Pages 배포 완료 대기 (1-2분)
2. 브라우저 캐시 클리어 (Ctrl+Shift+R)
3. D1 콘솔에서 `PRAGMA table_info` 재확인

### Q: D1 콘솔을 찾을 수 없음
**A**:
1. Cloudflare Dashboard 접속
2. Workers & Pages 선택
3. superplacestudy 프로젝트 선택
4. Settings 탭
5. Bindings 섹션 스크롤
6. D1 Database 항목 → "Open D1 console"

---

## 📄 관련 파일

| 파일 | 설명 |
|------|------|
| `functions/api/bot-purchase-requests/create.ts` | 구매 신청 API |
| `functions/api/admin/bot-purchase-requests/list.ts` | 승인 목록 API |
| `functions/api/admin/migrate-bot-purchase-table.ts` | 마이그레이션 API |
| `MANUAL_MIGRATION_GUIDE.md` | 상세 마이그레이션 가이드 |
| `verify-purchase-migration.js` | 실시간 검증 스크립트 |
| `test-purchase-with-migration.js` | 자동화 테스트 |

---

**작성일**: 2026-03-05 17:32 KST  
**Git Commit**: be33e0a  
**상태**: ⚠️ **D1 마이그레이션 실행 필요**  

---

**👤 다음 조치**: Cloudflare D1 콘솔에서 위의 ALTER TABLE 명령 4개를 실행해주세요.
