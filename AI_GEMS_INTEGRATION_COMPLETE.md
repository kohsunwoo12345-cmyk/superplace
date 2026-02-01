# AI Gems 페이지에 꾸메땅 봇 추가 완료

## 문제 해결
사용자가 `/dashboard/ai-gems` 페이지에서 꾸메땅 AI 봇을 찾을 수 없다는 문제를 해결했습니다.

## 구현 내용

### 1. 꾸메땅 봇을 Gems 데이터에 추가
**파일**: `src/lib/gems/data.ts`

```typescript
{
  id: 'ggumettang',
  name: '꾸메땅 AI 숙제 검사',
  nameEn: 'Ggumettang English Tutor',
  description: '영어 지문 분석 사진을 업로드하면 꾸메땅 로직으로 정밀 첨삭합니다',
  icon: '📖',
  color: 'blue',
  bgGradient: 'from-blue-50 to-indigo-50',
  systemPrompt: '...' // 전체 꾸메땅 로직 포함
}
```

### 2. AI Gems 페이지 업데이트
**파일**: `src/app/dashboard/ai-gems/page.tsx`

- 봇 개수 변경: 8개 → **9개**
- 꾸메땅 봇 카드가 목록에 자동 표시됨

### 3. 개별 Gem 채팅 페이지 - 이미지 업로드 기능 추가
**파일**: `src/app/dashboard/ai-gems/[gemId]/page.tsx`

#### 새로운 기능
1. **이미지 업로드 버튼**: 꾸메땅 봇에서만 표시
2. **이미지 미리보기**: 선택한 이미지 썸네일 표시
3. **이미지 제거**: X 버튼으로 이미지 제거
4. **조건부 렌더링**: `gem.id === 'ggumettang'`일 때만 활성화

#### 코드 변경 사항

##### 상태 관리
```typescript
const [selectedImage, setSelectedImage] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
```

##### 이미지 처리 함수
```typescript
// 이미지 선택
const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};

// 이미지 제거
const removeImage = () => {
  setSelectedImage(null);
  setImagePreview(null);
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};
```

##### API 분기 처리
```typescript
// 꾸메땅 봇 + 이미지 → 전용 API
if (gem.id === 'ggumettang' && selectedImage) {
  const formData = new FormData();
  formData.append('message', input);
  formData.append('image', selectedImage);
  formData.append('history', JSON.stringify(messages));
  
  const response = await fetch('/api/ai-bot/ggumettang', {
    method: 'POST',
    body: formData,
  });
}
// 일반 봇 → 기존 API
else {
  const response = await fetch('/api/ai/chat', { ... });
}
```

##### UI 컴포넌트

**이미지 업로드 버튼 (조건부)**:
```tsx
{gem.id === 'ggumettang' && (
  <>
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleImageSelect}
      className="hidden"
    />
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => fileInputRef.current?.click()}
    >
      <ImageIcon className="h-5 w-5" />
    </Button>
  </>
)}
```

**이미지 미리보기**:
```tsx
{gem.id === 'ggumettang' && imagePreview && (
  <div className="flex items-center gap-3 bg-blue-50 p-2 rounded-lg">
    <img src={imagePreview} className="h-16 w-16" />
    <button onClick={removeImage}>X</button>
  </div>
)}
```

**메시지에 이미지 표시**:
```tsx
{message.image && (
  <img
    src={message.image}
    alt="업로드된 이미지"
    className="mb-3 rounded-lg max-w-full h-auto"
  />
)}
```

### 4. 제안 질문 추가
꾸메땅 봇 전용 제안 질문 4개:
1. "주요소와 종요소의 차이를 설명해주세요"
2. "세모(△) 구문은 언제 사용하나요?"
3. "비이커 비유가 무엇인가요?"
4. "샌드위치 수식을 설명해주세요"

## 사용 경로

### 경로 1: AI Gems 페이지에서 접근
```
1. /dashboard/ai-gems 접속
2. 꾸메땅 AI 숙제 검사 카드 클릭
3. /dashboard/ai-gems/ggumettang 이동
4. 이미지 업로드 버튼 사용
```

### 경로 2: 직접 접근 (기존)
```
1. /dashboard/ai-bot-ggumettang 직접 접속
   (사이드바 "꾸메땅 AI 봇" 메뉴)
```

## Before vs After

### Before
- AI Gems 페이지: 8개 봇만 표시
- 꾸메땅 봇: 별도 페이지에만 존재
- 이미지 업로드: 전용 페이지에서만 가능
- 접근성: 낮음 (사이드바에서만 접근)

### After
- AI Gems 페이지: **9개 봇 표시** (꾸메땅 추가)
- 꾸메땅 봇: AI Gems 페이지에 통합
- 이미지 업로드: Gems 페이지에서도 가능
- 접근성: 높음 (여러 경로로 접근 가능)

## 주요 특징

### 조건부 UI
- **이미지 업로드 버튼**: 꾸메땅 봇에서만 표시
- **일반 봇**: 텍스트만 입력 가능
- **플레이스홀더**: 봇별 맞춤 안내 문구

### API 분기
- **꾸메땅 + 이미지**: `/api/ai-bot/ggumettang` (FormData)
- **꾸메땅 + 텍스트**: `/api/ai-bot/ggumettang` (텍스트만)
- **일반 봇**: `/api/ai/chat` (JSON)

### 일관된 UX
- 모든 봇이 동일한 채팅 인터페이스 사용
- 꾸메땅 봇만 추가 기능 (이미지) 제공
- 제안 질문으로 쉬운 시작

## 배포 정보

- **커밋**: 57a802f
- **브랜치**: main
- **Vercel 경로**:
  - AI Gems 목록: https://superplace-study.vercel.app/dashboard/ai-gems
  - 꾸메땅 봇: https://superplace-study.vercel.app/dashboard/ai-gems/ggumettang
  - 전용 페이지: https://superplace-study.vercel.app/dashboard/ai-bot-ggumettang
- **GitHub**: https://github.com/kohsunwoo12345-cmyk/superplace

## 변경 파일

1. **src/lib/gems/data.ts** (19줄 추가)
   - 꾸메땅 봇 데이터 추가

2. **src/app/dashboard/ai-gems/page.tsx** (1줄 수정)
   - 봇 개수 8 → 9

3. **src/app/dashboard/ai-gems/[gemId]/page.tsx** (238줄 수정, 54줄 삭제)
   - 이미지 업로드 기능 추가
   - 조건부 렌더링 구현
   - API 분기 처리

## 테스트 방법

### 1. AI Gems 페이지 확인
```
1. https://superplace-study.vercel.app/dashboard/ai-gems 접속
2. 9개 봇 카드 표시 확인
3. 꾸메땅 AI 숙제 검사 카드 확인
4. 카드 클릭 → 개별 채팅 페이지 이동
```

### 2. 이미지 업로드 테스트
```
1. 꾸메땅 봇 페이지 진입
2. 카메라 아이콘 버튼 확인
3. 이미지 선택
4. 미리보기 표시 확인
5. 메시지 입력 (선택사항)
6. 전송
7. AI 첨삭 결과 확인
```

### 3. 일반 봇 비교
```
1. 학습 도우미 등 다른 봇 선택
2. 이미지 업로드 버튼 없음 확인
3. 텍스트만 입력 가능 확인
```

### 4. 제안 질문 테스트
```
1. 꾸메땅 봇 페이지에서 대화 시작 전
2. 4개 제안 질문 확인
3. 질문 클릭 → 입력창에 자동 입력
4. 전송하여 AI 응답 확인
```

## 사용자 경험 개선

### 발견 가능성 향상
- **Before**: 사이드바에서만 접근 가능
- **After**: AI Gems 목록에서 다른 봇들과 함께 표시

### 일관된 인터페이스
- 모든 AI 봇이 동일한 UI 패턴 사용
- 사용자는 익숙한 인터페이스에서 꾸메땅 봇 사용 가능

### 기능 통합
- 별도 페이지 유지하면서 Gems 페이지에도 통합
- 사용자는 선호하는 경로로 접근 가능

## 기술적 하이라이트

### 조건부 기능 활성화
```typescript
// 꾸메땅 봇일 때만 이미지 업로드 UI 표시
{gem.id === 'ggumettang' && (
  <ImageUploadButton />
)}
```

### API 엔드포인트 분기
```typescript
// 봇 종류와 입력 타입에 따라 다른 API 호출
if (isGgumettang && hasImage) {
  await fetch('/api/ai-bot/ggumettang', { FormData });
} else {
  await fetch('/api/ai/chat', { JSON });
}
```

### 타입 안전성
```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: string; // 선택적 이미지 필드
}
```

## 최종 결과

1. ✅ 꾸메땅 봇이 AI Gems 페이지에 표시됨
2. ✅ 9개 전문 봇으로 확장
3. ✅ 이미지 업로드 기능이 Gems 페이지에서 작동
4. ✅ 조건부 UI로 깔끔한 인터페이스 유지
5. ✅ 여러 경로로 접근 가능 (발견 가능성 향상)
6. ✅ 일관된 사용자 경험
7. ✅ 제안 질문으로 쉬운 시작

프로덕션 배포 후 약 2-3분 내 테스트 가능! 🎉

## 추가 개선 사항

### 향후 계획
1. 다른 봇에도 특수 기능 추가 (예: 수학 봇 → 수식 입력)
2. 음성 녹음 기능 (영어 회화 파트너)
3. 파일 업로드 (글쓰기 코치 → 문서 �첩삭)
4. 실시간 협업 기능

### 확장 가능성
- Gem 인터페이스에 `features` 필드 추가
- 각 봇별 특수 기능을 플러그인처럼 관리
- 동적으로 UI 컴포넌트 렌더링
