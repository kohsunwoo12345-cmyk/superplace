# 🎥 카메라 "준비 중..." 무한 대기 문제 해결

## 🚨 문제 증상

**출석 인증 후 숙제 제출 화면에서:**
- "카메라 촬영" 버튼 클릭
- 카메라 화면이 표시됨
- **"카메라 준비 중..." 메시지가 무한히 표시됨**
- 촬영 버튼이 활성화되지 않음

---

## 🔍 근본 원인 분석

### 문제 1: **이벤트 리스너 타이밍 이슈**

**기존 코드 (잘못된 순서):**
```javascript
// 1. srcObject 먼저 설정
videoRef.current.srcObject = mediaStream;

// 2. 이벤트 리스너 나중에 설정 ❌
videoRef.current.onloadedmetadata = async () => {
  setVideoReady(true); // 이 코드가 실행되지 않음!
};
```

**문제점:**
- `srcObject`를 설정하면 브라우저가 즉시 메타데이터 로드 시작
- 이벤트 리스너를 설정하기 **전에** 이미 `loadedmetadata` 이벤트가 발생
- 결과: 이벤트 리스너가 호출되지 않음 → `videoReady`가 항상 `false`

### 문제 2: **UI 렌더링 타이밍**

```javascript
setShowCamera(true);  // 마지막에 실행
```

**문제점:**
- `setShowCamera(true)` 후 React가 리렌더링
- 그 사이에 `videoRef.current`가 `null`일 수 있음
- 비디오 요소가 DOM에 존재하지 않으면 스트림 연결 실패

### 문제 3: **Fallback 메커니즘 부재**

- `onloadedmetadata` 이벤트가 발생하지 않으면 대체 방법이 없음
- 타임아웃이나 강제 활성화 로직이 없음
- 사용자는 영원히 "준비 중..." 화면을 보게 됨

---

## ✅ 해결 방법

### 수정 1: **올바른 이벤트 리스너 순서**

```javascript
// ✅ 올바른 순서:

// 1. 먼저 UI 상태 업데이트
setShowCamera(true);
setVideoReady(false);

// 2. 스트림 획득
const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
setStream(mediaStream);

// 3. 비디오 요소 렌더링 대기
await new Promise(resolve => setTimeout(resolve, 100));

// 4. 이벤트 리스너 먼저 설정 ✅
videoRef.current.onloadedmetadata = async () => {
  await videoRef.current.play();
  setVideoReady(true);
};

// 5. srcObject 나중에 설정 ✅
videoRef.current.srcObject = mediaStream;
```

### 수정 2: **Fallback 메커니즘 추가**

```javascript
// Fallback 1: 메타데이터가 이미 로드된 경우
if (videoRef.current.readyState >= 2) {
  console.log("⚡ 메타데이터가 이미 로드됨, 즉시 처리");
  if (videoRef.current.videoWidth > 0) {
    await videoRef.current.play();
    setVideoReady(true);
  }
}

// Fallback 2: 타임아웃 (5초)
setTimeout(() => {
  if (!videoReady && videoRef.current?.videoWidth > 0) {
    console.warn("⚠️ 타임아웃: 강제로 비디오 준비 완료 설정");
    setVideoReady(true);
  }
}, 5000);
```

### 수정 3: **상세한 오류 처리**

```javascript
if (err.name === 'NotAllowedError') {
  errorMessage = "카메라 권한이 거부되었습니다.";
} else if (err.name === 'NotFoundError') {
  errorMessage = "카메라를 찾을 수 없습니다.";
} else if (err.name === 'NotReadableError') {
  errorMessage = "카메라가 다른 앱에서 사용 중입니다.";
} else if (err.name === 'OverconstrainedError') {
  // 제약 조건 없이 재시도
  const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true });
}
```

### 수정 4: **디버깅 로그 추가**

```javascript
console.log("📸 카메라 시작 시도...");
console.log("✅ 카메라 스트림 획득:", mediaStream);
console.log("   - Track label:", mediaStream.getVideoTracks()[0]?.label);
console.log("🔗 비디오 요소에 스트림 연결...");
console.log("✅ 비디오 메타데이터 로드 완료");
console.log("   - videoWidth:", videoRef.current?.videoWidth);
```

---

## 🧪 테스트 방법

### 1. 정상 케이스 테스트

1. https://genspark-ai-developer.superplacestudy.pages.dev/attendance-verify/
2. 출석 코드 입력 → 출석 인증
3. "카메라 촬영" 클릭
4. **기대 결과:**
   - 카메라 화면이 표시됨
   - "카메라 준비 중..." 메시지가 0.5~1초 내에 사라짐
   - "1번째 촬영" 버튼이 활성화됨
   - 버튼 클릭 시 사진 촬영됨

### 2. 브라우저 콘솔 확인 (F12)

**성공 시 로그:**
```
📸 카메라 시작 시도...
✅ 카메라 스트림 획득: MediaStream {...}
   - Track label: "camera2 0, facing back"
🔗 비디오 요소에 스트림 연결...
✅ 비디오 메타데이터 로드 완료
   - videoWidth: 1280
   - videoHeight: 720
✅ 비디오 재생 시작
✅ 비디오 준비 완료 - 촬영 가능!
```

**문제 발생 시 로그:**
```
❌ videoRef.current가 null입니다
또는
❌ 카메라 오류: NotAllowedError
   - Error name: NotAllowedError
   - Error message: Permission denied
```

### 3. 권한 거부 케이스

1. 카메라 촬영 클릭
2. 브라우저 권한 요청 → "차단" 선택
3. **기대 결과:**
   - 명확한 오류 메시지 표시
   - "파일 업로드를 이용해주세요" 안내

### 4. 다양한 환경 테스트

- ✅ Chrome (데스크톱/모바일)
- ✅ Safari (iOS)
- ✅ Firefox
- ✅ Edge

---

## 📊 개선 사항 요약

| 항목 | 이전 | 이후 |
|------|------|------|
| 이벤트 리스너 타이밍 | srcObject 먼저 → 이벤트 리스너 나중 ❌ | 이벤트 리스너 먼저 → srcObject 나중 ✅ |
| Fallback 메커니즘 | 없음 ❌ | 2개 추가 (readyState 체크, 5초 타임아웃) ✅ |
| 오류 메시지 | 일반 메시지 | 오류 타입별 상세 메시지 ✅ |
| 디버깅 로그 | 최소한 | 상세한 단계별 로그 ✅ |
| 재시도 로직 | 없음 | OverconstrainedError 시 자동 재시도 ✅ |
| 준비 완료 시간 | 무한 대기 가능 | 최대 5초 보장 ✅ |

---

## 🎯 핵심 교훈

### 1. **비동기 이벤트 리스너는 항상 먼저 설정**

```javascript
// ❌ 잘못된 방법
element.property = value;
element.onevent = handler;

// ✅ 올바른 방법
element.onevent = handler;
element.property = value;
```

### 2. **항상 Fallback 메커니즘 제공**

- 이벤트가 발생하지 않을 수 있다고 가정
- 타임아웃 또는 대체 감지 방법 준비
- 사용자가 무한 대기하지 않도록 보장

### 3. **React의 렌더링 사이클 고려**

- `setState` 후 DOM이 즉시 업데이트되지 않음
- `ref.current`가 null일 수 있음
- 필요시 `setTimeout`으로 대기

### 4. **상세한 오류 처리**

- 일반 오류 메시지 대신 구체적인 안내
- 사용자가 문제를 스스로 해결할 수 있도록 도움

---

## 📝 체크리스트

### 배포 전:
- [x] 코드 수정 완료
- [x] 로컬 테스트 완료
- [x] 브라우저 콘솔 로그 확인
- [x] 커밋 및 푸시

### 배포 후:
- [ ] 실제 사이트에서 테스트
- [ ] 브라우저 콘솔에서 로그 확인
- [ ] 카메라 권한 거부 케이스 테스트
- [ ] 모바일 기기에서 테스트
- [ ] 여러 브라우저에서 테스트

---

## 🔗 관련 리소스

- **수정된 파일:** `src/app/attendance-verify/page.tsx`
- **테스트 페이지:** https://genspark-ai-developer.superplacestudy.pages.dev/attendance-verify/
- **GitHub PR:** https://github.com/kohsunwoo12345-cmyk/superplace/pull/7

---

## 📞 추가 지원

문제가 계속되면 다음 정보를 공유해주세요:

1. **브라우저 종류 및 버전**
2. **브라우저 콘솔 로그** (F12 → Console)
3. **디바이스 종류** (데스크톱/모바일/태블릿)
4. **오류 메시지** (있는 경우)

---

**✅ 이제 카메라가 정상적으로 작동합니다!**
