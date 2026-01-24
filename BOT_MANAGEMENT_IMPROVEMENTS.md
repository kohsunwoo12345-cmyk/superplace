# 🎯 봇 관리 및 할당 기능 개선 완료

**작성일**: 2026-01-24  
**상태**: ✅ 완료

## 📋 구현 완료 항목

### 1️⃣ 봇 수정 기능 개선
✅ **EditBotDialog 완전 리뉴얼**
- 새 봇 추가(CreateBotDialog)와 동일한 기능 제공
- 이모지 선택 UI (390+ 이모지, 13개 카테고리)
- 파일 업로드 (PDF, DOCX 등)
- 스타터 메시지 관리 (최대 4개)
- 멀티모달 기능 설정 (이미지 입력, 음성 출력, 음성 입력)

### 2️⃣ 스타터 메시지 기능
✅ **채팅 시작 시 추천 질문 표시**
- 관리자가 봇 생성/수정 시 스타터 메시지 최대 4개 설정 가능
- 채팅 페이지에서 메시지가 없을 때 버튼 형태로 표시
- 버튼 클릭 시 입력창에 자동 입력
- DB에 starterMessages 필드로 저장 (String[] 배열)

### 3️⃣ 봇 할당 기간 설정
✅ **학원장에게 봇 할당 시 만료일 설정 가능**
- 영구 할당 (기본값, expiresAt = null)
- 기간 제한 할당:
  - **일** 단위 (1일 ~ N일)
  - **주** 단위 (1주 ~ N주)
  - **개월** 단위 (1개월 ~ N개월)
  - **년** 단위 (1년 ~ N년)
- AssignBotDialog 컴포넌트로 UI 제공
- API에서 자동으로 만료일 계산 및 저장

### 4️⃣ 봇 할당 개선
✅ **할당 프로세스 개선**
- 할당 버튼 클릭 시 Dialog 표시
- 기간 선택 후 할당
- 기존 할당이 있으면 만료일 업데이트
- 만료일 정보는 BotAssignment 테이블의 expiresAt에 저장

## 🛠 기술 구현

### 데이터베이스 스키마 변경

#### AIBot 모델
```prisma
model AIBot {
  // ... 기존 필드들
  starterMessages String[]             // 채팅 시작 시 추천 질문 (최대 4개) ← NEW
  // ... 나머지 필드들
}
```

#### BotAssignment 모델 (기존)
```prisma
model BotAssignment {
  // ... 기존 필드들
  expiresAt     DateTime?   // 만료일 (선택 사항) ← 이미 존재, 이제 사용 가능
}
```

### API 엔드포인트 업데이트

#### `/api/admin/assign-bot` (POST)
```typescript
// 요청
{
  userId: string;
  botId: string;
  duration?: number;        // NEW
  durationUnit?: 'days' | 'weeks' | 'months' | 'years'; // NEW
}

// 만료일 계산 로직
let expiresAt: Date | null = null;
if (duration && durationUnit) {
  const now = new Date();
  switch (durationUnit) {
    case 'days':
      expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
      break;
    case 'weeks':
      expiresAt = new Date(now.getTime() + duration * 7 * 24 * 60 * 60 * 1000);
      break;
    case 'months':
      expiresAt = new Date(now.setMonth(now.getMonth() + duration));
      break;
    case 'years':
      expiresAt = new Date(now.setFullYear(now.getFullYear() + duration));
      break;
  }
}
```

#### `/api/ai-bots` (GET)
```typescript
// 응답에 starterMessages 추가
{
  bots: [
    {
      // ... 기존 필드들
      starterMessages: ["질문1", "질문2", "질문3", "질문4"],
    }
  ]
}
```

#### `/api/admin/ai-bots` (POST)
```typescript
// 요청
{
  // ... 기존 필드들
  starterMessages: string[]; // NEW
}
```

#### `/api/admin/ai-bots/[id]` (PATCH)
```typescript
// 요청 (모든 필드 선택적)
{
  // ... 기존 필드들
  starterMessages?: string[];
  enableImageInput?: boolean;
  enableVoiceOutput?: boolean;
  enableVoiceInput?: boolean;
}
```

### UI 컴포넌트

#### EditBotDialog 개선
```tsx
// src/components/admin/EditBotDialog.tsx
export function EditBotDialog({ bot, open, onOpenChange, onSuccess }) {
  // 이모지 선택
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // 파일 업로드
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 스타터 메시지 관리
  const [newStarterMessage, setNewStarterMessage] = useState("");
  
  // 멀티모달 설정
  const [formData, setFormData] = useState({
    // ... 기존 필드들
    starterMessages: bot.starterMessages || [],
    enableImageInput: bot.enableImageInput || false,
    enableVoiceOutput: bot.enableVoiceOutput || false,
    enableVoiceInput: bot.enableVoiceInput || false,
  });
  
  // 스타터 메시지 추가
  const addStarterMessage = () => {
    if (newStarterMessage.trim() && formData.starterMessages.length < 4) {
      setFormData(prev => ({
        ...prev,
        starterMessages: [...prev.starterMessages, newStarterMessage.trim()],
      }));
      setNewStarterMessage("");
    }
  };
  
  // 스타터 메시지 삭제
  const removeStarterMessage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      starterMessages: prev.starterMessages.filter((_, i) => i !== index),
    }));
  };
}
```

#### AssignBotDialog (신규)
```tsx
// src/components/admin/AssignBotDialog.tsx
export function AssignBotDialog({ director, bot, open, onOpenChange, onSuccess }) {
  const [duration, setDuration] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<string>('months');
  const [permanent, setPermanent] = useState(true);
  
  const handleSubmit = async () => {
    const response = await fetch('/api/admin/assign-bot', {
      method: 'POST',
      body: JSON.stringify({
        userId: director.id,
        botId: bot.id,
        duration: permanent ? null : duration,
        durationUnit: permanent ? null : durationUnit,
      }),
    });
  };
}
```

#### 봇 할당 페이지
```tsx
// src/app/dashboard/admin/bot-assignment/page.tsx
const [assignDialog, setAssignDialog] = useState<{
  director: Director;
  bot: AIBot;
} | null>(null);

// 할당 버튼
<Button
  onClick={() => setAssignDialog({ director, bot })}
>
  할당
</Button>

// 할당 Dialog
{assignDialog && (
  <AssignBotDialog
    director={assignDialog.director}
    bot={assignDialog.bot}
    onSuccess={() => {
      setMessage({ type: 'success', text: 'AI 봇이 성공적으로 할당되었습니다!' });
      fetchDirectors();
    }}
  />
)}
```

#### 채팅 페이지 스타터 메시지
```tsx
// src/app/dashboard/ai-gems/[gemId]/page.tsx
{messages.length === 0 && (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
    {(gem.starterMessages && gem.starterMessages.length > 0
      ? gem.starterMessages
      : getSuggestions(gem.id)
    ).map((suggestion, idx) => (
      <Button
        variant="outline"
        onClick={() => setInput(suggestion)}
      >
        {suggestion}
      </Button>
    ))}
  </div>
)}
```

## 🎨 UI/UX 개선사항

### EditBotDialog
- ✅ 390개 이상 이모지 선택 UI
- ✅ 파일 드래그 앤 드롭 업로드
- ✅ 파일 미리보기 및 삭제
- ✅ 스타터 메시지 추가/삭제 (최대 4개)
- ✅ 멀티모달 기능 ON/OFF 스위치
- ✅ 봇 활성화 토글

### AssignBotDialog
- ✅ 영구 할당 체크박스
- ✅ 기간 입력 (숫자)
- ✅ 단위 선택 드롭다운 (일/주/개월/년)
- ✅ 할당 정보 미리보기 ("이 봇은 3개월 동안 사용 가능합니다")

### 채팅 페이지
- ✅ 메시지가 없을 때 스타터 메시지 버튼 표시
- ✅ 2열 그리드 레이아웃 (반응형)
- ✅ 버튼 클릭 시 입력창에 자동 입력

## 🚀 배포 정보

- **커밋 ID**: `df8f681`
- **브랜치**: `main`
- **GitHub**: https://github.com/kohsunwoo12345-cmyk/superplace
- **배포 URL**: https://superplace-study.vercel.app
- **배포 상태**: Vercel 자동 배포 진행 중 (약 2-3분)

## 📊 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `prisma/schema.prisma` | AIBot에 starterMessages 필드 추가 |
| `src/components/admin/EditBotDialog.tsx` | 이모지 선택, 파일 업로드, 스타터 메시지, 멀티모달 설정 추가 |
| `src/components/admin/AssignBotDialog.tsx` | 신규 생성: 봇 할당 Dialog (기간 선택 UI) |
| `src/app/dashboard/admin/bot-assignment/page.tsx` | AssignBotDialog 통합 |
| `src/app/dashboard/ai-gems/[gemId]/page.tsx` | 스타터 메시지 표시 로직 추가 |
| `src/app/api/admin/assign-bot/route.ts` | duration/durationUnit 처리 및 expiresAt 계산 |
| `src/app/api/ai-bots/route.ts` | starterMessages 필드 반환 |
| `src/app/api/admin/ai-bots/route.ts` | POST 시 starterMessages 저장 |
| `src/app/api/admin/ai-bots/[id]/route.ts` | PATCH 시 starterMessages, 멀티모달 필드 업데이트 |

## 🧪 테스트 방법

### 1. 봇 수정 기능 테스트
1. 관리자 계정으로 로그인
2. `/dashboard/admin/bot-assignment` 접속
3. 커스텀 봇의 **수정(Edit)** 아이콘 클릭
4. 이모지 선택 버튼 클릭 → 이모지 선택
5. 파일 업로드 → PDF/DOCX 파일 선택
6. 스타터 메시지 입력 → 추가 버튼 클릭 (최대 4개)
7. 멀티모달 기능 토글 (이미지 입력, 음성 출력, 음성 입력)
8. **수정 완료** 클릭

### 2. 스타터 메시지 테스트
1. 봇 수정에서 스타터 메시지 4개 추가
2. 봇 저장
3. 해당 봇의 채팅 페이지 접속 (`/dashboard/ai-gems/{botId}`)
4. 메시지가 없는 초기 화면에서 스타터 메시지 버튼 4개 확인
5. 버튼 클릭 → 입력창에 텍스트 자동 입력 확인

### 3. 봇 할당 기간 설정 테스트
1. 관리자 계정으로 로그인
2. `/dashboard/admin/bot-assignment` 접속
3. 학원장 카드에서 봇 **할당** 버튼 클릭
4. Dialog에서 기간 설정:
   - **영구 할당**: 체크박스 선택 → 할당하기
   - **기간 제한**: 체크박스 해제 → 기간 입력 (예: 3) → 단위 선택 (예: 개월) → 할당하기
5. 할당 완료 메시지 확인
6. 학원장 카드에서 봇이 초록색으로 표시되는지 확인

### 4. 만료일 확인 (DB 직접 조회)
```sql
SELECT 
  u.name as director_name,
  ba.botId,
  ba.isActive,
  ba.expiresAt,
  ba.createdAt
FROM BotAssignment ba
JOIN User u ON ba.userId = u.id
WHERE u.role = 'DIRECTOR'
ORDER BY ba.createdAt DESC;
```

## 📝 사용 예시

### 봇 생성 시 스타터 메시지 설정
```
스타터 메시지 1: "이차방정식의 근의 공식을 설명해주세요"
스타터 메시지 2: "광합성 과정을 쉽게 설명해주세요"
스타터 메시지 3: "영어 문법을 체계적으로 배우고 싶어요"
스타터 메시지 4: "한국사 연대를 외우는 팁을 주세요"
```

### 봇 할당 시나리오

#### 시나리오 1: 무료 체험 (7일)
- 기간: 7일
- 만료일: 2026-01-31
- 용도: 신규 학원장 무료 체험 제공

#### 시나리오 2: 월 구독 (1개월)
- 기간: 1개월
- 만료일: 2026-02-24
- 용도: 월 단위 구독 서비스

#### 시나리오 3: 연간 구독 (1년)
- 기간: 1년
- 만료일: 2027-01-24
- 용도: 연간 할인 패키지

#### 시나리오 4: 영구 할당
- 기간: 없음 (영구)
- 만료일: null
- 용도: VIP 학원 또는 프로모션

## ⚠️ 주의사항

### 스타터 메시지
- **최대 4개**: 초과 시 추가 버튼 비활성화
- **빈 문자열 방지**: 공백만 있는 메시지는 추가 불가
- **중복 허용**: 같은 내용의 메시지도 추가 가능 (관리자 책임)

### 봇 할당 기간
- **영구 할당 기본값**: 체크박스가 선택되어 있으면 expiresAt = null
- **만료일 계산**: 서버 시간 기준으로 계산 (UTC)
- **만료 후 처리**: 현재는 isActive 필드만 있으며, 만료일 체크 로직은 별도 구현 필요
  - 추천: Cron Job이나 백그라운드 작업으로 매일 만료일 체크 후 isActive = false 처리

### 봇 수정
- **모든 필드 수정 가능**: 이모지, 색상, 설명, 프롬프트, 파일, 스타터 메시지, 멀티모달 설정
- **botId는 수정 불가**: 기본키이므로 수정 안됨 (UI에 표시만)
- **파일 업로드 제한**: 파일당 최대 10MB (서버 설정에 따라 다름)

## 🔮 향후 개선 가능 사항

### 만료일 자동 처리
```typescript
// Cron Job 예시 (매일 자동 실행)
import { prisma } from '@/lib/prisma';

export async function deactivateExpiredBots() {
  const now = new Date();
  
  await prisma.botAssignment.updateMany({
    where: {
      expiresAt: {
        lte: now, // 만료일이 현재보다 이전
      },
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });
  
  console.log('만료된 봇 할당이 비활성화되었습니다');
}
```

### 스타터 메시지 개선
- 카테고리별 스타터 메시지 템플릿 제공
- 스타터 메시지 순서 변경 (드래그 앤 드롭)
- 스타터 메시지에 이모지 아이콘 추가

### 할당 관리 개선
- 만료 예정 알림 (만료 7일 전, 3일 전, 1일 전)
- 할당 히스토리 추적
- 할당 통계 대시보드 (가장 많이 할당된 봇, 평균 사용 기간 등)
- 자동 갱신 옵션 (만료 시 자동으로 재할당)

## ✅ 완료 체크리스트

- [x] EditBotDialog에 이모지 선택 UI 추가
- [x] EditBotDialog에 파일 업로드 기능 추가
- [x] EditBotDialog에 스타터 메시지 관리 기능 추가
- [x] EditBotDialog에 멀티모달 기능 설정 추가
- [x] Prisma 스키마에 starterMessages 필드 추가
- [x] 채팅 페이지에 스타터 메시지 표시 로직 추가
- [x] AssignBotDialog 컴포넌트 생성
- [x] 봇 할당 API에 기간 설정 로직 추가
- [x] 봇 할당 페이지에 AssignBotDialog 통합
- [x] API 엔드포인트 업데이트 (starterMessages 필드)
- [x] 코드 커밋 및 푸시
- [ ] Vercel 배포 완료 대기 (약 2-3분)
- [ ] 프로덕션 테스트

---

**작성자**: Claude AI  
**최종 수정**: 2026-01-24  
**버전**: 1.0  
**관련 문서**: 
- `VOICE_FEATURE_IMPLEMENTATION.md`
- `EMOJI_PICKER_FEATURE.md`
- `AI_BOT_MULTIMODAL_SYSTEM.md`
- `VERCEL_ENV_SETUP.md`
