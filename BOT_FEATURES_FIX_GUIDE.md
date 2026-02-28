# AI 봇 기능 수정 가이드

## 🎯 문제점

### 1. 유사문제 출제 기능이 작동하지 않음
- `enableProblemGeneration` 체크 로직에 문제 가능성
- DB에서 `0` 또는 `false`로 저장되어 있을 가능성

### 2. 음성 출력 (TTS) 기능이 작동하지 않음
- `voiceEnabled` 체크 로직에 문제 가능성
- TTS API 호출 실패 가능성
- GEMINI_API_KEY 설정 문제 가능성

---

## 🔍 현재 코드 분석

### AI 봇 생성 페이지
**파일**: `src/app/dashboard/admin/ai-bots/create/page.tsx`

```tsx
// 유사문제 출제 기능
<input
  type="checkbox"
  id="enableProblemGeneration"
  checked={formData.enableProblemGeneration}
  onChange={(e) => setFormData({ ...formData, enableProblemGeneration: e.target.checked })}
/>

// TTS 음성 출력
<input
  type="checkbox"
  id="voiceEnabled"
  checked={formData.voiceEnabled}
  onChange={(e) => setFormData({ ...formData, voiceEnabled: e.target.checked })}
/>
```

### AI 채팅 페이지
**파일**: `src/app/ai-chat/page.tsx`

```tsx
// 유사문제 출제 체크
const enableFlag = selectedBot?.enableProblemGeneration;
const isProblemGenerationEnabled = enableFlag === 1 || enableFlag === "1" || enableFlag === true || Number(enableFlag) === 1;

// TTS 체크
if (!selectedBot || !selectedBot.voiceEnabled) {
  console.log('🔇 TTS not enabled for this bot');
  return;
}
```

---

## ✅ 해결 방법

### 1. DB 확인
봇이 저장될 때 `enableProblemGeneration`과 `voiceEnabled` 필드가 올바르게 저장되는지 확인 필요

### 2. 봇 생성 시 체크박스 값 저장 확인
```typescript
// boolean을 숫자로 변환하여 저장해야 함
enableProblemGeneration: formData.enableProblemGeneration ? 1 : 0,
voiceEnabled: formData.voiceEnabled ? 1 : 0,
```

### 3. TTS API 키 확인
Cloudflare 환경변수에 `GEMINI_API_KEY`가 설정되어 있는지 확인

---

## 🧪 테스트 방법

### 유사문제 출제 기능 테스트
1. 봇 생성 시 "📝 유사문제 출제 기능" 체크박스 활성화
2. 봇 저장
3. AI 채팅에서 해당 봇 선택
4. 수학 문제 출제 요청 (예: "1+1부터 10+10까지 10개 문제 내줘")
5. 🖨️ "문제지 출력" 버튼이 표시되는지 확인
6. 버튼 클릭 시 프린트 가능한 PDF 생성 확인

### TTS 음성 출력 테스트
1. 봇 생성 시 "🔊 음성 출력 (TTS)" 체크박스 활성화
2. 음성 선택 (예: "한국어 여성 (A)")
3. 봇 저장
4. AI 채팅에서 해당 봇 선택
5. AI 응답 메시지 옆에 🔊 스피커 버튼 표시 확인
6. 버튼 클릭 시 음성 재생 확인

---

## 📝 체크리스트

- [ ] 봇 생성 페이지에서 체크박스 값이 올바르게 저장되는지 확인
- [ ] DB에 저장된 값 확인 (0/1 또는 false/true)
- [ ] AI 채팅 페이지에서 봇 정보 로드 시 enableProblemGeneration, voiceEnabled 값 확인
- [ ] TTS API 호출 시 GEMINI_API_KEY 설정 확인
- [ ] 콘솔에서 에러 메시지 확인
- [ ] 실제 기능 동작 테스트

---

## 🔧 필요한 수정 사항

위 내용을 바탕으로 코드를 점검하고 수정 필요
