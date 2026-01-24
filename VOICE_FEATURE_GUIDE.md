# AI 봇 음성 기능 (STT & TTS)

## 📋 개요

AI 봇에서 **음성 입력(STT)** 및 **음성 출력(TTS)** 기능을 구현했습니다. OpenAI의 Whisper API와 TTS API를 사용합니다.

---

## 🎯 주요 기능

### 🎤 **음성 입력 (STT - Speech to Text)**
- ✅ 사용자가 마이크로 음성 녹음
- ✅ OpenAI Whisper API로 텍스트 변환
- ✅ 변환된 텍스트가 입력창에 자동 입력
- ✅ 한국어 음성 인식 지원

### 🔊 **음성 출력 (TTS - Text to Speech)**
- ✅ 봇의 응답을 음성으로 변환
- ✅ OpenAI TTS API 사용
- ✅ 고품질 음성 생성 (MP3 형식)
- ✅ 재생/중지 컨트롤

---

## 🎨 UI/UX

### **음성 입력 버튼**
```
┌─────────────────────────────────┐
│  [🎤] [메시지 입력...]    [전송] │
│   ↑                              │
│   음성 녹음 버튼                  │
│   (enableVoiceInput = true)      │
└─────────────────────────────────┘

녹음 중:
┌─────────────────────────────────┐
│  [🔴] [메시지 입력...]    [전송] │
│   ↑                              │
│   빨간색 애니메이션               │
└─────────────────────────────────┘
```

### **음성 출력 버튼**
```
봇 응답 메시지:
┌─────────────────────────────────┐
│  🤖 안녕하세요! 무엇을 도와      │
│     드릴까요?                     │
│                                  │
│     [🔊 음성 듣기]               │
│      ↑                           │
│      클릭하면 음성으로 재생       │
└─────────────────────────────────┘

재생 중:
┌─────────────────────────────────┐
│  🤖 안녕하세요! 무엇을 도와      │
│     드릴까요?                     │
│                                  │
│     [🔇 중지]                    │
│      ↑                           │
│      클릭하면 재생 중지           │
└─────────────────────────────────┘
```

---

## 💻 코드 구현

### **1. State 관리**

```typescript
// 음성 녹음 state
const [isRecording, setIsRecording] = useState(false);
const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

// 음성 재생 state
const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
const audioRef = useRef<HTMLAudioElement | null>(null);
```

### **2. 음성 녹음 (STT)**

#### 녹음 시작
```typescript
const startRecording = async () => {
  try {
    // 마이크 권한 요청
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      setAudioBlob(blob);
      stream.getTracks().forEach(track => track.stop());
      
      // 음성을 텍스트로 변환
      transcribeAudio(blob);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  } catch (error) {
    console.error('음성 녹음 오류:', error);
    alert('마이크 접근 권한이 필요합니다.');
  }
};
```

#### 녹음 중지
```typescript
const stopRecording = () => {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    setIsRecording(false);
  }
};
```

#### 음성 → 텍스트 변환
```typescript
const transcribeAudio = async (blob: Blob) => {
  try {
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');

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

### **3. 음성 재생 (TTS)**

#### 텍스트 → 음성 변환 및 재생
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

    // 기존 오디오 중지
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

#### 재생 중지
```typescript
const stopAudio = () => {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlayingAudio(null);
  }
};
```

### **4. UI 렌더링**

#### 음성 입력 버튼 (조건부)
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

#### 음성 출력 버튼 (조건부)
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

---

## 🔧 API 엔드포인트

### **POST `/api/speech/transcribe`** - 음성 → 텍스트

#### 요청
```typescript
const formData = new FormData();
formData.append('audio', audioBlob, 'recording.webm');

fetch('/api/speech/transcribe', {
  method: 'POST',
  body: formData,
});
```

#### 응답
```json
{
  "text": "안녕하세요, 수학 문제를 풀어주세요."
}
```

#### 구현
```typescript
// OpenAI Whisper API 호출
const openaiFormData = new FormData();
openaiFormData.append('file', audioFile);
openaiFormData.append('model', 'whisper-1');
openaiFormData.append('language', 'ko'); // 한국어

const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: openaiFormData,
});
```

### **POST `/api/speech/synthesize`** - 텍스트 → 음성

#### 요청
```json
{
  "text": "안녕하세요! 무엇을 도와드릴까요?"
}
```

#### 응답
```
Content-Type: audio/mpeg
(MP3 오디오 스트림)
```

#### 구현
```typescript
// OpenAI TTS API 호출
const response = await fetch('https://api.openai.com/v1/audio/speech', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'tts-1', // 또는 'tts-1-hd' (고품질)
    input: truncatedText, // 최대 4096자
    voice: 'alloy', // alloy, echo, fable, onyx, nova, shimmer
    speed: 1.0, // 0.25 ~ 4.0
  }),
});

const audioBuffer = await response.arrayBuffer();

return new NextResponse(audioBuffer, {
  status: 200,
  headers: {
    'Content-Type': 'audio/mpeg',
  },
});
```

---

## 🔑 환경 변수 설정

### **1. OpenAI API 키 필요**

#### Vercel 환경 변수 설정
```
1. Vercel Dashboard 접속
2. 프로젝트 선택
3. Settings → Environment Variables
4. 추가:
   - Name: OPENAI_API_KEY
   - Value: sk-xxxxxxxxxxxxxxxxxx
   - Environment: Production, Preview, Development
5. Redeploy
```

#### 로컬 개발 환경 (.env)
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxx
```

### **2. OpenAI API 키 발급**
```
1. https://platform.openai.com/api-keys 접속
2. "Create new secret key" 클릭
3. 키 이름 입력 (예: "AI Bot Voice Feature")
4. 키 복사 (한 번만 표시됨!)
5. Vercel 환경 변수에 추가
```

---

## 📊 OpenAI API 사용량 및 비용

### **Whisper API (STT)**
| 모델 | 가격 | 품질 |
|------|------|------|
| whisper-1 | $0.006 / 분 | 높음 |

### **TTS API**
| 모델 | 가격 | 품질 |
|------|------|------|
| tts-1 | $15.00 / 1M 문자 | 표준 |
| tts-1-hd | $30.00 / 1M 문자 | HD |

### **음성 옵션**
- `alloy`: 중성적이고 균형잡힌 목소리
- `echo`: 남성적, 차분한 목소리
- `fable`: 영국식 억양, 부드러운 목소리
- `onyx`: 깊고 권위있는 목소리
- `nova`: 여성적, 활기찬 목소리
- `shimmer`: 부드럽고 따뜻한 목소리

---

## 🎯 사용 시나리오

### **시나리오 1: 음성으로 질문하기**

1. 사용자가 음성 입력이 활성화된 봇 선택
2. 🎤 마이크 버튼 클릭
3. "수학 문제를 풀어주세요" 음성으로 질문
4. 마이크 버튼 다시 클릭 (녹음 중지)
5. 자동으로 텍스트 변환되어 입력창에 표시
6. 전송 버튼 클릭

### **시나리오 2: 봇 응답을 음성으로 듣기**

1. 봇이 텍스트로 응답
2. 응답 하단에 "🔊 음성 듣기" 버튼 표시
3. 버튼 클릭
4. 봇 응답이 음성으로 재생
5. "🔇 중지" 버튼으로 재생 중지 가능

### **시나리오 3: 영어 학습 봇**

**설정**:
- enableVoiceInput: ✅ ON
- enableVoiceOutput: ✅ ON

**사용**:
1. 학생이 영어 발음 녹음
2. Whisper가 텍스트로 변환
3. AI가 발음 교정 피드백
4. 피드백을 TTS로 음성 재생
5. 올바른 발음 예시 제공

---

## 🛠️ 브라우저 호환성

### **MediaRecorder API (음성 녹음)**
| 브라우저 | 지원 |
|---------|------|
| Chrome | ✅ 49+ |
| Firefox | ✅ 25+ |
| Safari | ✅ 14.1+ |
| Edge | ✅ 79+ |

### **Web Audio API (음성 재생)**
| 브라우저 | 지원 |
|---------|------|
| Chrome | ✅ |
| Firefox | ✅ |
| Safari | ✅ |
| Edge | ✅ |

---

## 🔒 보안 및 권한

### **마이크 권한**
```typescript
try {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  // 녹음 시작
} catch (error) {
  alert('마이크 접근 권한이 필요합니다.');
}
```

### **HTTPS 필수**
- 마이크 접근은 HTTPS 환경에서만 가능
- 로컬 개발: `localhost`는 예외
- 프로덕션: Vercel 자동 HTTPS

### **인증 체크**
```typescript
const session = await getServerSession(authOptions);

if (!session || !session.user) {
  return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
}
```

---

## 📝 테스트 체크리스트

### **음성 입력 (STT)**
- [ ] 마이크 권한 요청 표시
- [ ] 🎤 버튼 클릭 시 녹음 시작
- [ ] 녹음 중 빨간색 애니메이션 표시
- [ ] 버튼 다시 클릭 시 녹음 중지
- [ ] 음성 텍스트 변환
- [ ] 변환된 텍스트가 입력창에 표시

### **음성 출력 (TTS)**
- [ ] 봇 응답에 "음성 듣기" 버튼 표시
- [ ] 버튼 클릭 시 음성 재생
- [ ] 재생 중 "중지" 버튼으로 변경
- [ ] 재생 완료 후 버튼 복원
- [ ] 다른 메시지 재생 시 이전 재생 중지

### **조건부 표시**
- [ ] enableVoiceInput = true → 마이크 버튼 표시
- [ ] enableVoiceInput = false → 마이크 버튼 숨김
- [ ] enableVoiceOutput = true → 음성 듣기 버튼 표시
- [ ] enableVoiceOutput = false → 음성 듣기 버튼 숨김

---

## 📁 관련 파일

1. ✅ `src/app/dashboard/ai-gems/[gemId]/page.tsx`
   - 음성 녹음 UI 및 로직
   - 음성 재생 UI 및 로직
   - State 관리

2. ✅ `src/app/api/speech/transcribe/route.ts`
   - STT API (Whisper)
   - 음성 → 텍스트 변환

3. ✅ `src/app/api/speech/synthesize/route.ts`
   - TTS API (OpenAI TTS)
   - 텍스트 → 음성 변환

---

## 🚀 배포 및 설정

### **1. Vercel 환경 변수 추가**
```bash
# Vercel CLI로 추가
vercel env add OPENAI_API_KEY

# 또는 Vercel Dashboard에서 추가
Settings → Environment Variables
```

### **2. 프로젝트 재배포**
```bash
# Vercel 자동 배포
git push origin main

# 또는 수동 배포
vercel --prod
```

### **3. 환경 변수 확인**
```bash
# Vercel 환경 변수 목록
vercel env ls
```

---

## ✨ 향후 개선 사항

### **1. 음성 옵션 선택**
```typescript
// 봇 제작 시 음성 선택
voiceOption: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
```

### **2. 재생 속도 조절**
```typescript
// 0.25 ~ 4.0
speed: 1.0 // 기본
speed: 1.5 // 빠르게
speed: 0.75 // 느리게
```

### **3. 음성 캐싱**
```typescript
// 동일한 텍스트는 캐시에서 재생
const cacheKey = hash(text);
if (audioCache[cacheKey]) {
  playFromCache(cacheKey);
}
```

### **4. 다국어 지원**
```typescript
// 봇 언어 설정에 따라 음성 언어 자동 선택
language: 'ko' | 'en' | 'ja' | 'zh'
```

---

## 🎉 완료!

✅ **음성 입력 (STT)** 구현 완료
✅ **음성 출력 (TTS)** 구현 완료
✅ **조건부 UI** 구현 완료
✅ **OpenAI API 연동** 완료
✅ **브라우저 호환성** 확보

---

## ⚠️ 주의사항

### **OpenAI API 키 필수**
음성 기능을 사용하려면 **Vercel 환경 변수에 `OPENAI_API_KEY`를 추가**해야 합니다.

### **HTTPS 필요**
마이크 접근은 HTTPS 환경에서만 작동합니다.

### **사용량 모니터링**
OpenAI API 사용량을 정기적으로 확인하세요:
https://platform.openai.com/usage

---

**2026-01-24 업데이트 완료** 🎉

음성 기능이 완전히 구현되었습니다! Vercel 환경 변수에 OpenAI API 키만 추가하면 즉시 사용 가능합니다.
