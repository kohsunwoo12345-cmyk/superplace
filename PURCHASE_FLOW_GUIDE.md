# 🛒 AI 쇼핑몰 구매 승인 시스템 최종 가이드

**작성일**: 2026-03-05  
**배포 상태**: ✅ 커밋 완료 (`b1cef52`)  
**Cloudflare 배포**: ⏳ 진행 중 (5-10분 소요)

---

## 🎯 수정 완료 항목

### ✅ 1. 외부 사용자 구매 허용
**문제**: 로그인하지 않은 사용자가 쇼핑몰에서 구매 신청을 할 수 없었음

**해결**:
- `functions/api/bot-purchase-requests/create.ts` 수정
- Authorization 헤더 선택 사항으로 변경
- 토큰 없으면 `userId='external-user'`, `academyId='external'`로 저장
- 관리자가 승인 시 실제 academyId 지정

### ✅ 2. 데이터베이스 스키마 수정
**문제**: 구매 폼 입력 정보가 DB에 저장되지 않음

**해결**:
- `email`, `name`, `requestAcademyName`, `phoneNumber` 컬럼 추가
- INSERT 문에서 올바른 컬럼명 사용

### ✅ 3. 관리자 승인 페이지 접근
**문제**: 사이드바에 승인 페이지 메뉴 없음

**해결**:
- 확인 결과: 이미 추가되어 있음
- 위치: "AI쇼핑몰 제품 추가" 바로 아래

---

## 📝 전체 플로우 가이드

### 🛍️ 1단계: 외부 사용자 구매 신청

**URL**: https://superplacestudy.pages.dev/store

1. **로그인 불필요** - 누구나 접근 가능
2. AI 봇 제품 선택
3. "구매하기" 클릭
4. 필수 정보 입력:
   ```
   학생 수: 10명
   이용 기간: 12개월
   이메일: customer@academy.com ✅
   이름: 홍길동 ✅
   학원 이름: 슈퍼플레이스 학원 ✅
   연락처: 010-1234-5678 ✅
   요청사항: (선택)
   ```
5. "구매 신청하기" 클릭
6. ✅ "구매 신청이 완료되었습니다!" 메시지 확인

---

### 👨‍💼 2단계: 관리자 승인 처리

**URL**: https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals

1. 관리자 계정으로 로그인
2. 왼쪽 사이드바 → **"쇼핑몰 승인 관리"** 클릭
3. 대기 중인 신청 확인:
   
   | 상태 | 제품 | 신청자 정보 | 학원 | 학생 수 | 총 금액 |
   |------|------|------------|------|---------|---------|
   | 🟡 대기중 | AI 수학 봇 | 홍길동<br>customer@academy.com<br>010-1234-5678 | 슈퍼플레이스 학원 | 10명 | ₩120,000 |

4. "상세" 버튼 클릭
5. **중요**: 외부 구매이므로 **academyId를 실제 학원 ID로 지정**
   ```
   academyId 입력: academy-1771479246368-5viyubmqk
   (또는 드롭다운에서 학원 선택)
   ```
6. 학생 수 확인/수정 (필요시)
   ```
   신청: 10명
   승인: 10명 (또는 8명으로 조정)
   ```
7. "승인" 버튼 클릭
8. ✅ "승인되었습니다!" 메시지 확인

---

### 📊 3단계: 구독 생성 확인

**Cloudflare D1 Database**에서 확인:

```sql
SELECT 
  id,
  academyId,
  productId,
  productName,
  totalStudentSlots,
  usedStudentSlots,
  remainingStudentSlots,
  subscriptionStart,
  subscriptionEnd
FROM AcademyBotSubscription
WHERE academyId = 'academy-1771479246368-5viyubmqk'
ORDER BY createdAt DESC
LIMIT 1;
```

**예상 결과**:
```
academyId: academy-1771479246368-5viyubmqk
productId: bot-1772458232285-1zgtygvh1
totalStudentSlots: 10
usedStudentSlots: 0
remainingStudentSlots: 10
subscriptionEnd: 2027-03-05 (현재 날짜 + 12개월)
```

---

### 👨‍🏫 4단계: 학원장 봇 할당

**URL**: https://superplacestudy.pages.dev/dashboard/admin/ai-bots/assign

1. 학원장 계정으로 로그인 (academyId가 일치하는 계정)
2. 왼쪽 사이드바 → "AI 봇 할당하기" 클릭
3. 봇 선택: "AI 수학 봇"
4. 학생 선택: 실제 학생 선택 (예: user-1771479246368-du957iw33)
5. ⚠️ **기간 입력 필드 없음** - 자동으로 학원 구독 기간 사용
6. "할당" 버튼 클릭
7. ✅ "AI 봇이 성공적으로 할당되었습니다" 메시지 확인
8. ✅ "학원 구독 기간: ~ 2027-03-05" 메시지 확인

---

### 🎓 5단계: 학생 봇 사용

**URL**: https://superplacestudy.pages.dev/ai-chat

1. 학생 계정으로 로그인
   ```
   URL: https://superplacestudy.pages.dev/student-login
   전화번호: 학생 전화번호
   비밀번호: 학생 비밀번호
   ```

2. AI 채팅 페이지 자동 이동 또는:
   ```
   메뉴 → "AI 도우미" 클릭
   ```

3. ✅ 봇 목록에서 "AI 수학 봇" 표시 확인

4. 봇 선택 후 메시지 전송:
   ```
   입력: 안녕하세요
   전송 버튼 클릭
   ```

5. ✅ 봇 응답 확인:
   ```
   AI: 안녕하세요! 무엇을 도와드릴까요?
   ```

---

### 🔒 6단계: 권한 체크 확인

#### ✅ 정상 케이스
- 학생이 할당받은 봇만 목록에 표시됨
- 메시지 전송 시 정상 응답
- 채팅 기록 저장됨

#### ❌ 비정상 케이스 (차단되어야 함)

**A. 할당받지 않은 봇**
```
결과: 봇 목록에 표시 안 됨
```

**B. 구독 만료된 봇**
```sql
-- D1 DB에서 만료일을 과거로 변경
UPDATE AcademyBotSubscription
SET subscriptionEnd = '2025-01-01T00:00:00Z'
WHERE academyId = 'academy-xxx';
```
```
결과: 
- 봇 목록에서 사라짐
- 메시지 전송 시 "구독이 만료되었습니다" 오류
```

**C. 학생 슬롯 초과**
```
학원 구독: 10명
할당된 학생: 12명
```
```
결과:
- 할당 순서(startDate) 기준으로 최신 2명은 접근 불가
- "남은 슬롯이 없습니다" 오류
```

---

## 🧪 테스트 체크리스트

### □ 1. 구매 신청 테스트
- [ ] 로그인 없이 쇼핑몰 접속
- [ ] 구매 폼 작성 (이메일, 이름, 학원명, 연락처)
- [ ] "구매 신청하기" 버튼 클릭
- [ ] ✅ 성공 메시지 표시

### □ 2. 승인 페이지 테스트
- [ ] 관리자 로그인
- [ ] 사이드바 → "쇼핑몰 승인 관리" 메뉴 확인
- [ ] 대기 중인 신청 목록 표시 확인
- [ ] 신청자 정보 모두 표시 확인 (이메일, 이름, 학원명, 연락처)

### □ 3. 승인 처리 테스트
- [ ] "상세" 버튼 클릭
- [ ] academyId 입력/선택
- [ ] 학생 수 확인/수정
- [ ] "승인" 버튼 클릭
- [ ] ✅ 성공 메시지 표시

### □ 4. 구독 생성 테스트
- [ ] D1 Database에서 AcademyBotSubscription 확인
- [ ] totalStudentSlots = 승인한 학생 수
- [ ] subscriptionEnd = 승인일 + N개월
- [ ] isActive = 1 (또는 null)

### □ 5. 봇 할당 테스트
- [ ] 학원장 로그인
- [ ] 봇 할당 페이지 이동
- [ ] 봇 선택, 학생 선택
- [ ] ⚠️ 기간 입력 필드 없음 확인
- [ ] "할당" 버튼 클릭
- [ ] ✅ 성공 메시지 & 학원 구독 기간 표시 확인

### □ 6. 학생 봇 사용 테스트
- [ ] 학생 로그인
- [ ] AI 채팅 페이지 이동
- [ ] 할당받은 봇 목록 표시 확인
- [ ] 봇 선택 & 메시지 전송
- [ ] ✅ 봇 응답 수신 확인

### □ 7. 권한 차단 테스트
- [ ] 할당받지 않은 봇: 목록에 표시 안 됨
- [ ] 구독 만료: 봇 목록에서 사라짐
- [ ] 슬롯 초과: "남은 슬롯 없음" 오류

---

## ⚠️ 중요 알림

### 🕐 배포 완료 시간
- **커밋 시간**: 2026-03-05 05:23 KST
- **배포 예상**: 05:30 ~ 05:35 KST
- **테스트 가능**: 배포 완료 후 (약 5-10분 소요)

### 🔄 캐시 클리어
구매 신청이 여전히 실패하면:
```
1. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
2. 시크릿 모드로 재시도
3. 다른 브라우저로 재시도
```

### 📞 문제 발생 시
1. **구매 신청 실패**:
   - Cloudflare Pages 배포 완료 확인
   - 5-10분 후 재시도
   - 브라우저 캐시 클리어

2. **승인 페이지에 신청 안 보임**:
   - D1 Database에서 BotPurchaseRequest 테이블 확인
   - status = 'PENDING' 확인

3. **학생이 봇 못 봄**:
   - ai_bot_assignments 테이블 확인
   - bot-access-check API 응답 확인
   - 학원 구독 만료일 확인

---

## 📊 데이터베이스 쿼리 모음

### 구매 신청 확인
```sql
SELECT * FROM BotPurchaseRequest 
WHERE status = 'PENDING'
ORDER BY createdAt DESC;
```

### 학원 구독 확인
```sql
SELECT * FROM AcademyBotSubscription
WHERE academyId = 'academy-xxx'
ORDER BY createdAt DESC;
```

### 학생 봇 할당 확인
```sql
SELECT * FROM ai_bot_assignments
WHERE academyId = 'academy-xxx'
AND botId = 'bot-xxx'
ORDER BY startDate ASC;
```

### 구독 만료일 수정 (테스트용)
```sql
-- 만료
UPDATE AcademyBotSubscription
SET subscriptionEnd = '2025-01-01T00:00:00Z'
WHERE id = 'subscription-xxx';

-- 복원
UPDATE AcademyBotSubscription
SET subscriptionEnd = '2027-12-31T23:59:59Z'
WHERE id = 'subscription-xxx';
```

---

## 🎯 최종 체크

### ✅ 완료
1. 외부 사용자 구매 허용 (토큰 불필요)
2. DB 스키마 수정 (email, name, requestAcademyName, phoneNumber 추가)
3. 승인 페이지 메뉴 확인
4. 승인 페이지 필드 표시 확인
5. 종단간 테스트 스크립트 작성

### ⏳ 배포 대기 중
- Cloudflare Pages 자동 배포 진행 중
- 예상 완료: 5-10분 이내

### 📝 다음 단계
1. 배포 완료 후 실제 구매 테스트
2. 체크리스트 전 항목 확인
3. 문제 발견 시 즉시 보고

---

**작성자**: GenSpark AI Developer  
**최종 업데이트**: 2026-03-05 05:24 KST  
**커밋**: `b1cef52`  
**배포**: ⏳ 진행 중
