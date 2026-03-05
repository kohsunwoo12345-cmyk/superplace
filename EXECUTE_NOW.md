# 🚨 즉시 실행 가이드: D1 Database 마이그레이션

**문제**: `D1_ERROR: table BotPurchaseRequest has no column named email`

**해결**: Cloudflare D1 Console에서 SQL 실행 (3분 소요)

---

## ⚡ 즉시 실행 (3단계)

### 1️⃣  Cloudflare Dashboard 접속 (30초)

**URL**: https://dash.cloudflare.com

1. 왼쪽 메뉴 → **"Workers & Pages"** 클릭
2. **"superplacestudy"** 프로젝트 클릭
3. 상단 탭 → **"Settings"** 클릭
4. 왼쪽 메뉴 → **"Bindings"** 클릭
5. **"D1 database bindings"** 섹션 찾기
6. DB 이름 오른쪽 → **"Open console"** 버튼 클릭

---

### 2️⃣  SQL 실행 (1분)

**복사할 파일**: `migration.sql`

D1 Console에서 **한 줄씩** 실행:

```sql
-- 현재 구조 확인
PRAGMA table_info(BotPurchaseRequest);

-- 컬럼 추가
ALTER TABLE BotPurchaseRequest ADD COLUMN email TEXT;
ALTER TABLE BotPurchaseRequest ADD COLUMN name TEXT;
ALTER TABLE BotPurchaseRequest ADD COLUMN requestAcademyName TEXT;
ALTER TABLE BotPurchaseRequest ADD COLUMN phoneNumber TEXT;

-- 최종 확인
PRAGMA table_info(BotPurchaseRequest);
```

**성공 확인**:
마지막 PRAGMA 출력에서 다음 컬럼들이 보여야 함:
- ✅ email
- ✅ name
- ✅ requestAcademyName
- ✅ phoneNumber

**⚠️  주의**: `duplicate column name` 오류는 무시 (이미 추가됨)

---

### 3️⃣  구매 신청 테스트 (1분)

1. **쇼핑몰 접속**:
   ```
   https://superplacestudy.pages.dev/store
   ```

2. **AI 봇 선택** → "구매하기" 클릭

3. **정보 입력**:
   ```
   이메일: test@test.com
   이름: 테스트
   학원 이름: 테스트학원
   연락처: 010-0000-0000
   학생 수: 10명
   기간: 12개월
   ```

4. **"구매 신청하기"** 클릭

5. **✅ 성공 메시지 확인**:
   ```
   구매 신청이 완료되었습니다!
   
   총 결제 금액: 120,000원
   
   입금 확인 후 관리자가 승인해드립니다.
   ```

6. **승인 페이지 확인**:
   ```
   https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals
   
   확인 사항:
   ✅ 이메일: test@test.com
   ✅ 이름: 테스트
   ✅ 학원: 테스트학원
   ✅ 연락처: 010-0000-0000
   ✅ 상태: 대기중
   ```

---

## 📊 체크리스트

### ✅ D1 Console SQL 실행
- [ ] Cloudflare Dashboard 접속
- [ ] D1 Console 열기
- [ ] PRAGMA table_info 실행 (실행 전)
- [ ] ALTER TABLE email 실행
- [ ] ALTER TABLE name 실행
- [ ] ALTER TABLE requestAcademyName 실행
- [ ] ALTER TABLE phoneNumber 실행
- [ ] PRAGMA table_info 실행 (실행 후)
- [ ] 4개 컬럼 추가 확인

### ✅ 구매 신청 테스트
- [ ] 쇼핑몰 접속
- [ ] AI 봇 선택
- [ ] 구매 정보 입력
- [ ] 구매 신청 클릭
- [ ] ✅ 성공 메시지 확인

### ✅ 승인 페이지 확인
- [ ] 관리자 로그인
- [ ] 승인 페이지 접속
- [ ] 신청 목록에 표시 확인
- [ ] 이메일 표시 확인
- [ ] 이름 표시 확인
- [ ] 학원명 표시 확인
- [ ] 연락처 표시 확인

---

## 🔍 문제 해결

### Q1: "duplicate column name" 오류
**답변**: ✅ 정상 (이미 컬럼이 추가되어 있음, 무시하고 계속)

### Q2: D1 Console이 안 보여요
**답변**: 
1. Cloudflare 계정 로그인 확인
2. superplacestudy 프로젝트 권한 확인
3. Settings → Bindings → D1 database bindings 섹션 확인

### Q3: 여전히 "no column named email" 오류
**답변**:
1. PRAGMA table_info 실행 → email 컬럼 있는지 확인
2. 없으면 ALTER TABLE 재실행
3. 브라우저 캐시 클리어 (Ctrl+Shift+Delete)
4. 시크릿 모드로 재시도

### Q4: 구매 신청은 성공했는데 승인 페이지에 안 보여요
**답변**:
```sql
-- D1 Console에서 실행
SELECT * FROM BotPurchaseRequest 
WHERE status = 'PENDING' 
ORDER BY createdAt DESC 
LIMIT 5;
```
- 데이터가 있으면: 승인 페이지 새로고침
- 데이터가 없으면: 구매 신청 재시도

---

## 📁 파일 위치

- **SQL 파일**: `migration.sql` (이 저장소 루트)
- **실행 가이드**: `EXECUTE_NOW.md` (이 파일)
- **상세 가이드**: `MIGRATION_GUIDE.md`

---

## ⏱️  예상 소요 시간

| 단계 | 시간 |
|------|------|
| Cloudflare Dashboard 접속 | 30초 |
| D1 Console SQL 실행 | 1분 |
| 구매 신청 테스트 | 1분 |
| 승인 페이지 확인 | 30초 |
| **총 소요 시간** | **3분** |

---

## 🎯 최종 목표

✅ 구매 신청 성공  
✅ 승인 페이지에 고객 정보 표시  
✅ 이메일, 이름, 학원명, 연락처 모두 표시

---

**지금 바로 시작**: https://dash.cloudflare.com

**문제 발생 시**: 이 가이드의 "문제 해결" 섹션 참조
