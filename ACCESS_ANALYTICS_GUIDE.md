# 접속자 분석 시스템 가이드

## 📋 개요

관리자 대시보드에 한국 시간 기준 접속자 추적 및 활동 분석 기능이 추가되었습니다. 회원/비회원을 구분하여 실시간으로 접속 내역과 활동 로그를 확인할 수 있습니다.

---

## 🎯 주요 기능

### 1. 접속 로그 추적
- ✅ **실시간 접속 기록**: 모든 페이지 방문 자동 추적
- ✅ **한국 시간 표시**: Asia/Seoul 기준 날짜/시간
- ✅ **회원/비회원 구분**: userId 기반 자동 분류
- ✅ **상세 정보 수집**:
  - IP 주소
  - User Agent (브라우저, OS, 디바이스)
  - 접속 경로 (path)
  - HTTP 메서드
  - 세션 ID
  - 체류 시간

### 2. 활동 로그 추적
- ✅ **사용자 행동 추적**:
  - 로그인/로그아웃
  - 페이지 조회
  - 학생 추가/수정/삭제
  - AI 봇 사용
  - 과제 제출/확인
  - 성적 입력
- ✅ **상세 메타데이터**: JSON 형태로 추가 정보 저장
- ✅ **리소스 추적**: 어떤 데이터에 접근했는지 기록

### 3. 관리자 대시보드
- ✅ **실시간 통계**:
  - 총 접속자 수
  - 회원/비회원 비율
  - 활동 로그 수
  - 오늘의 방문자 수
- ✅ **필터링 기능**:
  - 날짜 범위 선택
  - 회원/비회원 필터
  - 활동 유형 필터
- ✅ **상세 목록**:
  - 시간 (한국 시간)
  - 사용자 정보
  - 활동 내용
  - 브라우저/OS/디바이스
  - IP 주소

---

## 🗄️ 데이터베이스 모델

### AccessLog (접속 로그)
```prisma
model AccessLog {
  id            String    @id @default(cuid())
  userId        String?   // null이면 비회원
  sessionId     String?
  ipAddress     String?
  userAgent     String?
  browser       String?
  os            String?
  device        String?
  path          String
  method        String    @default("GET")
  statusCode    Int?
  country       String?
  city          String?
  accessedAt    DateTime  @default(now())
  duration      Int?      // 밀리초 단위
  activityType  String?
  activityData  Json?
  user          User?     @relation(fields: [userId], references: [id])

  @@index([userId, accessedAt])
  @@index([sessionId])
  @@index([accessedAt])
  @@index([activityType])
}
```

### ActivityLog (활동 로그)
```prisma
model ActivityLog {
  id          String   @id @default(cuid())
  userId      String?
  sessionId   String?
  action      String   // LOGIN, LOGOUT, PAGE_VIEW, STUDENT_ADD, etc.
  resource    String?
  resourceId  String?
  description String?
  metadata    Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  user        User?    @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
  @@index([action])
  @@index([sessionId])
  @@index([resource, resourceId])
}
```

---

## 🔌 API 엔드포인트

### 1. GET `/api/admin/access-logs`
**기능**: 접속 로그 조회  
**권한**: SUPER_ADMIN만 접근  
**쿼리 파라미터**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 결과 개수 (기본값: 50)
- `userType`: 'member' | 'guest' | 'all'
- `startDate`: 시작 날짜 (YYYY-MM-DD)
- `endDate`: 종료 날짜 (YYYY-MM-DD)
- `action`: 활동 유형 필터

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "clx...",
        "userId": "clx...",
        "user": {
          "name": "홍길동",
          "email": "hong@example.com",
          "role": "DIRECTOR"
        },
        "sessionId": "sess_...",
        "ipAddress": "192.168.1.100",
        "browser": "Chrome",
        "os": "Windows",
        "device": "desktop",
        "path": "/dashboard/students",
        "method": "GET",
        "accessedAt": "2026-01-24T15:30:45.000Z",
        "activityType": "page_view"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2
    },
    "stats": {
      "total": 100,
      "memberCount": 75,
      "guestCount": 25,
      "byActivity": {
        "page_view": 60,
        "login": 20,
        "logout": 15,
        "student_view": 5
      }
    }
  }
}
```

### 2. POST `/api/admin/access-logs`
**기능**: 접속 로그 기록  
**권한**: 인증 필요 없음 (자동 기록용)  
**요청 Body**:
```json
{
  "userId": "clx...",
  "sessionId": "sess_...",
  "path": "/dashboard/students",
  "method": "GET",
  "activityType": "page_view",
  "activityData": {
    "additional": "data"
  }
}
```

### 3. GET `/api/admin/activity-logs`
**기능**: 활동 로그 조회  
**권한**: SUPER_ADMIN만 접근  
**쿼리 파라미터**:
- `page`: 페이지 번호
- `limit`: 결과 개수
- `startDate`: 시작 날짜
- `endDate`: 종료 날짜
- `action`: 활동 유형 필터

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "clx...",
        "userId": "clx...",
        "user": {
          "name": "홍길동",
          "email": "hong@example.com",
          "role": "DIRECTOR"
        },
        "action": "STUDENT_ADD",
        "resource": "students",
        "resourceId": "clx...",
        "description": "새 학생 '김철수' 추가",
        "metadata": {
          "studentName": "김철수",
          "grade": "중1"
        },
        "createdAt": "2026-01-24T15:30:45.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 30,
      "totalPages": 1
    }
  }
}
```

---

## 📱 사용 방법

### 1. 관리자 접속
1. **SUPER_ADMIN** 계정으로 로그인
2. 사이드바에서 **"접속자 분석"** 메뉴 클릭
3. 또는 URL 직접 접속: `/dashboard/admin/access-analytics`

### 2. 접속 로그 확인
1. **필터 설정**:
   - 사용자 유형: 전체 / 회원 / 비회원
   - 날짜 범위: 시작일 ~ 종료일
   - 활동 유형: 입력하여 필터링
2. **"적용"** 버튼 클릭
3. 로그 목록 확인

### 3. 활동 로그 확인
1. **"활동 로그"** 탭 클릭
2. 사용자별 활동 내역 확인
3. 시간순으로 정렬된 로그 조회

### 4. 통계 확인
- **총 접속**: 전체 접속 로그 수
- **회원 접속**: 로그인한 사용자 접속 수
- **비회원 접속**: 비로그인 방문자 수
- **활동 로그**: 기록된 활동 수

---

## 🧪 테스트 데이터 생성

시드 데이터를 생성하려면 다음 명령어를 실행하세요:

```bash
cd /home/user/webapp
npx tsx scripts/seed-access-logs.ts
```

**생성되는 데이터**:
- 회원 접속 로그: 50개
- 비회원 접속 로그: 20개
- 활동 로그: 30개
- 최근 30일 간의 랜덤 데이터
- 다양한 브라우저, OS, 디바이스 시뮬레이션

---

## 📊 활동 유형 (Activity Types)

| 활동 유형 | 설명 | 리소스 |
|-----------|------|--------|
| `login` | 로그인 | auth |
| `logout` | 로그아웃 | auth |
| `page_view` | 페이지 조회 | pages |
| `student_view` | 학생 상세 조회 | students |
| `student_add` | 학생 추가 | students |
| `student_edit` | 학생 정보 수정 | students |
| `student_delete` | 학생 삭제 | students |
| `ai_chat` | AI 봇 대화 | ai-bots |
| `assignment_create` | 과제 생성 | assignments |
| `assignment_submit` | 과제 제출 | assignments |
| `grade_input` | 성적 입력 | grades |
| `attendance_check` | 출석 체크 | attendance |

---

## 🎨 UI 구성

### 1. 통계 카드
```
┌─────────────────────────────────────────────────────────┐
│  총 접속        회원 접속        비회원 접속    활동 로그  │
│   100           75 (75%)        25 (25%)        30       │
└─────────────────────────────────────────────────────────┘
```

### 2. 필터 섹션
- 사용자 유형 선택
- 날짜 범위 선택
- 활동 유형 입력
- 적용/초기화 버튼

### 3. 접속 로그 목록
각 로그 카드에 표시되는 정보:
- 회원/비회원 배지
- 사용자 이름 및 역할 (회원인 경우)
- 접속 시간 (한국 시간)
- 디바이스 정보 (아이콘 + 텍스트)
- 브라우저 / OS
- IP 주소
- HTTP 메서드 및 경로
- 활동 유형 (있는 경우)

### 4. 활동 로그 목록
각 로그 카드에 표시되는 정보:
- 사용자 이름 및 역할
- 활동 유형 (LOGIN, LOGOUT 등)
- 활동 설명
- 활동 시간 (한국 시간)
- 리소스 정보 (있는 경우)

---

## 🔐 보안 및 권한

### 접근 권한
- **SUPER_ADMIN만** 접속 로그/활동 로그 조회 가능
- 일반 학원장, 선생님, 학생은 접근 불가
- API 레벨에서 권한 체크

### 개인정보 보호
- IP 주소는 관리자만 확인 가능
- User Agent 정보는 로그 분석용
- 민감한 정보는 암호화 권장
- GDPR 준수 고려 필요

---

## 📝 수정된 파일 목록

### Prisma 스키마
- `prisma/schema.prisma`
  - AccessLog 모델 추가
  - ActivityLog 모델 추가
  - User 모델에 accessLogs, activityLogs 관계 추가

### API 엔드포인트
- `src/app/api/admin/access-logs/route.ts` (신규)
  - GET: 접속 로그 조회
  - POST: 접속 로그 기록
- `src/app/api/admin/activity-logs/route.ts` (신규)
  - GET: 활동 로그 조회

### 대시보드 페이지
- `src/app/dashboard/admin/access-analytics/page.tsx` (신규)
  - 접속자 분석 페이지
  - 통계 대시보드
  - 필터링 기능
  - 탭 메뉴 (접속 로그 / 활동 로그)

### 네비게이션
- `src/components/dashboard/Sidebar.tsx`
  - SUPER_ADMIN 메뉴에 "접속자 분석" 추가

### 시드 스크립트
- `scripts/seed-access-logs.ts` (신규)
  - 테스트 데이터 생성 스크립트

---

## 🚀 배포 정보

- **Repository**: https://github.com/kohsunwoo12345-cmyk/superplace
- **Branch**: main
- **최근 커밋**:
  - `a3b9992`: 접속 로그 시드 데이터 생성 스크립트 추가
  - `77c9fa8`: 관리자 대시보드 접속자 추적 기능 구현
- **배포 URL**: https://superplace-study.vercel.app
- **배포 상태**: ✅ 배포 완료

---

## 🔍 문제 해결

### 페이지가 보이지 않는 경우

1. **권한 확인**:
   ```
   - SUPER_ADMIN 계정으로 로그인했는지 확인
   - 다른 역할(DIRECTOR, TEACHER, STUDENT)은 접근 불가
   ```

2. **캐시 삭제**:
   ```
   - Ctrl+Shift+R (Windows) 또는 Cmd+Shift+R (Mac)
   - 또는 시크릿 모드에서 테스트
   ```

3. **데이터 확인**:
   ```bash
   # 접속 로그 개수 확인
   cd /home/user/webapp
   npx prisma studio
   # AccessLog, ActivityLog 테이블 확인
   ```

4. **빌드 확인**:
   ```bash
   cd /home/user/webapp
   npm run build
   # 빌드 오류 확인
   ```

### API 오류 해결

1. **401 Unauthorized**:
   - 로그인이 필요합니다
   - 세션이 만료되었을 수 있습니다

2. **403 Forbidden**:
   - SUPER_ADMIN 권한이 필요합니다
   - 현재 사용자의 역할을 확인하세요

3. **500 Internal Server Error**:
   - 서버 로그 확인
   - Prisma 연결 확인
   - 환경 변수 확인 (DATABASE_URL)

---

## 🎯 향후 개선 사항

### 1. 고급 분석 기능
- [ ] 시간대별 접속 패턴 그래프
- [ ] 페이지별 인기 순위
- [ ] 사용자 체류 경로 분석
- [ ] Funnel 분석

### 2. 실시간 모니터링
- [ ] WebSocket 기반 실시간 업데이트
- [ ] 현재 온라인 사용자 표시
- [ ] 실시간 알림 (비정상 접속 감지)

### 3. 데이터 내보내기
- [ ] CSV/Excel 다운로드
- [ ] PDF 보고서 생성
- [ ] 자동 주간/월간 리포트 이메일

### 4. 고급 필터링
- [ ] IP 주소 범위 필터
- [ ] 브라우저/OS별 필터
- [ ] 국가/도시별 필터
- [ ] Custom Query Builder

### 5. 성능 최적화
- [ ] 대용량 로그 데이터 처리
- [ ] 인덱싱 최적화
- [ ] 데이터 아카이빙 (90일 이전)
- [ ] 페이지네이션 개선

---

## ⚠️ 주의사항

### 개인정보 보호
- IP 주소는 개인정보로 간주될 수 있습니다
- GDPR 및 개인정보보호법 준수 필요
- 데이터 보관 기간 설정 권장

### 데이터 용량
- 로그가 시간이 지날수록 급증합니다
- 정기적인 데이터 정리 필요
- 데이터베이스 용량 모니터링

### 성능 고려사항
- 대용량 쿼리는 날짜 범위 제한 권장
- 인덱스 활용 (자주 조회하는 필드)
- 페이지네이션 필수

---

## 📚 참고 자료

### Prisma 문서
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
- [Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
- [Indexes](https://www.prisma.io/docs/concepts/components/prisma-schema/indexes)

### Next.js 문서
- [API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Authentication](https://nextjs.org/docs/authentication)

### React 문서
- [Hooks](https://react.dev/reference/react)
- [State Management](https://react.dev/learn/managing-state)

---

## 📧 문의 및 지원

프로젝트 관련 문의사항이 있으시면 GitHub Issues를 통해 문의해주세요.

- **Repository**: https://github.com/kohsunwoo12345-cmyk/superplace
- **Issues**: https://github.com/kohsunwoo12345-cmyk/superplace/issues

---

## 📄 문서 정보

- **작성자**: Claude AI
- **최종 수정일**: 2026-01-24
- **버전**: 1.0
- **커밋 ID**: a3b9992

---

## ✅ 완료 체크리스트

- [x] AccessLog 모델 추가
- [x] ActivityLog 모델 추가
- [x] User 모델에 관계 추가
- [x] Prisma DB Push 완료
- [x] GET `/api/admin/access-logs` API 구현
- [x] POST `/api/admin/access-logs` API 구현
- [x] GET `/api/admin/activity-logs` API 구현
- [x] 관리자 접속자 분석 페이지 구현
- [x] SUPER_ADMIN 권한 체크
- [x] 한국 시간(Asia/Seoul) 표시
- [x] 회원/비회원 구분
- [x] 실시간 통계 대시보드
- [x] 필터링 및 검색 기능
- [x] 반응형 UI 구현
- [x] 사이드바 메뉴 추가
- [x] 시드 데이터 스크립트 작성
- [x] 테스트 데이터 생성 (70개 접속 로그, 30개 활동 로그)
- [x] Git 커밋 및 푸시
- [x] 문서화

---

**모든 기능이 성공적으로 구현되었습니다!** 🎉

SUPER_ADMIN 계정으로 로그인하여 `/dashboard/admin/access-analytics` 페이지에서 접속자 추적 기능을 확인하실 수 있습니다.
