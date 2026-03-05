# 🔧 BotPurchaseRequest 테이블 마이그레이션 가이드

## 문제 상황
```
D1_ERROR: table BotPurchaseRequest has no column named email: SQLITE_ERROR
```

## 원인
`CREATE TABLE IF NOT EXISTS`는 기존 테이블을 수정하지 않습니다. 
테이블이 이미 존재하면 새로운 컬럼을 추가하지 않고 스킵합니다.

## 해결 방법 1: Cloudflare D1 콘솔에서 직접 마이그레이션 (권장)

### ✅ 단계별 실행 (약 3분 소요)

#### 1. Cloudflare Dashboard 접속
```
https://dash.cloudflare.com
```

#### 2. Workers & Pages → superplacestudy 선택

#### 3. Settings → Bindings → D1 데이터베이스 찾기
- 데이터베이스 이름 확인 (예: superplace-db)
- "Open D1 console" 버튼 클릭

#### 4. D1 Console에서 SQL 실행

**Step 1: 현재 테이블 구조 확인**
```sql
PRAGMA table_info(BotPurchaseRequest);
```

**Step 2: 누락된 컬럼 추가**
```sql
-- email 컬럼 추가
ALTER TABLE BotPurchaseRequest ADD COLUMN email TEXT;

-- name 컬럼 추가
ALTER TABLE BotPurchaseRequest ADD COLUMN name TEXT;

-- requestAcademyName 컬럼 추가
ALTER TABLE BotPurchaseRequest ADD COLUMN requestAcademyName TEXT;

-- phoneNumber 컬럼 추가
ALTER TABLE BotPurchaseRequest ADD COLUMN phoneNumber TEXT;
```

⚠️ **주의**: "duplicate column name" 오류가 나면 해당 컬럼은 이미 존재하는 것이므로 무시하고 다음 컬럼을 추가하세요.

**Step 3: 마이그레이션 확인**
```sql
PRAGMA table_info(BotPurchaseRequest);
```

다음 컬럼들이 표시되어야 합니다:
- email
- name
- requestAcademyName
- phoneNumber

#### 5. 테스트

**5-1. 구매 신청 테스트**
```
https://superplacestudy.pages.dev/store
```

1. AI 봇 선택 (예: 수학 PDF 테스트 봇)
2. 구매 정보 입력:
   - 이메일: test@test.com
   - 이름: 테스트 사용자
   - 학원명: 테스트 학원
   - 연락처: 010-0000-0000
   - 학생 수: 10명
   - 개월 수: 12개월
3. "구매 신청" 버튼 클릭
4. ✅ 성공 메시지 확인

**5-2. 승인 페이지 확인**
```
https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals
```

1. 관리자로 로그인
2. 방금 신청한 구매 건 확인
3. 다음 정보가 표시되는지 확인:
   - ✅ 이메일: test@test.com
   - ✅ 이름: 테스트 사용자  
   - ✅ 학원명: 테스트 학원
   - ✅ 연락처: 010-0000-0000

---

## 해결 방법 2: 관리자 API로 마이그레이션

### 전제조건
- 관리자(ADMIN 또는 SUPER_ADMIN) 계정 필요
- 로그인 후 localStorage에 토큰 저장되어 있어야 함

### 실행 방법

#### 브라우저 콘솔에서 실행
```javascript
// 1. 관리자로 로그인한 상태에서 F12 → Console 탭
// 2. 다음 코드 붙여넣기 및 실행

fetch('https://superplacestudy.pages.dev/api/admin/migrate-bot-purchase-table', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Migration result:', data);
  if (data.success) {
    alert('✅ 마이그레이션 성공!');
    console.log('Final columns:', data.results[data.results.length-1].columns);
  } else {
    alert('❌ 마이그레이션 실패: ' + data.error);
  }
})
.catch(err => {
  console.error('❌ Error:', err);
  alert('❌ 오류: ' + err.message);
});
```

#### curl로 실행
```bash
# 1. 관리자 토큰 가져오기
TOKEN="your-admin-token-here"

# 2. 마이그레이션 실행
curl -X POST https://superplacestudy.pages.dev/api/admin/migrate-bot-purchase-table \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## 예상 결과

### 성공 시
```json
{
  "success": true,
  "message": "BotPurchaseRequest table migration completed",
  "results": [
    {
      "step": "Check existing columns",
      "columns": ["id", "productId", "productName", ...],
      "success": true
    },
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
    },
    {
      "step": "Final table structure",
      "columns": [..., "email", "name", "requestAcademyName", "phoneNumber"],
      "success": true
    }
  ]
}
```

### 컬럼이 이미 존재하는 경우
```json
{
  "step": "Add email column",
  "success": true,
  "note": "Already exists"
}
```

---

## 트러블슈팅

### Q: "Unauthorized" 오류 발생
**A**: 관리자 계정으로 로그인했는지 확인하세요. SUPER_ADMIN 또는 ADMIN 권한이 필요합니다.

### Q: "duplicate column name" 오류
**A**: 정상입니다. 해당 컬럼은 이미 존재합니다. 다음 컬럼 추가를 계속 진행하세요.

### Q: 마이그레이션 후에도 같은 오류 발생
**A**: 
1. Cloudflare Pages 배포가 완료될 때까지 1-2분 대기
2. 브라우저 캐시 클리어 (Ctrl+Shift+R 또는 Cmd+Shift+R)
3. D1 콘솔에서 `PRAGMA table_info(BotPurchaseRequest);` 실행하여 컬럼 확인

### Q: D1 콘솔을 찾을 수 없음
**A**: 
1. Cloudflare Dashboard → Workers & Pages
2. 프로젝트 선택 (superplacestudy)
3. Settings 탭
4. Bindings 섹션 스크롤
5. D1 데이터베이스 항목 찾기
6. "Open D1 console" 버튼 클릭

---

## 검증 체크리스트

- [ ] D1 콘솔에서 4개 컬럼 추가 완료
- [ ] `PRAGMA table_info` 실행하여 컬럼 확인
- [ ] 구매 신청 페이지에서 테스트 구매 진행
- [ ] 성공 메시지 확인
- [ ] 관리자 승인 페이지에서 이메일, 이름, 학원명, 연락처 표시 확인
- [ ] 승인 처리 후 학원에 봇 할당 확인

---

## 완료 후 확인 사항

✅ **구매 신청 플로우 전체 테스트**

1. **외부 사용자 구매** (https://superplacestudy.pages.dev/store)
   - 로그인 없이 구매 신청 가능
   - 이메일, 이름, 학원명, 연락처 입력
   - 성공 메시지 표시

2. **관리자 승인** (https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals)
   - 구매 신청 목록에 표시
   - 모든 필드 정보 확인 가능
   - 승인 학생 수 조정 가능
   - 학원 선택 및 승인 처리

3. **봇 사용** (https://superplacestudy.pages.dev/ai-chat)
   - 승인된 학원의 학생이 봇 사용 가능
   - 학생 수 제한 적용
   - 구독 기간 제한 적용

---

## 기술 정보

### 추가된 컬럼 스키마
```sql
email TEXT,                  -- 구매자 이메일
name TEXT,                   -- 구매자 이름
requestAcademyName TEXT,     -- 구매 신청 시 입력한 학원명
phoneNumber TEXT             -- 구매자 연락처
```

### 기존 컬럼 (변경 없음)
```sql
id TEXT PRIMARY KEY,
productId TEXT NOT NULL,
productName TEXT NOT NULL,
userId TEXT NOT NULL,
academyId TEXT NOT NULL,
studentCount INTEGER NOT NULL,
months INTEGER NOT NULL,
pricePerStudent INTEGER NOT NULL,
totalPrice INTEGER NOT NULL,
requestMessage TEXT,
status TEXT DEFAULT 'PENDING',
approvedBy TEXT,
approvedAt TEXT,
rejectionReason TEXT,
subscriptionStartDate TEXT,
subscriptionEndDate TEXT,
createdAt TEXT NOT NULL,
updatedAt TEXT NOT NULL
```

---

**📅 작성일**: 2026-03-05  
**👤 작성자**: AI Assistant  
**🔗 관련 파일**: 
- `functions/api/bot-purchase-requests/create.ts`
- `functions/api/admin/bot-purchase-requests/list.ts`
- `functions/api/admin/migrate-bot-purchase-table.ts`
