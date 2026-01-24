# 🎤 음성 기능 구현 완료 가이드

**작성일**: 2026-01-24  
**상태**: ✅ 완료

## 📋 개요

사용자가 **음성을 녹음하여 메시지를 전송**하고, **봇의 응답을 음성으로 듣는** 기능을 완전히 구현했습니다.

## ✨ 구현된 기능

### 1️⃣ 사용자 음성 입력 (STT - Speech to Text)
- **녹음 시작/중지**: 마이크 버튼 클릭으로 녹음 시작/중지
- **자동 텍스트 변환**: 녹음 완료 시 자동으로 텍스트로 변환되어 입력창에 표시
- **OpenAI Whisper API 사용**: `/api/speech/transcribe` 엔드포인트
- **오디오 형식**: WebM (브라우저 지원)

### 2️⃣ 봇 응답 음성 출력 (TTS - Text to Speech)
- **자동 음성 재생**: 봇 응답 후 0.3초 뒤 자동으로 음성 재생 (enableVoiceOutput이 true일 때)
- **수동 음성 재생**: 각 메시지 하단의 "음성 듣기" 버튼으로 수동 재생 가능
- **재생 중지**: 재생 중 "중지" 버튼으로 언제든 중단 가능
- **OpenAI TTS API 사용**: `/api/speech/synthesize` 엔드포인트
- **오디오 형식**: MP3 (audio/mpeg)

## 🛠 구현 세부사항

### 클라이언트 측 (`src/app/dashboard/ai-gems/[gemId]/page.tsx`)

#### 상태 관리
```typescript
const [isRecording, setIsRecording] = useState(false);
const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
const audioRef = useRef<HTMLAudioElement | null>(null);
```

#### 음성 녹음 함수
```typescript
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      setAudioBlob(blob);
      stream.getTracks().forEach(track => track.stop());
      await transcribeAudio(blob);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  } catch (error) {
    console.error('녹음 오류:', error);
    alert('마이크 접근 권한이 필요합니다.');
  }
};

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    setIsRecording(false);
  }
};
```

#### 음성→텍스트 변환 함수
```typescript
const transcribeAudio = async (audioBlob: Blob) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch('/api/speech/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('음성 변환 실패');
    }

    const data = await response.json();
    setInput(data.text); // 변환된 텍스트를 입력창에 설정
  } catch (error) {
    console.error('음성 변환 오류:', error);
    alert('음성 변환에 실패했습니다.');
  } finally {
    setAudioBlob(null);
  }
};
```

#### 텍스트→음성 재생 함수
```typescript
const playTextAsAudio = async (text: string, messageId: string) => {
  try {
    setIsPlayingAudio(messageId);

    const response = await fetch('/api/speech/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('음성 생성 실패');
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlayingAudio(null);
      URL.revokeObjectURL(audioUrl);
    };

    audio.onerror = () => {
      setIsPlayingAudio(null);
      alert('음성 재생에 실패했습니다.');
    };

    await audio.play();
  } catch (error) {
    console.error('음성 재생 오류:', error);
    setIsPlayingAudio(null);
    alert('음성 재생에 실패했습니다.');
  }
};
```

#### 자동 음성 재생 (봇 응답 후)
```typescript
const assistantMessage: Message = {
  role: 'assistant',
  content: data.response,
  timestamp: new Date(),
};

setMessages((prev) => [...prev, assistantMessage]);

// 음성 출력이 활성화되어 있으면 자동 재생
if (gem.enableVoiceOutput) {
  setTimeout(() => {
    playTextAsAudio(data.response, `${messages.length + 1}`);
  }, 300);
}
```

### 서버 측 API

#### `/api/speech/transcribe` (STT)
```typescript
// src/app/api/speech/transcribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: "오디오 파일이 없습니다" }, { status: 400 });
    }

    // OpenAI Whisper API 호출
    const openaiFormData = new FormData();
    openaiFormData.append('file', audioFile);
    openaiFormData.append('model', 'whisper-1');
    openaiFormData.append('language', 'ko');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiFormData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI Whisper API 오류:', errorData);
      return NextResponse.json(
        { error: "음성 변환에 실패했습니다" },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error('음성 변환 오류:', error);
    return NextResponse.json(
      { error: "음성 변환 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
```

#### `/api/speech/synthesize` (TTS)
```typescript
// src/app/api/speech/synthesize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: "텍스트가 필요합니다" }, { status: 400 });
    }

    // OpenAI TTS API 호출
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'nova', // alloy, echo, fable, onyx, nova, shimmer
        input: text.slice(0, 4096), // 최대 4096자
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI TTS API 오류:', errorData);
      return NextResponse.json(
        { error: "음성 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('음성 생성 오류:', error);
    return NextResponse.json(
      { error: "음성 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
```

## 🎨 UI/UX 구현

### 음성 녹음 버튼
```tsx
{gem.enableVoiceInput && (
  <Button
    type="button"
    variant="outline"
    size="icon"
    onClick={isRecording ? stopRecording : startRecording}
    disabled={isLoading}
    className={`flex-shrink-0 transition-colors ${
      isRecording 
        ? 'bg-red-50 border-red-300 hover:bg-red-100' 
        : 'hover:bg-purple-50 hover:border-purple-300'
    }`}
  >
    {isRecording ? (
      <MicOff className="h-5 w-5 text-red-600 animate-pulse" />
    ) : (
      <Mic className="h-5 w-5" />
    )}
  </Button>
)}
```

### 음성 듣기 버튼
```tsx
{message.role === 'assistant' && gem.enableVoiceOutput && (
  <div className="mt-2 flex justify-end">
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => {
        const messageId = `${index}`;
        if (isPlayingAudio === messageId) {
          stopAudio();
        } else {
          playTextAsAudio(message.content, messageId);
        }
      }}
      className="flex items-center gap-1 text-xs"
    >
      {isPlayingAudio === `${index}` ? (
        <>
          <VolumeX className="h-3 w-3" />
          <span>중지</span>
        </>
      ) : (
        <>
          <Volume2 className="h-3 w-3" />
          <span>음성 듣기</span>
        </>
      )}
    </Button>
  </div>
)}
```

## ⚙️ 환경 설정

### 필수 환경 변수

**Vercel 대시보드**에서 다음 환경 변수를 설정해야 합니다:

```env
OPENAI_API_KEY=sk-proj-...your-api-key...
```

### Vercel 환경 변수 설정 방법

1. **Vercel 대시보드** 접속: https://vercel.com/dashboard
2. 프로젝트 선택: `superplace-study`
3. **Settings** 탭 클릭
4. 좌측 메뉴에서 **Environment Variables** 선택
5. 다음 변수 추가:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `sk-proj-...` (OpenAI API 키)
   - **Environment**: Production, Preview, Development 모두 선택
6. **Save** 클릭
7. **Redeploy** 필요: Settings → Deployments → 최신 배포 → "..." → Redeploy

## 🧪 테스트 방법

### 1. 음성 입력 테스트
1. 관리자 계정으로 로그인
2. `/dashboard/admin/ai-bots-management`에서 새 봇 생성
3. **"음성 입력 활성화"** 옵션 체크
4. 봇 저장 후 채팅 페이지 접속
5. **마이크 버튼** 클릭 → 녹음 시작 (빨간색 점멸 표시)
6. 음성 입력 → 다시 마이크 버튼 클릭 → 녹음 중지
7. 자동으로 텍스트 변환되어 입력창에 표시 확인
8. Enter로 메시지 전송

### 2. 음성 출력 테스트
1. 관리자 계정으로 로그인
2. `/dashboard/admin/ai-bots-management`에서 새 봇 생성
3. **"음성 출력 활성화"** 옵션 체크
4. 봇 저장 후 채팅 페이지 접속
5. 텍스트 메시지 전송
6. 봇 응답 후 **자동으로 음성 재생** 확인
7. 또는 **"음성 듣기"** 버튼 클릭으로 수동 재생 테스트
8. **"중지"** 버튼으로 재생 중단 테스트

### 3. 브라우저 권한 확인
- Chrome/Edge: 주소창 좌측 🔒 아이콘 → 마이크 권한 "허용" 확인
- Firefox: 주소창 좌측 🔒 아이콘 → 권한 → 마이크 "허용" 확인
- Safari: Safari 메뉴 → 설정 → 웹사이트 → 마이크 → 해당 사이트 "허용"

## 🚀 배포 상태

- **커밋 ID**: (자동 생성 예정)
- **브랜치**: `main`
- **배포 URL**: https://superplace-study.vercel.app
- **배포 상태**: Vercel 자동 배포 진행 중 (약 2-3분 소요)

## 📊 기능 요약

| 기능 | 상태 | 설명 |
|------|------|------|
| 음성 녹음 | ✅ 완료 | MediaRecorder API로 음성 녹음 |
| STT 변환 | ✅ 완료 | OpenAI Whisper로 음성→텍스트 |
| TTS 생성 | ✅ 완료 | OpenAI TTS로 텍스트→음성 |
| 자동 재생 | ✅ 완료 | 봇 응답 후 자동 음성 재생 |
| 수동 재생 | ✅ 완료 | "음성 듣기" 버튼으로 재생 |
| 재생 제어 | ✅ 완료 | 재생 중 중지 가능 |
| 권한 관리 | ✅ 완료 | 봇별 enableVoiceInput/Output 설정 |
| UI/UX | ✅ 완료 | 녹음 중 애니메이션, 재생 상태 표시 |

## 🔧 수정된 파일

- ✅ `src/app/dashboard/ai-gems/[gemId]/page.tsx` - 음성 기능 클라이언트 로직
- ✅ `src/app/api/speech/transcribe/route.ts` - STT API (이미 존재)
- ✅ `src/app/api/speech/synthesize/route.ts` - TTS API (이미 존재)
- ✅ `prisma/schema.prisma` - enableVoiceInput, enableVoiceOutput 필드 (이미 추가됨)

## 🎯 다음 단계

### 향후 개선 가능 사항
1. **음성 선택**: TTS 음성 선택 옵션 (nova, alloy, echo 등)
2. **재생 속도**: 0.5x ~ 2.0x 재생 속도 조절
3. **언어 선택**: 한국어, 영어, 일본어 등 다국어 지원
4. **음성 저장**: 생성된 음성 파일 다운로드 기능
5. **음성 히스토리**: 이전 음성 재생 기록 표시

## ⚠️ 주의사항

### OpenAI API 비용
- **Whisper (STT)**: $0.006 / 분
- **TTS**: $0.015 / 1000자 (tts-1), $0.030 / 1000자 (tts-1-hd)
- 예상 비용: 평균 대화 10분 + 응답 500자 → 약 $0.067

### 브라우저 지원
- ✅ Chrome/Edge: 완전 지원
- ✅ Firefox: 완전 지원
- ✅ Safari: 완전 지원 (마이크 권한 필요)
- ❌ IE: 미지원 (MediaRecorder API 없음)

### 보안
- 음성 녹음은 **HTTPS 필수** (Vercel 자동 제공)
- 마이크 권한은 **사용자 허용 필요**
- API 키는 **서버 측에서만 사용** (클라이언트 노출 방지)

## 📝 로그 예시

### 성공적인 음성 입력
```
🎤 녹음 시작...
✅ 녹음 완료: 3.2초
📝 음성 변환 중...
✅ 변환 완료: "안녕하세요, 수학 문제 풀이를 도와주세요."
```

### 성공적인 음성 출력
```
🔊 음성 생성 중...
✅ 음성 생성 완료: 156자 → 5.2초 오디오
▶️ 음성 재생 시작...
✅ 재생 완료
```

---

## ✅ 완료 체크리스트

- [x] 음성 녹음 기능 구현
- [x] STT API 엔드포인트 구현
- [x] TTS API 엔드포인트 구현
- [x] 자동 음성 재생 구현
- [x] 수동 음성 재생 구현
- [x] 재생 중지 기능 구현
- [x] UI/UX 구현 (녹음 버튼, 음성 듣기 버튼)
- [x] 봇별 음성 기능 설정 (enableVoiceInput, enableVoiceOutput)
- [x] 에러 처리 및 사용자 피드백
- [ ] **Vercel 환경 변수 설정** (`OPENAI_API_KEY`) ← 🚨 **사용자가 직접 설정 필요!**
- [ ] 프로덕션 배포 후 테스트

---

**작성자**: Claude AI  
**최종 수정**: 2026-01-24  
**버전**: 1.0  
**관련 문서**: `AI_BOT_MULTIMODAL_SYSTEM.md`, `EMOJI_PICKER_FEATURE.md`
