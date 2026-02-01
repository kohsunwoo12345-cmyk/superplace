# 실시간 접속자 추적 시스템 - 최종 구현 가이드

## ✅ 완료 상태

**실제 사용자 활동만 추적하도록 구현 완료!**

---

## 🎯 주요 변경사항

### 1. **테스트 데이터 삭제** ✅
- 기존 시드 데이터 70개 접속 로그 삭제
- 기존 시드 데이터 30개 활동 로그 삭제
- 이제부터 **실제 사용자 활동만** 기록됩니다

### 2. **자동 접속 로그 추적** ✅
- **미들웨어 추가**: `src/middleware.ts`
- 모든 페이지 접속 자동 감지
- 회원/비회원 자동 구분
- IP 주소, User Agent 자동 수집
- 한국 시간(Asia/Seoul) 기준 저장

### 3. **자동 활동 로그 기록** ✅
- **활동 로거 헬퍼**: `src/lib/activity-logger.ts`
- 로그인 시 자동 기록
- 학생 추가 시 자동 기록
- 향후 모든 주요 활동 자동 기록 가능

### 4. **한국 시간 표시** ✅
- 모든 날짜/시간을 Asia/Seoul 기준으로 표시
- `formatDateTime` 함수로 일관된 포맷 적용
- 예: "2026년 1월 24일 16:30:45"

---

## 🔄 자동 추적되는 활동

### 접속 로그 (AccessLog)
자동으로 기록되는 접속:
- ✅ 홈페이지 방문 (/)
- ✅ 대시보드 접속 (/dashboard/*)
- ✅ 모든 페이지 조회
- ✅ 회원/비회원 구분
- ✅ IP 주소 수집
- ✅ 브라우저, OS, 디바이스 정보
- ✅ 한국 시간 기록

### 활동 로그 (ActivityLog)
자동으로 기록되는 활동:
- ✅ **로그인**: 사용자가 로그인할 때
- ✅ **학생 추가**: 학원장/선생님이 학생을 추가할 때
- 🔜 **로그아웃**: 구현 예정
- 🔜 **학생 수정**: 구현 예정
- 🔜 **AI 봇 대화**: 구현 예정
- 🔜 **과제 제출**: 구현 예정
- 🔜 **성적 입력**: 구현 예정

---

## 📝 구현된 파일

### 1. 미들웨어 (자동 접속 로그)
**파일**: `src/middleware.ts`

**기능**:
- 모든 페이지 요청 감지
- API 호출, 정적 파일 제외
- 사용자 세션 확인
- 접속 로그 자동 생성
- 비동기 처리로 응답 지연 방지

**작동 방식**:
```typescript
// 1. 페이지 접속 감지
// 2. 사용자 확인 (로그인 여부)
// 3. 백그라운드에서 로그 기록
// 4. 사용자 요청 계속 처리
```

### 2. 활동 로거 (활동 로그 헬퍼)
**파일**: `src/lib/activity-logger.ts`

**기능**:
- 활동 로그 생성 헬퍼 함수
- 활동 유형 상수 (ActivityType)
- 리소스 유형 상수 (ResourceType)
- IP 주소/User Agent 추출 함수

**사용 예시**:
```typescript
import { ActivityType, ResourceType, createActivityLog } from '@/lib/activity-logger';

// 활동 로그 기록
await createActivityLog({
  userId: user.id,
  action: ActivityType.STUDENT_ADD,
  resource: ResourceType.STUDENTS,
  resourceId: student.id,
  description: '학생을 추가했습니다.',
  metadata: { studentName: '홍길동' },
});
```

### 3. 로그인 활동 로그
**파일**: `src/lib/auth.ts` (수정)

**추가 기능**:
- 로그인 시 활동 로그 자동 기록
- 사용자 정보 포함 (이름, 이메일, 역할)
- 로그 실패해도 로그인 계속 진행

### 4. 학생 추가 활동 로그
**파일**: `src/app/api/students/create/route.ts` (수정)

**추가 기능**:
- 학생 생성 시 활동 로그 자동 기록
- 학생 정보 포함 (이름, 이메일, 학년, 학교)
- 누가 추가했는지 기록

### 5. 테스트 데이터 삭제 스크립트
**파일**: `scripts/clear-test-logs.ts`

**기능**:
- 모든 접속 로그 삭제
- 모든 활동 로그 삭제
- 실제 데이터만 남김

**실행 방법**:
```bash
cd /home/user/webapp
npx tsx scripts/clear-test-logs.ts
```

---

## 🚀 사용 방법

### 1. 접속자 분석 페이지 접속
```
URL: https://superplace-study.vercel.app/dashboard/admin/access-analytics
권한: SUPER_ADMIN만 접근 가능
```

### 2. 실시간 데이터 확인
1. **SUPER_ADMIN 계정으로 로그인**
2. 사이드바에서 **"접속자 분석"** 클릭
3. **실제 사용자 활동만** 표시됨
4. 한국 시간 기준으로 표시

### 3. 로그 자동 생성 테스트
**테스트 시나리오**:

#### A. 접속 로그 테스트
```
1. 비회원으로 홈페이지 방문
   → 접속 로그에 "비회원" 기록
   
2. 학생 계정으로 로그인
   → 로그인 활동 로그 기록
   → 대시보드 접속 로그 기록
   
3. 여러 페이지 방문
   → 각 페이지별 접속 로그 생성
```

#### B. 활동 로그 테스트
```
1. 학원장 계정으로 로그인
   → "LOGIN" 활동 로그 생성
   
2. 학생 추가
   → "STUDENT_ADD" 활동 로그 생성
   
3. 접속자 분석 페이지에서 확인
   → 방금 생성된 로그 확인
```

---

## 🔍 한국 시간 표시 확인

### 날짜/시간 포맷
```
형식: YYYY년 M월 D일 HH:mm:ss
시간대: Asia/Seoul (한국 표준시)
예시: 2026년 1월 24일 16:30:45
```

### 구현 코드
```typescript
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  });
};
```

---

## 📊 데이터 흐름

### 접속 로그 흐름
```
사용자 접속
    ↓
미들웨어 감지
    ↓
세션 확인
    ↓
POST /api/admin/access-logs
    ↓
AccessLog 생성
    ↓
접속자 분석 페이지에 표시
```

### 활동 로그 흐름
```
사용자 행동 (로그인, 학생 추가 등)
    ↓
API 라우트에서 createActivityLog 호출
    ↓
ActivityLog 생성
    ↓
접속자 분석 페이지 "활동 로그" 탭에 표시
```

---

## 🎨 UI 화면

### 접속 로그 표시 예시
```
┌────────────────────────────────────────────────────────┐
│ 회원    홍길동 (학원장)                                 │
│ 📅 2026년 1월 24일 16:30:45                            │
│ 💻 desktop | Chrome / Windows | IP: 192.168.1.100    │
│ GET /dashboard/students                                │
│ 🏷️ page_view                                          │
└────────────────────────────────────────────────────────┘
```

### 활동 로그 표시 예시
```
┌────────────────────────────────────────────────────────┐
│ 홍길동 (학원장) STUDENT_ADD                            │
│ 홍길동님이 학생 '김철수'을(를) 추가했습니다.           │
│ 🕐 2026년 1월 24일 16:31:20                            │
│ 리소스: students (clx...)                              │
└────────────────────────────────────────────────────────┘
```

---

## ⚙️ 향후 추가할 활동 로그

### API 라우트에 추가 예정
```typescript
// 로그아웃
await createActivityLog({
  userId: user.id,
  action: ActivityType.LOGOUT,
  resource: ResourceType.AUTH,
  description: `${user.name}님이 로그아웃했습니다.`,
});

// 학생 수정
await createActivityLog({
  userId: director.id,
  action: ActivityType.STUDENT_EDIT,
  resource: ResourceType.STUDENTS,
  resourceId: student.id,
  description: `학생 정보를 수정했습니다.`,
  metadata: { changes: { ... } },
});

// AI 봇 대화
await createActivityLog({
  userId: student.id,
  action: ActivityType.AI_CHAT,
  resource: ResourceType.AI_BOTS,
  resourceId: bot.id,
  description: `AI 봇 '${bot.name}'과 대화를 시작했습니다.`,
});

// 과제 제출
await createActivityLog({
  userId: student.id,
  action: ActivityType.ASSIGNMENT_SUBMIT,
  resource: ResourceType.ASSIGNMENTS,
  resourceId: assignment.id,
  description: `과제를 제출했습니다.`,
  metadata: { assignmentTitle: assignment.title },
});
```

---

## 🔐 보안 및 개인정보

### 수집되는 정보
- ✅ 사용자 ID (회원인 경우)
- ✅ 세션 ID
- ✅ IP 주소
- ✅ User Agent (브라우저, OS, 디바이스)
- ✅ 접속 경로
- ✅ 접속 시간 (한국 시간)

### 접근 권한
- ✅ **SUPER_ADMIN만** 로그 조회 가능
- ✅ API 레벨에서 권한 체크
- ✅ 일반 사용자는 접근 불가

### 개인정보 보호
- ⚠️ IP 주소는 개인정보로 간주될 수 있음
- ⚠️ 데이터 보관 기간 설정 권장
- ⚠️ GDPR 및 개인정보보호법 준수 필요

---

## 🧪 테스트 체크리스트

### 접속 로그
- [ ] 비회원 홈페이지 방문 → 비회원 로그 생성 확인
- [ ] 회원 로그인 → 로그인 후 회원 로그 생성 확인
- [ ] 대시보드 페이지 방문 → 접속 로그 생성 확인
- [ ] 여러 페이지 방문 → 각각 로그 생성 확인
- [ ] 한국 시간 표시 확인

### 활동 로그
- [ ] 로그인 → LOGIN 활동 로그 확인
- [ ] 학생 추가 → STUDENT_ADD 활동 로그 확인
- [ ] 사용자 정보 포함 확인
- [ ] 메타데이터 확인
- [ ] 한국 시간 표시 확인

### 필터링
- [ ] 회원/비회원 필터 작동 확인
- [ ] 날짜 범위 필터 작동 확인
- [ ] 활동 유형 필터 작동 확인
- [ ] 초기화 버튼 작동 확인

### 통계
- [ ] 총 접속자 수 정확성 확인
- [ ] 회원/비회원 비율 계산 확인
- [ ] 활동 로그 수 정확성 확인

---

## 📦 배포 정보

- **Repository**: https://github.com/kohsunwoo12345-cmyk/superplace
- **Branch**: main
- **최근 커밋**: 61ad5f0 - 실제 사용자 활동 자동 추적 기능 구현
- **배포 URL**: https://superplace-study.vercel.app
- **배포 상태**: ✅ 자동 배포 완료

---

## 🛠️ 문제 해결

### "로그가 생성되지 않아요"
1. **미들웨어 확인**: `src/middleware.ts` 파일 존재 확인
2. **빌드 확인**: `npm run build` 실행
3. **배포 확인**: Vercel 배포 완료 대기
4. **캐시 삭제**: Ctrl+Shift+R

### "한국 시간이 아니에요"
- `formatDateTime` 함수에서 `timeZone: 'Asia/Seoul'` 설정 확인
- 브라우저 시간대 설정 확인

### "접속 로그가 너무 많아요"
```bash
# 테스트 데이터 삭제
cd /home/user/webapp
npx tsx scripts/clear-test-logs.ts
```

---

## 📚 참고 자료

### Next.js 미들웨어
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)

### 활동 로그 패턴
- [Audit Log Best Practices](https://www.osohq.com/post/audit-logs-best-practices)

---

## ✅ 완료 항목

- [x] 테스트 데이터 삭제 (70개 접속 로그, 30개 활동 로그)
- [x] 미들웨어 추가 (자동 접속 로그)
- [x] 활동 로거 헬퍼 함수 작성
- [x] 로그인 활동 로그 추가
- [x] 학생 추가 활동 로그 추가
- [x] 한국 시간(Asia/Seoul) 표시 유지
- [x] IP 주소/User Agent 자동 수집
- [x] 회원/비회원 자동 구분
- [x] Git 커밋 및 푸시
- [x] 빌드 확인
- [x] 문서 작성

---

## 🎉 완료!

**실제 사용자 활동만 추적하는 시스템이 구현되었습니다!**

이제부터:
- ✅ 모든 페이지 접속이 자동으로 기록됩니다
- ✅ 로그인, 학생 추가 등의 활동이 자동으로 기록됩니다
- ✅ 한국 시간 기준으로 표시됩니다
- ✅ SUPER_ADMIN만 로그를 조회할 수 있습니다
- ✅ 실제 데이터만 표시됩니다

**접속자 분석 페이지에서 실시간으로 확인하세요!**
- URL: `/dashboard/admin/access-analytics`
- 권한: SUPER_ADMIN

---

**작성일**: 2026-01-24  
**작성자**: Claude AI  
**버전**: 2.0 (실제 데이터 전용)  
**커밋 ID**: 61ad5f0
