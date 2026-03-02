# 🚀 구독 시스템 빠른 시작 가이드

## ⚡ 5분 안에 테스트하기

### 1단계: 관리자 로그인
1. https://superplacestudy.pages.dev/login 접속
2. 관리자 계정으로 로그인
3. 대시보드 → 학원 관리 이동

### 2단계: 요금제 확인
1. https://superplacestudy.pages.dev/dashboard/admin/pricing 접속
2. 기존 요금제 목록 확인
3. (선택) 새 요금제 생성:
   - 월간: 50,000원
   - 6개월: 270,000원
   - **연간: 480,000원** ✅ (이제 설정 가능!)
   - 학생 한도: 30명
   - 선생님 한도: 5명
   - 기타 한도 설정

### 3단계: 학원에 구독 할당
1. 학원 관리 페이지에서 학원 선택
2. "구독 할당" 버튼 클릭
3. 요금제 선택 (예: 연간 플랜)
4. 시작일 설정
5. 할당 완료 ✅

### 4단계: 학원 상세 정보 확인
1. 학원 이름 클릭 → 상세 페이지
2. **새로 추가된 정보 확인**:
   - 📊 구독 플랜명: "스탠다드 플랜"
   - 📅 구독 상태: active / expired
   - 👥 학생 수: 5 / 30명 (사용량/한도)
   - 👨‍🏫 선생님 수: 2 / 5명
   - 🏫 반 수: 3개
   - 🤖 할당된 봇 수: 2개
   - 📈 각 기능별 사용량
   - ⏰ 남은 기간: X일

### 5단계: 학생 추가 테스트
1. 학생 추가 시도 (구독이 있는 학원)
   - ✅ 성공: 학생 생성 + 사용량 증가
2. 한도 초과 시도 (학생 30명 초과)
   - ❌ 실패: "학생 수 한도를 초과했습니다" 메시지

### 6단계: 봇 할당 테스트
1. https://superplacestudy.pages.dev/dashboard/admin/bot-management 접속
2. "봇 할당" 버튼 클릭
3. 학원 선택 + 봇 선택
4. 할당 완료 ✅
5. 학원장도 자동으로 할당됨 ✅

---

## 📊 주요 변경 사항 (한눈에 보기)

### ✅ 이제 가능합니다:

| 기능 | 이전 | 이후 |
|------|------|------|
| 연간 요금제 설정 | ❌ 불가능 | ✅ 가능 (12개월) |
| 구독 승인 후 활성화 | ❌ 안 됨 | ✅ 즉시 활성화 |
| 학생 추가 (구독 없음) | ⚠️ 추가됨 (버그) | ✅ 차단됨 (정상) |
| 학생 추가 (한도 초과) | ⚠️ 추가됨 (버그) | ✅ 차단됨 (정상) |
| 학원 상세 정보 | ⚠️ 구독 정보 없음 | ✅ 전체 정보 표시 |
| 봇 할당 권한 | ⚠️ 권한 오류 | ✅ 정상 작동 |
| 출석 체크 (만료) | ⚠️ 가능 (버그) | ✅ 차단됨 (정상) |

### 📊 학원 상세 페이지 - 새로운 정보

**이전** (간단한 정보만):
- 학원명
- 학생 수
- 선생님 수

**이후** (완전한 구독 정보):
- 학원명
- **구독 플랜명** 🆕
- **구독 상태** (active/expired/none) 🆕
- **구독 기간** (1/6/12개월) 🆕
- 학생 수 **(사용량/한도)** 🆕
- 선생님 수 **(사용량/한도)** 🆕
- **반 수** 🆕
- **할당된 봇 수** 🆕
- **각 기능별 사용량** 🆕
  - 숙제 검사 (23/100회)
  - AI 분석 (12/50회)
  - AI 채점 (18/100회)
  - 능력 분석 (8/50회)
  - 개념 분석 (6/50회)
  - 유사 문제 (45/100회)
  - 랜딩페이지 (1/3개)
- **결제 정보** 🆕
- **남은 기간** 🆕

---

## 🧪 자동 테스트 실행

터미널에서:
```bash
cd /home/user/webapp
./test-complete-subscription-flow.sh
```

약 30초 후 전체 결과 확인 가능!

---

## ❓ 자주 묻는 질문 (FAQ)

### Q: 구독을 승인했는데 여전히 "구독 없음" 오류가 나옵니다.
**A**: 다음을 확인하세요:
1. 브라우저 새로고침 (F5)
2. 로그아웃 후 재로그인
3. API 응답 확인:
   ```bash
   curl -s "https://superplacestudy.pages.dev/api/subscriptions/status?userId=USER_ID" | jq '.'
   ```
4. user_subscriptions 테이블에서 status='active' 확인

### Q: 학원 상세 페이지에 구독 정보가 안 나옵니다.
**A**: 학원장(DIRECTOR)에게 구독을 할당했는지 확인하세요. 학원이 아닌 학원장 계정에 구독을 할당해야 합니다.

### Q: 봇 할당 페이지에 접근할 수 없습니다.
**A**: 역할이 ADMIN, SUPER_ADMIN, DIRECTOR, TEACHER 중 하나인지 확인하세요.
```javascript
console.log(JSON.parse(localStorage.getItem('user')).role);
```

### Q: 연간 요금제를 설정했는데 적용이 안 됩니다.
**A**: 
1. 요금제 관리 페이지에서 저장 확인
2. 구독 할당 시 "12months" 선택 확인
3. API 응답에서 period 확인:
   ```bash
   curl -s "https://superplacestudy.pages.dev/api/subscriptions/status?userId=USER_ID" | jq '.subscription.period'
   ```

---

## 🔧 문제 해결 (Troubleshooting)

### 학생 추가가 차단됩니다
1. 구독 상태 확인: `status = 'active'`
2. 만료일 확인: `endDate > now`
3. 한도 확인: `usage_students < limit_maxStudents`
4. 학원장 확인: academyId에 DIRECTOR 역할 사용자가 있는지

### API가 401 Unauthorized를 반환합니다
1. 토큰 확인: `localStorage.getItem('token')`
2. 로그아웃 후 재로그인
3. 토큰 만료 확인

### 데이터베이스 오류가 발생합니다
1. 테이블 존재 확인: `user_subscriptions`, `pricing_plans`
2. 컬럼명 확인: `limit_maxStudents`, `usage_students`
3. 서버 로그 확인 (Cloudflare Dashboard)

---

## 📞 지원

자세한 내용은 다음 문서를 참조하세요:
- `SUBSCRIPTION_FIX_COMPLETE.md` - 전체 가이드
- `test-complete-subscription-flow.sh` - 자동 테스트
- `test-subscription-status.sh` - 기본 테스트

---

**마지막 업데이트**: 2026-03-02  
**배포 상태**: ✅ Production (https://superplacestudy.pages.dev)  
**커밋**: f8e6d78, 64e5b1a
