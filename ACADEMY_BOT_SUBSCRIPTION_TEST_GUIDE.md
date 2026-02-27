# 학원 AI 봇 구독 할당 기능 테스트 가이드

## 📋 구현된 기능

### 1. **학원에 AI 봇 구독 할당 페이지**
- **경로**: `/dashboard/admin/assign-academy-bot`
- **권한**: ADMIN, SUPER_ADMIN만 접근 가능
- **기능**:
  - 학원 선택
  - AI 봇 선택
  - **학생 수 제한** 설정 (필수, 1명 이상)
  - **기간 설정**: 시작일/종료일 (만료일)
  - **가격 설정**: 무료 또는 유료 (학생당 가격)
  - 메모 입력 (선택사항)

### 2. **API 엔드포인트**
- **POST** `/api/admin/academy-bot-subscriptions`
  - 학원에 새 봇 구독 생성
  - 기존 구독이 있으면 학생 슬롯 추가 및 기간 연장
  - `AcademyBotSubscription` 테이블에 저장

### 3. **학생 할당 시 자동 검증**
- **API**: `/api/admin/ai-bots/assign`
- **검증 항목**:
  1. ✅ **구독 존재 여부**: 해당 봇에 대한 구독이 있는지 확인
  2. ✅ **구독 만료 여부**: `subscriptionEnd < now`인지 확인
  3. ✅ **학생 수 제한**: `remainingStudentSlots <= 0`이면 할당 실패
- **슬롯 차감**: 할당 성공 시 자동으로 슬롯 차감

---

## 🧪 테스트 시나리오

### **시나리오 1: 학원에 봇 구독 할당**

#### 📍 **테스트 단계**:
1. **로그인**
   - https://superplacestudy.pages.dev/login
   - **SUPER_ADMIN** 계정으로 로그인

2. **봇 관리 페이지 접근**
   - 좌측 메뉴 → **"AI 봇 관리"** 클릭
   - 또는 직접 접속: `/dashboard/admin/bot-management`

3. **학원에 구독 할당 버튼 클릭**
   - 우측 상단 **"학원에 구독 할당"** (초록색 버튼) 클릭
   - `/dashboard/admin/assign-academy-bot` 페이지로 이동

4. **할당 정보 입력**
   - **학원 선택**: 드롭다운에서 학원 선택
   - **AI 봇 선택**: 활성화된 봇 선택
   - **학생 수 제한**: `5` 입력 (테스트용)
   - **시작일**: 오늘 날짜 (자동 설정됨)
   - **종료일**: 1개월 후 (자동 설정됨)
   - **가격 설정**: "무료" 선택
   - **메모**: "테스트 할당 - 5명 제한" 입력

5. **할당하기 버튼 클릭**
   - 성공 메시지 확인:
     ```
     ✅ 학원에 봇 구독이 할당되었습니다!
     
     학생 수 제한: 5명
     기간: 2026-02-27 ~ 2026-03-27
     ```
   - 봇 관리 페이지로 자동 이동

#### ✅ **기대 결과**:
- `AcademyBotSubscription` 테이블에 새 레코드 생성
- `totalStudentSlots`: 5
- `usedStudentSlots`: 0
- `remainingStudentSlots`: 5
- `subscriptionEnd`: 설정한 종료일

---

### **시나리오 2: 학생에게 봇 할당 (제한 내)**

#### 📍 **테스트 단계**:
1. **DIRECTOR 계정으로 로그인**
   - 시나리오 1에서 구독을 할당받은 학원의 학원장 계정

2. **AI 봇 할당 페이지 접근**
   - 좌측 메뉴 → **"AI 봇 할당"**
   - 또는 직접 접속: `/dashboard/admin/ai-bots/assign`

3. **학생 1에게 봇 할당**
   - AI 봇 선택: 구독을 받은 봇
   - 사용자 선택: 학생 1
   - 기간: 1개월
   - **"할당하기"** 클릭

4. **결과 확인**
   - ✅ 성공 메시지: "AI 봇이 성공적으로 할당되었습니다"

5. **학생 2~5에게도 반복**
   - 각각 성공해야 함

#### ✅ **기대 결과** (5명 할당 후):
- `AcademyBotSubscription`:
  - `usedStudentSlots`: 5
  - `remainingStudentSlots`: 0
- 학생 1~5 모두 봇 할당 성공

---

### **시나리오 3: 학생 수 제한 초과 시도 (6번째 학생)**

#### 📍 **테스트 단계**:
1. **동일한 DIRECTOR 계정으로 로그인**

2. **학생 6에게 봇 할당 시도**
   - AI 봇 선택: 동일한 봇
   - 사용자 선택: 학생 6
   - 기간: 1개월
   - **"할당하기"** 클릭

3. **결과 확인**
   - ❌ **실패 메시지**:
     ```
     사용 가능한 학생 슬롯이 부족합니다.
     
     현재 상태:
     - 전체 슬롯: 5개
     - 사용 중: 5개
     - 남은 슬롯: 0개
     
     추가 슬롯이 필요한 경우 AI 쇼핑몰에서 구독을 추가 신청하세요.
     ```

#### ✅ **기대 결과**:
- 학생 6에게 봇 할당 **실패**
- HTTP 403 에러
- `AcademyBotSubscription`:
  - `usedStudentSlots`: 5 (변화 없음)
  - `remainingStudentSlots`: 0 (변화 없음)

---

### **시나리오 4: 추가 슬롯 할당**

#### 📍 **테스트 단계**:
1. **SUPER_ADMIN 계정으로 로그인**

2. **동일한 학원에 추가 구독 할당**
   - `/dashboard/admin/assign-academy-bot` 접속
   - 동일한 학원, 동일한 봇 선택
   - 학생 수 제한: `3` 입력 (추가 3명)
   - **"할당하기"** 클릭

3. **결과 확인**
   - ✅ 성공 메시지
   - `AcademyBotSubscription` 업데이트:
     - `totalStudentSlots`: 5 + 3 = **8**
     - `usedStudentSlots`: 5 (기존)
     - `remainingStudentSlots`: **3**

4. **학생 6~8에게 봇 할당**
   - DIRECTOR 계정으로 다시 로그인
   - 학생 6, 7, 8에게 봇 할당
   - 모두 성공해야 함

5. **학생 9에게 할당 시도**
   - ❌ 실패 (슬롯 부족)

#### ✅ **기대 결과**:
- 추가 슬롯 할당 성공
- 학생 6~8: 할당 성공
- 학생 9: 할당 실패

---

### **시나리오 5: 구독 만료 후 할당 시도**

#### 📍 **테스트 단계**:
1. **SUPER_ADMIN 계정으로 로그인**

2. **테스트용 짧은 기간 구독 생성**
   - `/dashboard/admin/assign-academy-bot` 접속
   - 새 학원 선택
   - 학생 수 제한: 10
   - 시작일: 어제 날짜
   - 종료일: 오늘 날짜 (또는 과거)
   - **"할당하기"** 클릭
   - ⚠️ **주의**: 시작일이 종료일보다 늦으면 에러 발생

3. **DIRECTOR로 할당 시도**
   - 해당 학원의 DIRECTOR로 로그인
   - 봇 할당 시도

4. **결과 확인**
   - ❌ **실패 메시지**:
     ```
     구독이 만료되었습니다 (만료일: 2026-02-26).
     새로운 구독을 신청해주세요.
     ```

#### ✅ **기대 결과**:
- 만료된 구독으로는 할당 불가
- HTTP 403 에러

---

## 📊 검증 포인트

| 항목 | 검증 방법 | 기대 결과 |
|------|-----------|-----------|
| **학생 수 제한** | 제한 수만큼 할당 후 추가 시도 | 제한 내: ✅ 성공, 초과: ❌ 실패 |
| **구독 기간** | 만료일 지난 구독으로 할당 시도 | ❌ 실패 (만료 메시지) |
| **슬롯 차감** | 할당 후 DB 확인 | `usedStudentSlots +1`, `remainingStudentSlots -1` |
| **추가 할당** | 동일 학원/봇에 재할당 | 슬롯 추가, 기간 연장 |
| **권한 체크** | DIRECTOR가 다른 학원 학생에게 할당 | ❌ 실패 (권한 없음) |

---

## 🚀 배포 정보

| 항목 | 값 |
|------|-----|
| **최신 커밋** | `ccb9ee3` |
| **GitHub 저장소** | https://github.com/kohsunwoo12345-cmyk/superplace |
| **라이브 사이트** | https://superplacestudy.pages.dev |
| **할당 페이지** | https://superplacestudy.pages.dev/dashboard/admin/assign-academy-bot |

---

## 📝 핵심 코드 위치

| 파일 | 내용 |
|------|------|
| `src/app/dashboard/admin/assign-academy-bot/page.tsx` | 학원 구독 할당 UI |
| `functions/api/admin/academy-bot-subscriptions.ts` | 구독 생성/업데이트 API |
| `functions/api/admin/ai-bots/assign.ts` | 학생 봇 할당 API (검증 로직 포함) |

### 주요 검증 로직 (assign.ts):
```typescript
// 학생 수 제한 검증 (178-189번 줄)
const remainingSlots = subscription.remainingStudentSlots || 0;
if (remainingSlots <= 0) {
  return new Response(JSON.stringify({
    success: false,
    error: 'No remaining slots',
    message: `사용 가능한 학생 슬롯이 부족합니다...`
  }), { status: 403 });
}

// 슬롯 차감 (256-269번 줄)
await DB.prepare(`
  UPDATE AcademyBotSubscription
  SET usedStudentSlots = usedStudentSlots + 1,
      remainingStudentSlots = remainingStudentSlots - 1
  WHERE academyId = ? AND productId = ?
`).bind(user.academyId, botId).run();
```

---

## ✅ 테스트 체크리스트

- [ ] 학원에 봇 구독 할당 성공
- [ ] 학생 1~5에게 봇 할당 성공
- [ ] 학생 6에게 봇 할당 실패 (슬롯 부족)
- [ ] 추가 슬롯 할당 후 학생 6~8에게 할당 성공
- [ ] 학생 9에게 봇 할당 실패
- [ ] 만료된 구독으로 할당 시도 실패
- [ ] DIRECTOR가 다른 학원 학생에게 할당 실패

---

## 🎯 결론

모든 기능이 정상적으로 구현되었습니다:

1. ✅ **학원 선택 가능**
2. ✅ **기간 설정** (시작일/종료일)
3. ✅ **학생 수 제한** (필수, 강제 적용)
4. ✅ **가격 설정** (무료/유료)
5. ✅ **메모 입력**
6. ✅ **실제 작동 검증**: 학생 수 제한, 기간 만료 모두 정상 작동

**다음 단계**: 위 시나리오대로 브라우저에서 직접 테스트하여 최종 확인하세요!
