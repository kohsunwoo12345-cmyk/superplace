# 📚 학생 AI 봇 학습 관리 시스템 구현 완료

**작성일**: 2026-01-24  
**상태**: ✅ 구현 완료 (대시보드 메뉴 자동 표시는 추가 작업 필요)

## 📋 구현 완료 항목

### 1️⃣ 봇 할당 계층 구조
✅ **관리자 → 학원장 → 선생님 → 학생 순차 할당**
- 관리자(SUPER_ADMIN)가 학원장(DIRECTOR)에게 봇 할당
- 학원장이 선생님(TEACHER)에게 봇 할당
- 선생님이 학생(STUDENT)에게 봇 할당
- BotAssignment 모델의 grantedByRole에 TEACHER 추가

### 2️⃣ 학생 대시보드
✅ **할당받은 AI 봇 및 사용 기록 표시**
- `/dashboard/student` 페이지 생성
- 할당받은 봇 목록 카드 형식으로 표시
- 봇별 사용 통계 (대화 횟수, 메시지 수, 참여도)
- 학습 활동 기록 그래프
- 학습 팁 표시

### 3️⃣ 대화 기록 시스템
✅ **모든 대화를 DB에 자동 저장**
- BotConversation 모델: 대화 내역 저장
- 10개 메시지마다 자동 저장
- 메시지 통계 자동 계산 (총 메시지, 사용자/봇 메시지 분리)
- 세션 시간 추적

### 4️⃣ AI 자동 분석 시스템
✅ **OpenAI를 활용한 학습 참여도 자동 분석**
- ConversationAnalysis 모델: 분석 결과 저장
- 참여도 점수 (engagementScore 0-100)
- 응답 품질, 질문 깊이, 일관성 점수
- AI가 분석한 강점, 약점, 추천사항
- 종합 분석 요약

### 5️⃣ 선생님 봇 할당 기능
✅ **선생님이 학생에게 봇 할당 가능**
- `/api/teacher/assign-bot` 엔드포인트
- 선생님에게 할당된 봇만 학생에게 재할당 가능
- 같은 학원 학생에게만 할당 가능
- 할당 기간 설정 지원 (일/주/개월/년 또는 영구)

## 🛠 기술 구현

### 데이터베이스 스키마

#### BotConversation (대화 기록)
```prisma
model BotConversation {
  id            String      @id @default(cuid())
  userId        String      // 대화한 사용자
  botId         String      // 대화한 봇 ID
  messages      Json        // 대화 메시지 배열
  messageCount  Int         @default(0) // 총 메시지 수
  userMessageCount Int      @default(0) // 사용자 메시지 수
  botMessageCount Int       @default(0) // 봇 메시지 수
  sessionDuration Int?      // 대화 시간 (초)
  lastMessageAt DateTime    // 마지막 메시지 시간
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  user          User        @relation(fields: [userId], references: [id])
  analysis      ConversationAnalysis? // AI 분석 결과
}
```

#### ConversationAnalysis (AI 분석 결과)
```prisma
model ConversationAnalysis {
  id                String      @id @default(cuid())
  conversationId    String      @unique
  userId            String
  botId             String
  
  // 참여도 지표
  engagementScore   Float       @default(0) // 0-100
  responseQuality   Float       @default(0) // 0-100
  questionDepth     Float       @default(0) // 0-100
  consistency       Float       @default(0) // 0-100
  
  // 행동 분석
  avgResponseTime   Int?
  avgMessageLength  Int?
  topicDiversity    Float       @default(0)
  
  // AI 분석 결과
  strengths         String[]    // 강점
  weaknesses        String[]    // 약점
  recommendations   String[]    // 추천 사항
  summary           String      @db.Text // 종합 분석
  
  analyzedAt        DateTime    @default(now())
  analyzedBy        String      @default("AI")
  
  conversation      BotConversation @relation(...)
  user              User        @relation(...)
}
```

### API 엔드포인트

#### `/api/bot-conversation` (POST/GET)
**POST**: 대화 저장
```typescript
{
  botId: string;
  messages: Array<{role, content, timestamp}>;
  sessionDuration?: number; // 초 단위
}
```

**GET**: 사용자의 대화 기록 조회
```typescript
?botId=study-helper&limit=10
```

#### `/api/conversation-analysis` (POST/GET)
**POST**: AI로 대화 분석
```typescript
{
  conversationId: string;
}

// OpenAI API 호출하여 분석
// 응답: {
//   engagementScore: 85,
//   strengths: ["적극적인 질문", "명확한 표현"],
//   weaknesses: ["더 깊이 있는 질문 필요"],
//   recommendations: ["개념을 더 깊이 탐구해보세요"],
//   summary: "학생은 적극적으로 질문하고 있으며..."
// }
```

**GET**: 학생의 분석 결과 조회
```typescript
?userId=student_id&botId=study-helper
```

#### `/api/teacher/assign-bot` (POST)
선생님이 학생에게 봇 할당
```typescript
{
  userId: string; // 학생 ID
  botId: string;
  duration?: number;
  durationUnit?: 'days' | 'weeks' | 'months' | 'years';
}

// 검증:
// 1. 선생님이 해당 봇을 할당받았는지
// 2. 같은 학원의 학생인지
// 3. 대상이 STUDENT 역할인지
```

#### `/api/student/assigned-bots` (GET)
학생에게 할당된 봇 조회
```typescript
// 응답
{
  bots: [
    {
      id: "study-helper",
      name: "학습 도우미",
      icon: "📚",
      // ...
    }
  ]
}
```

#### `/api/student/conversation-stats` (GET)
학생의 대화 통계 조회
```typescript
// 응답
{
  stats: [
    {
      botId: "study-helper",
      botName: "학습 도우미",
      botIcon: "📚",
      totalConversations: 15,
      totalMessages: 120,
      lastUsed: "2026-01-24T...",
      avgEngagement: 78.5
    }
  ]
}
```

### 프론트엔드 구현

#### 학생 대시보드 (`/dashboard/student`)
```tsx
export default function StudentDashboardPage() {
  // 할당받은 봇 조회
  const [assignedBots, setAssignedBots] = useState<AIBot[]>([]);
  
  // 사용 통계 조회
  const [stats, setStats] = useState<ConversationStat[]>([]);

  // UI 구성:
  // 1. 헤더: 이용 가능한 봇 개수
  // 2. 할당받은 AI 봇 카드 (클릭 시 채팅 페이지로 이동)
  // 3. 학습 활동 기록 (봇별 대화 횟수, 메시지 수, 참여도)
  // 4. 학습 팁
}
```

#### 채팅 페이지 대화 자동 저장
```tsx
// 10개 메시지마다 자동 저장
useEffect(() => {
  if (messages.length >= 10 && messages.length % 10 === 0 && gem) {
    saveConversation();
  }
}, [messages.length]);

const saveConversation = async () => {
  const sessionDuration = Math.floor(
    (new Date().getTime() - sessionStartTime.current.getTime()) / 1000
  );
  
  await fetch('/api/bot-conversation', {
    method: 'POST',
    body: JSON.stringify({
      botId: gem.id,
      messages,
      sessionDuration,
    }),
  });
};

// 대화 초기화 시에도 저장
const clearChat = async () => {
  await saveConversation();
  setMessages([]);
  sessionStartTime.current = new Date();
};
```

## 🎯 AI 분석 알고리즘

### 참여도 계산
```typescript
// 기본 참여도 점수
engagementScore = 
  (messageCount / 10) * 50 +  // 메시지 개수 (50%)
  (avgMessageLength / 100) * 50;  // 평균 메시지 길이 (50%)

// OpenAI API로 추가 분석
const prompt = `
다음은 학생과 AI 튜터의 대화 내역입니다. 
학생의 학습 참여도와 이해도를 분석해주세요.

대화 내역:
${JSON.stringify(messages)}

다음 항목을 JSON 형식으로 분석해주세요:
1. strengths: 학생의 강점 (배열, 최대 3개)
2. weaknesses: 개선이 필요한 부분 (배열, 최대 3개)
3. recommendations: 추천 사항 (배열, 최대 3개)
4. summary: 종합 분석 (200자 이내)
`;
```

### 분석 결과 예시
```json
{
  "engagementScore": 85,
  "responseQuality": 78,
  "questionDepth": 82,
  "consistency": 90,
  "avgMessageLength": 45,
  "strengths": [
    "적극적으로 질문하고 있습니다",
    "명확하고 구체적인 표현을 사용합니다",
    "개념을 이해하려는 노력이 보입니다"
  ],
  "weaknesses": [
    "더 깊이 있는 질문이 필요합니다",
    "예제를 직접 만들어보면 좋겠습니다"
  ],
  "recommendations": [
    "개념을 더 깊이 탐구해보세요",
    "학습한 내용을 정리하는 습관을 기르세요",
    "예제를 직접 만들어보세요"
  ],
  "summary": "학생은 적극적으로 질문하고 있으며, 기본 개념을 잘 이해하고 있습니다. 다만 더 깊이 있는 학습을 위해 스스로 예제를 만들어보는 것을 추천합니다."
}
```

## 🎨 UI/UX

### 학생 대시보드
- ✅ 할당받은 봇 카드 그리드 (2-4열 반응형)
- ✅ 각 봇 카드: 아이콘, 이름, 설명, 사용 통계, "대화 시작하기" 버튼
- ✅ 학습 활동 기록: 봇별 대화 횟수, 메시지 수, 참여도 그래프
- ✅ 참여도 프로그레스 바
- ✅ 학습 팁 카드

### 봇 카드 호버 효과
```tsx
className={`
  cursor-pointer 
  hover:shadow-lg 
  transition-all 
  duration-200 
  border-2 
  hover:border-${bot.color}-300 
  bg-gradient-to-br ${bot.bgGradient}
`}
```

## 🚀 배포 정보

- **커밋 ID**: `ce247a9`
- **브랜치**: `main`
- **GitHub**: https://github.com/kohsunwoo12345-cmyk/superplace
- **배포 URL**: https://superplace-study.vercel.app
- **배포 상태**: Vercel 자동 배포 진행 중 (약 2-3분)

## 📊 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `prisma/schema.prisma` | BotConversation, ConversationAnalysis 모델 추가 |
| `src/app/api/bot-conversation/route.ts` | 대화 저장 및 조회 API |
| `src/app/api/conversation-analysis/route.ts` | AI 분석 API (OpenAI 활용) |
| `src/app/api/teacher/assign-bot/route.ts` | 선생님→학생 봇 할당 API |
| `src/app/api/student/assigned-bots/route.ts` | 학생 할당 봇 조회 API |
| `src/app/api/student/conversation-stats/route.ts` | 학생 대화 통계 API |
| `src/app/dashboard/student/page.tsx` | 학생 대시보드 UI |
| `src/app/dashboard/ai-gems/[gemId]/page.tsx` | 대화 자동 저장 로직 추가 |

## 🧪 테스트 방법

### 1. 학원장이 선생님에게 봇 할당
1. 관리자 계정 → `/dashboard/admin/bot-assignment`
2. 학원장 찾기 → 봇 할당 버튼 클릭
3. 기간 설정 → 할당하기

### 2. 선생님이 학생에게 봇 할당
1. 선생님 계정 로그인
2. 학생 관리 페이지 (추가 구현 필요) 또는 API 직접 호출
```bash
curl -X POST https://superplace-study.vercel.app/api/teacher/assign-bot \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "student_id",
    "botId": "study-helper",
    "duration": 30,
    "durationUnit": "days"
  }'
```

### 3. 학생 대시보드 확인
1. 학생 계정 로그인
2. `/dashboard/student` 접속
3. 할당받은 봇 목록 확인
4. 봇 클릭 → 채팅 페이지 이동
5. 대화 후 대시보드 복귀 → 사용 통계 확인

### 4. AI 분석 실행 (학원장/선생님)
```bash
# 대화 ID 조회
curl https://superplace-study.vercel.app/api/bot-conversation

# AI 분석 실행
curl -X POST https://superplace-study.vercel.app/api/conversation-analysis \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "conversation_id"}'

# 분석 결과 조회
curl https://superplace-study.vercel.app/api/conversation-analysis?userId=student_id
```

## ⚠️ 주의사항

### OpenAI API 키 필요
- **OPENAI_API_KEY** 환경 변수 설정 필요
- API 키가 없으면 기본 통계만 계산 (AI 분석 제외)
- 비용: GPT-4o-mini 사용 시 대화당 약 $0.001-0.005

### 대화 저장 빈도
- 현재: 10개 메시지마다 자동 저장
- 조정 가능: 5개, 20개 등으로 변경 가능
- 브라우저 종료 시: clearChat 호출하여 수동 저장

### 권한 체크
- 학생은 자신의 통계만 조회 가능
- 선생님은 같은 학원 학생의 통계 조회 가능
- 학원장은 모든 학생의 통계 조회 가능 (구현 필요)

## 🔮 향후 개선 사항

### 1. 대시보드 메뉴에 봇 자동 표시 ⏳
- [ ] 사이드바/헤더에 할당받은 봇 메뉴 추가
- [ ] 역할별로 다른 메뉴 표시
  - 학생: 할당받은 봇 목록
  - 선생님: 할당받은 봇 + 학생 관리
  - 학원장: 봇 관리 + 할당 관리

### 2. 선생님 대시보드
- [ ] 선생님이 학생 목록 조회
- [ ] 학생별로 봇 할당/취소
- [ ] 학생의 학습 진도 확인
- [ ] 학생별 AI 분석 결과 조회

### 3. 학원장 대시보드 개선
- [ ] 전체 학생의 학습 통계 대시보드
- [ ] 봇별 사용률 통계
- [ ] 참여도 높은/낮은 학생 리스트
- [ ] 선생님별 봇 할당 현황

### 4. 실시간 분석
- [ ] 대화 중 실시간 참여도 표시
- [ ] 학습 패턴 감지 및 알림
- [ ] 학습 목표 설정 및 달성률 추적

### 5. 알림 시스템
- [ ] 학생이 오래 사용하지 않으면 알림
- [ ] 참여도가 낮아지면 선생님에게 알림
- [ ] 우수 학습 활동 시 칭찬 메시지

## ✅ 완료 체크리스트

- [x] BotConversation, ConversationAnalysis 모델 추가
- [x] BotAssignment에 TEACHER 역할 추가
- [x] 대화 자동 저장 로직 구현
- [x] AI 분석 API 구현 (OpenAI 활용)
- [x] 선생님→학생 봇 할당 API
- [x] 학생 대시보드 페이지 생성
- [x] 학생 할당 봇 조회 API
- [x] 학생 대화 통계 API
- [x] 코드 커밋 및 푸시
- [ ] **대시보드 메뉴에 봇 자동 표시** ← 🚨 추가 작업 필요
- [ ] 선생님 대시보드 (학생 관리)
- [ ] 학원장 통계 대시보드
- [ ] Vercel 배포 완료 및 프로덕션 테스트

---

**작성자**: Claude AI  
**최종 수정**: 2026-01-24  
**버전**: 1.0  
**관련 문서**: 
- `BOT_MANAGEMENT_IMPROVEMENTS.md`
- `VOICE_FEATURE_IMPLEMENTATION.md`
- `EMOJI_PICKER_FEATURE.md`
- `AI_BOT_MULTIMODAL_SYSTEM.md`
