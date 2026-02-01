# 통합 AI 봇 관리 시스템

**작성일**: 2026-01-24  
**작성자**: Claude AI  
**버전**: 1.0  
**커밋 ID**: bde7bbd

## 📋 목차

1. [개요](#개요)
2. [주요 기능](#주요-기능)
3. [데이터 모델](#데이터-모델)
4. [API 엔드포인트](#api-엔드포인트)
5. [대시보드 구성](#대시보드-구성)
6. [사용 가이드](#사용-가이드)
7. [보안 및 권한](#보안-및-권한)
8. [배포 정보](#배포-정보)

---

## 개요

통합 AI 봇 관리 시스템은 **AI 봇 관리**와 **AI 봇 전체 목록** 기능을 하나로 통합하여 더욱 강력하고 편리한 봇 관리 기능을 제공합니다.

### 핵심 기능

- ✅ **통합 관리**: 모든 AI 봇을 한 곳에서 관리
- ✅ **폴더 정리**: 폴더를 생성하여 봇을 체계적으로 분류
- ✅ **강력한 검색**: 봇 이름, 설명, ID로 검색
- ✅ **상세 정보**: 각 봇의 역할, 할당 정보, 통계 확인
- ✅ **실시간 업데이트**: 봇 생성, 수정, 삭제 즉시 반영

---

## 주요 기능

### 1. 통합 봇 관리

#### 📊 통계 대시보드
- **전체 봇**: 시스템에 등록된 모든 AI 봇 수
- **활성 봇**: 현재 사용 가능한 봇 수
- **비활성 봇**: 일시 정지된 봇 수
- **총 할당**: 사용자에게 할당된 총 수
- **폴더 수**: 생성된 폴더 수

#### 🔍 검색 및 필터
- **통합 검색**: 봇 이름, 설명, ID를 한 번에 검색
- **폴더 필터**: 특정 폴더의 봇만 표시
- **상태 필터**: 활성/비활성 봇 필터링
- **정렬**: 최신순, 이름순 정렬

#### 📁 폴더 관리
- **폴더 생성**: 새 폴더 추가 (이름, 설명, 색상)
- **폴더 수정**: 폴더 정보 변경
- **폴더 삭제**: 비어있는 폴더 삭제
- **색상 구분**: 8가지 색상으로 폴더 시각화

### 2. 봇 생성 및 관리

#### ➕ 새 봇 추가
입력 필드:
- **봇 ID** (필수): 고유 식별자 (예: math-tutor)
- **이름** (필수): 봇 이름 (예: 수학 튜터)
- **설명** (필수): 봇의 역할과 기능
- **시스템 프롬프트** (필수): AI의 행동 방식 정의
- **폴더**: 봇을 분류할 폴더 선택
- **기능 옵션**:
  - 이미지 입력 허용
  - 음성 출력 허용
  - 음성 입력 허용
- **활성화 상태**: 생성 시 활성화 여부

#### ✏️ 봇 수정
- 봇 정보 수정 (이름, 설명, 프롬프트 등)
- 폴더 이동
- 활성/비활성 토글
- 기능 옵션 변경

#### 🗑️ 봇 삭제
- 할당되지 않은 봇만 삭제 가능
- 할당된 봇 삭제 시 경고 메시지

### 3. 봇 상세 정보

각 봇의 상세 페이지에서 확인 가능:

#### 기본 정보
- 봇 ID, 이름, 설명
- 생성자 정보 (이름, 이메일)
- 생성일시 (한국 시간)
- 활성 상태
- 소속 폴더

#### 시스템 프롬프트
- AI 역할과 행동 방식 전체 내용

#### 기능
- 이미지 입력 지원 여부
- 음성 출력 지원 여부
- 음성 입력 지원 여부

#### 할당 정보
각 할당에 대해 표시:
- **누가**: 사용자 이름, 이메일, 역할
- **언제**: 할당 일시 (한국 시간)
- **어디**: 학원명, 학원 코드
- **얼마나**: 활성 상태, 만료일

**예시 할당 정보**:
```
김철수 (kim@example.com) • 학원장
수학플러스학원 (MP-2024-001)
할당일: 2026년 1월 15일 14:30
상태: 활성
```

---

## 데이터 모델

### BotFolder (폴더)

```prisma
model BotFolder {
  id          String   @id @default(cuid())
  name        String   // 폴더 이름
  description String   // 폴더 설명
  color       String   @default("#3B82F6") // 색상
  userId      String   // 생성자 ID
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  bots        AIBot[]  // 폴더 내 봇들
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**필드 설명**:
- `name`: 폴더 이름 (예: "수학 봇", "영어 봇")
- `description`: 폴더 설명
- `color`: HEX 색상 코드 (예: #3B82F6)
- `userId`: 폴더 생성자 (SUPER_ADMIN)
- `bots`: 폴더에 포함된 봇들

### AIBot (수정사항)

기존 AIBot 모델에 폴더 관계 추가:

```prisma
model AIBot {
  // ... 기존 필드들
  folderId  String?     // 폴더 ID (선택)
  folder    BotFolder?  @relation(fields: [folderId], references: [id])
}
```

---

## API 엔드포인트

### 1. 통합 봇 관리 API

#### GET `/api/admin/bots-unified`

**설명**: 봇 목록 조회 (폴더별, 검색, 필터링)

**권한**: SUPER_ADMIN

**쿼리 파라미터**:
- `search` (string): 검색어 (이름, 설명, ID)
- `folderId` (string): 폴더 ID ("all" | "none" | 폴더ID)
- `isActive` (boolean): 활성 상태 필터
- `sortBy` (string): 정렬 기준 (createdAt, name 등)
- `sortOrder` (string): 정렬 순서 (asc, desc)

**응답**:
```json
{
  "bots": [
    {
      "id": "clxxx",
      "botId": "math-tutor",
      "name": "수학 튜터",
      "description": "수학 문제 해결 도우미",
      "isActive": true,
      "creator": {
        "id": "user-id",
        "name": "관리자",
        "email": "admin@example.com"
      },
      "folder": {
        "id": "folder-id",
        "name": "수학 봇",
        "color": "#3B82F6"
      },
      "assignments": [...],
      "_count": {
        "assignments": 5
      },
      "createdAt": "2026-01-24T10:00:00Z",
      "updatedAt": "2026-01-24T10:00:00Z"
    }
  ],
  "folders": [
    {
      "id": "folder-id",
      "name": "수학 봇",
      "description": "수학 관련 AI 봇",
      "color": "#3B82F6",
      "_count": {
        "bots": 3
      },
      "createdAt": "2026-01-20T10:00:00Z"
    }
  ],
  "stats": {
    "totalBots": 10,
    "activeBots": 8,
    "inactiveBots": 2,
    "totalAssignments": 25,
    "totalFolders": 3
  }
}
```

#### POST `/api/admin/bots-unified`

**설명**: 새 봇 생성

**권한**: SUPER_ADMIN

**요청 본문**:
```json
{
  "botId": "math-tutor",
  "name": "수학 튜터",
  "description": "수학 문제 해결 도우미",
  "systemPrompt": "당신은 수학 튜터입니다...",
  "referenceFiles": ["url1", "url2"],
  "starterMessages": ["안녕하세요", "무엇을 도와드릴까요?"],
  "allowImageInput": true,
  "allowVoiceOutput": false,
  "allowVoiceInput": false,
  "isActive": true,
  "folderId": "folder-id"
}
```

**응답**:
```json
{
  "message": "AI 봇이 생성되었습니다",
  "bot": { /* 생성된 봇 정보 */ }
}
```

### 2. 개별 봇 관리 API

#### GET `/api/admin/bots-unified/[botId]`

**설명**: 특정 봇 상세 정보 조회

**권한**: SUPER_ADMIN

**응답**:
```json
{
  "bot": {
    "id": "clxxx",
    "botId": "math-tutor",
    "name": "수학 튜터",
    "description": "수학 문제 해결 도우미",
    "systemPrompt": "당신은 수학 튜터입니다...",
    "referenceFiles": ["url1", "url2"],
    "starterMessages": ["안녕하세요"],
    "allowImageInput": true,
    "allowVoiceOutput": false,
    "allowVoiceInput": false,
    "isActive": true,
    "creator": { /* 생성자 정보 */ },
    "folder": { /* 폴더 정보 */ },
    "assignments": [
      {
        "id": "assignment-id",
        "user": {
          "id": "user-id",
          "name": "김철수",
          "email": "kim@example.com",
          "role": "DIRECTOR",
          "academy": {
            "id": "academy-id",
            "name": "수학플러스학원",
            "code": "MP-2024-001"
          }
        },
        "grantedBy": { /* 할당자 정보 */ },
        "grantedByRole": "SUPER_ADMIN",
        "isActive": true,
        "assignedAt": "2026-01-15T05:30:00Z",
        "expiresAt": null
      }
    ],
    "_count": {
      "assignments": 5
    },
    "createdAt": "2026-01-24T10:00:00Z",
    "updatedAt": "2026-01-24T10:00:00Z"
  },
  "assignmentStats": {
    "total": 5,
    "active": 5,
    "expired": 0,
    "byRole": {
      "DIRECTOR": 2,
      "TEACHER": 2,
      "STUDENT": 1
    }
  }
}
```

#### PATCH `/api/admin/bots-unified/[botId]`

**설명**: 봇 정보 수정

**권한**: SUPER_ADMIN

**요청 본문** (수정할 필드만):
```json
{
  "name": "수정된 이름",
  "description": "수정된 설명",
  "isActive": false,
  "folderId": "new-folder-id"
}
```

#### DELETE `/api/admin/bots-unified/[botId]`

**설명**: 봇 삭제 (할당되지 않은 봇만)

**권한**: SUPER_ADMIN

**에러 응답** (할당된 봇인 경우):
```json
{
  "error": "이 봇은 사용자에게 할당되어 있습니다",
  "assignmentCount": 5
}
```

### 3. 폴더 관리 API

#### GET `/api/admin/bot-folders`

**설명**: 폴더 목록 조회

**권한**: SUPER_ADMIN

**응답**:
```json
{
  "folders": [
    {
      "id": "folder-id",
      "name": "수학 봇",
      "description": "수학 관련 AI 봇",
      "color": "#3B82F6",
      "_count": {
        "bots": 3
      },
      "createdAt": "2026-01-20T10:00:00Z",
      "updatedAt": "2026-01-20T10:00:00Z"
    }
  ]
}
```

#### POST `/api/admin/bot-folders`

**설명**: 새 폴더 생성

**권한**: SUPER_ADMIN

**요청 본문**:
```json
{
  "name": "수학 봇",
  "description": "수학 관련 AI 봇",
  "color": "#3B82F6"
}
```

#### PATCH `/api/admin/bot-folders?id=[folderId]`

**설명**: 폴더 수정

**권한**: SUPER_ADMIN

#### DELETE `/api/admin/bot-folders?id=[folderId]`

**설명**: 폴더 삭제 (비어있는 폴더만)

**권한**: SUPER_ADMIN

---

## 대시보드 구성

### 페이지 경로
`/dashboard/admin/bots-unified`

### UI 구성

#### 1. 헤더
- 페이지 제목: "통합 AI 봇 관리"
- 설명: "AI 봇을 폴더로 정리하고 관리할 수 있습니다"

#### 2. 통계 카드 (5개)
```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│  전체 봇    │  활성 봇    │  비활성 봇  │  총 할당    │   폴더      │
│     10      │      8      │      2      │     25      │      3      │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

#### 3. 검색 및 필터
```
┌────────────────────────────────────────────────────────────────────┐
│  검색       │ 폴더         │ 상태        │ 정렬                     │
│  [________] │ [전체 ▼]    │ [전체 ▼]    │ [최신순 ▼]              │
│                                                                     │
│  [+ 새 봇 추가] [+ 새 폴더 추가] [필터 초기화]                    │
│                                                                     │
│  총 10개의 봇이 검색되었습니다                                     │
└────────────────────────────────────────────────────────────────────┘
```

#### 4. 봇 카드 목록 (그리드)
```
┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
│ 🤖 수학 튜터             │ 🤖 영어 선생님           │ 🤖 과학 도우미           │
│ ID: math-tutor          │ ID: english-teacher     │ ID: science-helper      │
│ 📁 수학 봇              │ 📁 영어 봇              │ 📁 과학 봇              │
│ ✅ 활성                 │ ✅ 활성                 │ ❌ 비활성               │
│                         │                         │                         │
│ 수학 문제 해결 도우미    │ 영어 회화 연습          │ 과학 실험 설명          │
│                         │                         │                         │
│ 👥 5명에게 할당됨        │ 👥 3명에게 할당됨        │ 👥 0명에게 할당됨        │
│ 생성: 2026년 1월 24일   │ 생성: 2026년 1월 23일   │ 생성: 2026년 1월 22일   │
│                         │                         │                         │
│ [👁️ 상세보기] [🗑️]     │ [👁️ 상세보기] [🗑️]     │ [👁️ 상세보기] [🗑️]     │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘
```

#### 5. 봇 상세 모달
클릭 시 표시되는 정보:
- **기본 정보**: ID, 이름, 설명, 상태, 폴더, 생성자, 생성일
- **시스템 프롬프트**: 전체 내용
- **기능**: 이미지/음성 입/출력 지원
- **할당 정보**: 각 할당의 상세 정보 (사용자, 학원, 일시, 상태)

---

## 사용 가이드

### 1. 폴더 생성하기

1. **[+ 새 폴더 추가]** 버튼 클릭
2. 폴더 정보 입력:
   - 폴더 이름 (필수)
   - 설명 (선택)
   - 색상 선택 (8가지 중 하나)
3. **[생성]** 클릭

**예시**:
- 이름: "수학 봇"
- 설명: "수학 교육용 AI 봇 모음"
- 색상: 파란색 (#3B82F6)

### 2. 새 봇 추가하기

1. **[+ 새 봇 추가]** 버튼 클릭
2. 봇 정보 입력:
   - **봇 ID**: 고유 식별자 (영문, 숫자, 하이픈만)
   - **이름**: 사용자에게 보여질 이름
   - **설명**: 봇의 역할과 기능
   - **시스템 프롬프트**: AI 행동 정의
   - **폴더**: 분류할 폴더 선택
   - **기능 옵션**: 필요한 기능 체크
3. **[생성]** 클릭

**예시**:
```
봇 ID: math-tutor
이름: 수학 튜터
설명: 중고등 수학 문제 해결을 도와주는 AI 튜터
시스템 프롬프트: 당신은 친절한 수학 튜터입니다. 
                학생이 문제를 이해할 수 있도록 단계별로 설명해주세요.
폴더: 수학 봇
✅ 이미지 입력 허용 (수식 사진 인식)
❌ 음성 출력 허용
❌ 음성 입력 허용
✅ 활성화
```

### 3. 봇 검색하기

**검색 필드**:
- 봇 이름, 설명, ID에서 검색
- 실시간 검색 (입력 시 즉시 필터링)
- 검색어 하이라이트

**필터**:
- **폴더**: 전체, 폴더 없음, 또는 특정 폴더
- **상태**: 전체, 활성, 비활성
- **정렬**: 최신순, 오래된순, 이름순

### 4. 봇 상세 정보 확인

1. 봇 카드에서 **[👁️ 상세보기]** 클릭
2. 모달 창에서 확인:
   - 기본 정보
   - 시스템 프롬프트 전문
   - 지원 기능
   - **할당 정보**: 누가, 언제, 어디에 할당되었는지

**할당 정보 예시**:
```
김철수 (kim@example.com) • 학원장
수학플러스학원 (MP-2024-001)
할당일: 2026년 1월 15일 14:30
상태: ✅ 활성
```

### 5. 봇 수정하기

봇 상세 정보 API를 통해 수정 가능:
- 이름, 설명 변경
- 시스템 프롬프트 수정
- 폴더 이동
- 기능 옵션 변경
- 활성/비활성 토글

### 6. 봇 삭제하기

1. 봇 카드에서 **[🗑️]** 버튼 클릭
2. 확인 대화상자에서 **[확인]**
3. **주의**: 할당된 봇은 삭제 불가

---

## 보안 및 권한

### 접근 권한

- **SUPER_ADMIN 전용**: 모든 기능 접근 가능
- 다른 역할은 접근 불가

### 권한 체크

모든 API 엔드포인트에서:
1. 세션 인증 확인
2. SUPER_ADMIN 역할 확인
3. 실패 시 401/403 에러 반환

### 데이터 보안

- 폴더는 생성자(SUPER_ADMIN)만 수정/삭제 가능
- 할당된 봇은 삭제 방지
- 봇 안에 봇이 있는 폴더는 삭제 방지

---

## 배포 정보

### 저장소
- **Repository**: https://github.com/kohsunwoo12345-cmyk/superplace
- **Branch**: main
- **Commit ID**: bde7bbd

### 배포 URL
- **Production**: https://superplace-study.vercel.app
- **Dashboard**: https://superplace-study.vercel.app/dashboard/admin/bots-unified

### 배포 상태
- **Vercel 자동 배포**: 진행 중 (2-3분 소요)

---

## 파일 구조

```
/home/user/webapp/
├── prisma/
│   └── schema.prisma                            # BotFolder 모델 추가
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── admin/
│   │   │       ├── bots-unified/
│   │   │       │   ├── route.ts                 # 통합 봇 관리 API
│   │   │       │   └── [botId]/
│   │   │       │       └── route.ts             # 개별 봇 관리 API
│   │   │       └── bot-folders/
│   │   │           └── route.ts                 # 폴더 관리 API
│   │   └── dashboard/
│   │       └── admin/
│   │           └── bots-unified/
│   │               └── page.tsx                 # 통합 봇 관리 대시보드
│   └── components/
│       └── dashboard/
│           └── Sidebar.tsx                      # 사이드바 (메뉴 업데이트)
└── BOT_MANAGEMENT_UNIFIED_GUIDE.md              # 이 가이드
```

---

## 향후 개선 사항

### 1. 고급 기능
- [ ] 봇 복제 기능
- [ ] 봇 템플릿 라이브러리
- [ ] 봇 버전 관리
- [ ] 봇 사용 통계 (호출 횟수, 사용 시간)

### 2. 폴더 기능
- [ ] 폴더 내 하위 폴더
- [ ] 폴더 공유 (다른 관리자와)
- [ ] 폴더 즐겨찾기

### 3. 대량 작업
- [ ] 여러 봇 동시 선택
- [ ] 대량 폴더 이동
- [ ] 대량 활성/비활성 변경

### 4. 검색 강화
- [ ] 고급 필터 (생성일 범위, 생성자 등)
- [ ] 저장된 검색 조건
- [ ] 검색 기록

### 5. 엑스포트
- [ ] 봇 정보 엑스포트 (CSV, JSON)
- [ ] 할당 현황 리포트 생성
- [ ] 통계 대시보드

---

## 완료 체크리스트

- [x] BotFolder 데이터 모델 추가
- [x] Prisma DB 푸시
- [x] 통합 봇 관리 API 구현
  - [x] GET /api/admin/bots-unified
  - [x] POST /api/admin/bots-unified
- [x] 개별 봇 관리 API 구현
  - [x] GET /api/admin/bots-unified/[botId]
  - [x] PATCH /api/admin/bots-unified/[botId]
  - [x] DELETE /api/admin/bots-unified/[botId]
- [x] 폴더 관리 API 구현
  - [x] GET /api/admin/bot-folders
  - [x] POST /api/admin/bot-folders
  - [x] PATCH /api/admin/bot-folders
  - [x] DELETE /api/admin/bot-folders
- [x] 통합 봇 관리 대시보드 페이지
  - [x] 통계 카드
  - [x] 검색 및 필터
  - [x] 봇 카드 목록
  - [x] 봇 상세 모달
  - [x] 새 봇 추가 모달
  - [x] 새 폴더 추가 모달
- [x] 사이드바 메뉴 업데이트
- [x] 한국 시간 표시 (Asia/Seoul)
- [x] SUPER_ADMIN 권한 체크
- [x] 검색어 하이라이트
- [x] 폴더별 색상 구분
- [x] 할당 정보 상세 표시
- [x] 커밋 및 푸시
- [x] 문서 작성

---

## 테스트 시나리오

### 시나리오 1: 폴더 생성 및 봇 추가
1. SUPER_ADMIN으로 로그인
2. `/dashboard/admin/bots-unified` 접속
3. [+ 새 폴더 추가] 클릭
4. 폴더 정보 입력 후 생성
5. [+ 새 봇 추가] 클릭
6. 봇 정보 입력 (생성한 폴더 선택)
7. 봇이 폴더 색상으로 표시되는지 확인

### 시나리오 2: 봇 검색 및 필터
1. 검색 필드에 "수학" 입력
2. 검색어가 하이라이트되는지 확인
3. 폴더 필터로 특정 폴더 선택
4. 해당 폴더의 봇만 표시되는지 확인
5. 상태 필터로 "활성"만 선택
6. 활성 봇만 표시되는지 확인

### 시나리오 3: 봇 상세 정보 확인
1. 임의의 봇 카드에서 [👁️ 상세보기] 클릭
2. 모달에서 다음 정보 확인:
   - 기본 정보 (ID, 이름, 설명, 상태, 폴더)
   - 시스템 프롬프트
   - 기능 (이미지/음성 입출력)
   - 할당 정보 (사용자, 학원, 일시)
3. 한국 시간으로 표시되는지 확인

### 시나리오 4: 봇 삭제 제한
1. 할당된 봇의 [🗑️] 버튼 클릭
2. "이 봇은 사용자에게 할당되어 있습니다" 오류 확인
3. 할당되지 않은 봇 삭제 시도
4. 정상 삭제되는지 확인

---

**모든 요구사항이 구현되었습니다!** 🎉

SUPER_ADMIN으로 `/dashboard/admin/bots-unified`에 접속하여 통합 AI 봇 관리 시스템을 사용해보세요.
