# AI 봇 전체 목록 및 계정 전환 기능 가이드

## 📋 개요

학원 관리 시스템에 AI 봇 전체 목록 페이지와 계정 전환 기능이 추가되었습니다.

**배포 날짜**: 2026-01-24  
**커밋 ID**: c48bd6b  
**작성자**: Claude AI

---

## ✨ 주요 기능

### 1️⃣ AI 봇 전체 목록 페이지

**경로**: `/dashboard/ai-bots-list`

**기능**:
- 모든 AI 봇 목록 표시 (DB 봇 + 기본 봇)
- 봇별 기능 배지 표시
  - 🖼️ 이미지 입력
  - 🔊 음성 출력
  - 🎤 음성 입력
  - 📄 참고자료
  - 💬 스타터 메시지
- 검색 기능 (이름/영문명/설명)
- 할당 상태 표시
  - ✅ 할당됨 (초록색)
  - 🔒 미할당 (회색)
- 역할별 접근 제어
  - SUPER_ADMIN: 모든 봇 접근 가능
  - DIRECTOR/TEACHER/STUDENT: 할당받은 봇만 접근 가능

**UI 특징**:
- 반응형 그리드 레이아웃 (1~4열)
- 봇별 색상 테마 적용
- 호버 효과 및 그림자
- 할당되지 않은 봇은 흐리게 표시

---

### 2️⃣ 계정 전환 기능

**대상 역할**:
- 학원장 (DIRECTOR) → 선생님 또는 학생 계정으로 전환
- 선생님 (TEACHER) → 학생 계정으로 전환

**주요 기능**:
- 24시간 유효한 전환 세션
- 같은 학원 소속만 전환 가능
- 원래 계정으로 즉시 복귀
- 전환 상태 실시간 표시
- 만료된 세션 자동 비활성화

**접근 방법**:
- Sidebar 사용자 정보 섹션에 "계정 전환" 버튼

**전환 프로세스**:
1. "계정 전환" 버튼 클릭
2. 전환할 계정 검색 (이름/이메일)
3. 대상 계정 카드 클릭
4. 전환 완료 → 대시보드로 자동 이동
5. "원래 계정으로" 버튼으로 복귀

---

## 🗄️ 데이터베이스 스키마

### AccountSwitch 모델

```prisma
model AccountSwitch {
  id                String    @id @default(cuid())
  originalUserId    String    // 원래 계정
  targetUserId      String    // 전환 대상 계정
  originalRole      String    // 원래 역할
  targetRole        String    // 전환 대상 역할
  academyId         String    // 학원 ID
  sessionToken      String    @unique // 세션 토큰
  expiresAt         DateTime  // 만료 시간
  isActive          Boolean   @default(true)
  switchedAt        DateTime  @default(now())
  switchBackAt      DateTime? // 복귀 시간
  
  originalUser      User      @relation("OriginalUser")
  targetUser        User      @relation("TargetUser")
  
  @@index([originalUserId, isActive])
  @@index([sessionToken])
}
```

---

## 🔌 API 엔드포인트

### 1. 계정 전환 API

**POST** `/api/account-switch`

**요청**:
```json
{
  "targetUserId": "clxxxx..."
}
```

**응답**:
```json
{
  "success": true,
  "message": "계정 전환이 완료되었습니다.",
  "data": {
    "switchId": "clxxxx...",
    "sessionToken": "a1b2c3...",
    "targetUser": {
      "id": "clxxxx...",
      "name": "홍길동",
      "email": "student@example.com",
      "role": "STUDENT"
    },
    "expiresAt": "2026-01-25T10:00:00Z"
  }
}
```

**GET** `/api/account-switch`

현재 활성화된 전환 정보 조회

**응답**:
```json
{
  "isActive": true,
  "data": {
    "switchId": "clxxxx...",
    "originalRole": "DIRECTOR",
    "targetUser": {
      "id": "clxxxx...",
      "name": "홍길동",
      "email": "student@example.com",
      "role": "STUDENT"
    },
    "expiresAt": "2026-01-25T10:00:00Z",
    "switchedAt": "2026-01-24T10:00:00Z"
  }
}
```

**DELETE** `/api/account-switch`

원래 계정으로 복귀

**응답**:
```json
{
  "success": true,
  "message": "원래 계정으로 복귀했습니다."
}
```

---

### 2. 사용자 목록 조회 API

**GET** `/api/director/users`

학원장이 선생님/학생 목록 조회

**응답**:
```json
{
  "success": true,
  "users": [
    {
      "id": "clxxxx...",
      "name": "김선생",
      "email": "teacher@example.com",
      "role": "TEACHER",
      "createdAt": "2026-01-01T00:00:00Z"
    },
    {
      "id": "clxxxx...",
      "name": "홍길동",
      "email": "student@example.com",
      "role": "STUDENT",
      "createdAt": "2026-01-02T00:00:00Z"
    }
  ]
}
```

**GET** `/api/teacher/students`

선생님이 학생 목록 조회

**응답**:
```json
{
  "success": true,
  "students": [
    {
      "id": "clxxxx...",
      "name": "홍길동",
      "email": "student@example.com",
      "role": "STUDENT",
      "createdAt": "2026-01-02T00:00:00Z"
    }
  ]
}
```

---

## 🎨 UI 컴포넌트

### AccountSwitchButton

**위치**: `src/components/account/AccountSwitchButton.tsx`

**Props**: 없음 (자동으로 세션 정보 사용)

**상태**:
- 전환 전: "계정 전환" 버튼
- 전환 후: 전환된 계정 정보 + "원래 계정으로" 버튼

**기능**:
- 사용자 목록 조회 및 검색
- 실시간 전환 상태 표시
- 에러 핸들링 및 알림
- 로딩 상태 표시

---

## 📝 대시보드 메뉴 구성

### SUPER_ADMIN
- 대시보드
- 사용자 관리
- 학원 관리
- 요금제 관리
- AI 봇 관리
- AI 봇 할당
- **AI 봇 전체 목록** ✨ (신규)
- AI 봇
- 꾸메땅 AI 봇
- 문의 관리
- 전체 통계
- 시스템 설정

### DIRECTOR
- 대시보드
- **AI 봇 전체 목록** ✨ (신규)
- 사용자 관리
- 선생님 관리
- 학생 관리
- 수업 관리
- 학습 자료
- 과제 관리
- 출석 관리
- 성적 관리
- 학원 통계
- 문의 관리
- 학원 설정
- 내 설정

### TEACHER
- 대시보드
- **AI 봇 전체 목록** ✨ (신규)
- 학생 목록
- 학습 자료
- 과제 관리
- 출석 체크
- 성적 입력
- 내 설정

### STUDENT
- 대시보드
- **AI 봇 전체 목록** ✨ (신규)

---

## 🔒 권한 및 제한

### 계정 전환 권한

| 원래 역할 | 전환 가능 역할 | 제한 조건 |
|---------|------------|---------|
| SUPER_ADMIN | 없음 | 전환 불가 |
| DIRECTOR | TEACHER, STUDENT | 같은 학원 |
| TEACHER | STUDENT | 같은 학원 |
| STUDENT | 없음 | 전환 불가 |

### 봇 접근 권한

| 역할 | 접근 가능 봇 |
|-----|-----------|
| SUPER_ADMIN | 모든 봇 |
| DIRECTOR | 할당받은 봇만 |
| TEACHER | 할당받은 봇만 |
| STUDENT | 할당받은 봇만 |

---

## 🧪 테스트 시나리오

### 1. AI 봇 전체 목록 테스트

**학원장/선생님/학생으로 로그인**:
1. `/dashboard/ai-bots-list` 접속
2. AI 봇 목록 확인
3. 검색 기능 테스트 (이름/영문명)
4. 할당된 봇 클릭 → 채팅 페이지 이동 확인
5. 미할당 봇 클릭 → "할당 필요" 알림 확인

**SUPER_ADMIN으로 로그인**:
1. `/dashboard/ai-bots-list` 접속
2. 모든 봇 접근 가능 확인
3. 클릭 시 채팅 페이지로 이동 확인

---

### 2. 계정 전환 테스트 (학원장)

**사전 준비**:
- 학원장 계정 (DIRECTOR)
- 같은 학원의 선생님 계정
- 같은 학원의 학생 계정

**테스트**:
1. 학원장으로 로그인
2. Sidebar에서 "계정 전환" 버튼 확인
3. 버튼 클릭 → Dialog 표시
4. 선생님 검색 → 클릭 → 전환 완료
5. Sidebar에 "원래 계정으로" 버튼 및 전환 상태 확인
6. 학생 대시보드 메뉴 확인
7. "원래 계정으로" 버튼 클릭 → 복귀 확인

---

### 3. 계정 전환 테스트 (선생님)

**사전 준비**:
- 선생님 계정 (TEACHER)
- 같은 학원의 학생 계정

**테스트**:
1. 선생님으로 로그인
2. Sidebar에서 "계정 전환" 버튼 확인
3. 버튼 클릭 → 학생 목록만 표시 확인
4. 학생 선택 → 전환 완료
5. 학생 대시보드 메뉴 확인
6. "원래 계정으로" 버튼으로 복귀

---

## 🚨 주의사항

### 1. 보안
- 계정 전환 세션은 24시간 후 자동 만료
- 같은 학원 소속만 전환 가능
- 전환 기록은 DB에 저장됨

### 2. 사용성
- 전환 후 페이지 새로고침 필요
- 브라우저 캐시 문제 시 시크릿 모드 사용
- 복귀 시 원래 대시보드로 이동

### 3. 제한사항
- SUPER_ADMIN은 계정 전환 불가
- 학생은 계정 전환 불가
- 다른 학원 사용자로 전환 불가
- 동시에 여러 계정 전환 불가

---

## 📊 사용 사례

### 학원장이 학생 계정 확인
1. 학생의 봇 사용 현황 확인
2. 학생 대시보드 UI 테스트
3. 학생 권한으로 기능 검증

### 선생님이 학생 계정 확인
1. 학생이 보는 화면 확인
2. 과제/자료 확인
3. 학생 관점에서 문제 진단

---

## 🔄 향후 개선 사항

1. **전환 세션 관리**
   - 전환 이력 조회 페이지
   - 관리자의 전환 세션 강제 종료
   - 세션 만료 알림

2. **권한 관리**
   - 전환 시 특정 기능 제한
   - 읽기 전용 모드
   - 감사 로그 기록

3. **UI/UX 개선**
   - 전환 상태 더 명확하게 표시
   - 빠른 전환 메뉴
   - 최근 전환 계정 목록

4. **기능 확장**
   - 여러 계정 북마크
   - 계정 그룹 전환
   - 역할별 커스텀 대시보드

---

## 📁 관련 파일

### 페이지
- `src/app/dashboard/ai-bots-list/page.tsx` - AI 봇 전체 목록

### 컴포넌트
- `src/components/account/AccountSwitchButton.tsx` - 계정 전환 버튼
- `src/components/dashboard/Sidebar.tsx` - 대시보드 사이드바

### API
- `src/app/api/account-switch/route.ts` - 계정 전환 API
- `src/app/api/director/users/route.ts` - 학원장 사용자 목록
- `src/app/api/teacher/students/route.ts` - 선생님 학생 목록

### 스키마
- `prisma/schema.prisma` - AccountSwitch 모델

---

## 📞 문의 및 지원

문제가 발생하거나 추가 기능이 필요한 경우:
1. GitHub Issues에 등록
2. 커밋 ID와 오류 메시지 첨부
3. 재현 단계 상세히 기술

---

**배포 URL**: https://superplace-study.vercel.app  
**GitHub**: https://github.com/kohsunwoo12345-cmyk/superplace  
**커밋**: c48bd6b  
**날짜**: 2026-01-24

© 2026 SUPER PLACE - All Rights Reserved
