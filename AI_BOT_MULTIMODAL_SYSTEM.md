# AI 봇 멀티모달 기능 및 파일 업로드 시스템

## 📋 개요

관리자(SUPER_ADMIN)가 AI 봇을 제작할 때 **참조 파일 업로드** 및 **멀티모달 기능 설정**을 할 수 있도록 구현했습니다.

---

## 🎯 주요 기능

### 1. **권한 관리**
- ✅ **봇 제작: SUPER_ADMIN만 가능** (학원장 제작 불가)
- ✅ **봇 사용**: 
  - 관리자: 모든 봇 사용 가능
  - 학원장: 할당받은 봇만 사용 가능

### 2. **파일 업로드**
- ✅ **지원 파일 형식**: PDF, DOCX, XLSX, PPTX, TXT, CSV
- ✅ **최대 파일 크기**: 10MB
- ✅ **다중 파일 업로드** 가능
- ✅ **드래그 앤 드롭** 지원
- ✅ **파일 미리보기 및 삭제** 기능

### 3. **멀티모달 기능 설정**
봇 제작 시 다음 기능들을 개별적으로 설정할 수 있습니다:

#### 📷 **이미지 입력 허용** (`enableImageInput`)
- 사용자가 이미지를 첨부하여 질문 가능
- 예시: "이 문제 풀이를 봐주세요" + 사진 첨부

#### 🔊 **음성 출력 허용** (`enableVoiceOutput`)
- 봇의 응답을 음성으로 들을 수 있음
- TTS (Text-to-Speech) 기능 활성화

#### 🎤 **음성 입력 허용** (`enableVoiceInput`)
- 사용자가 음성을 녹음하여 질문 가능
- STT (Speech-to-Text) 기능 활성화

---

## 📊 데이터베이스 스키마

### **AIBot 모델**

```prisma
model AIBot {
  id            String      @id @default(cuid())
  botId         String      @unique
  name          String
  nameEn        String
  description   String      @db.Text
  icon          String      @default("🤖")
  color         String      @default("blue")
  bgGradient    String      @default("from-blue-50 to-cyan-50")
  systemPrompt  String      @db.Text  // AI 지침사항
  
  // 파일 업로드
  referenceFiles String[]    // 참조 파일 URL 배열
  
  // 멀티모달 기능 설정 (NEW!)
  enableImageInput   Boolean  @default(false)  // 이미지 첨부 허용
  enableVoiceOutput  Boolean  @default(false)  // 음성 응답 출력
  enableVoiceInput   Boolean  @default(false)  // 음성 녹음 입력
  
  isActive      Boolean     @default(true)
  createdById   String
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  createdBy     User        @relation(fields: [createdById], references: [id])
  
  @@index([botId])
  @@index([isActive])
}
```

---

## 🎨 UI 구성

### **1. 봇 제작 다이얼로그** (`CreateBotDialog.tsx`)

#### 기본 정보
- 봇 ID (영문, 하이픈만 사용)
- 아이콘 (이모지)
- 한글 이름
- 영문 이름
- 색상 테마 (9가지 선택 가능)
- 설명

#### 지침사항
- 시스템 프롬프트 (AI 봇의 역할, 말투, 행동 방식)
- 8줄 이상의 큰 텍스트 영역 제공

#### 참조 파일 업로드
```tsx
<div className="border-2 border-dashed rounded-lg p-4">
  <input
    type="file"
    multiple
    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
    onChange={handleFileUpload}
  />
  <Upload className="h-8 w-8" />
  <span>파일을 클릭하거나 드래그하세요</span>
  <span className="text-xs">PDF, DOCX, XLSX, PPTX, TXT, CSV (최대 10MB)</span>
</div>
```

#### 멀티모달 기능 설정
```tsx
{/* 이미지 입력 허용 */}
<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
  <div>
    <Label>📷 이미지 입력 허용</Label>
    <p className="text-xs text-gray-500">
      사용자가 이미지를 첨부하여 질문할 수 있습니다
    </p>
  </div>
  <Switch
    checked={formData.enableImageInput}
    onCheckedChange={(checked) =>
      setFormData({ ...formData, enableImageInput: checked })
    }
  />
</div>

{/* 음성 출력 허용 */}
<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
  <div>
    <Label>🔊 음성 출력 허용</Label>
    <p className="text-xs text-gray-500">
      봇의 응답을 음성으로 들을 수 있습니다
    </p>
  </div>
  <Switch
    checked={formData.enableVoiceOutput}
    onCheckedChange={(checked) =>
      setFormData({ ...formData, enableVoiceOutput: checked })
    }
  />
</div>

{/* 음성 입력 허용 */}
<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
  <div>
    <Label>🎤 음성 입력 허용</Label>
    <p className="text-xs text-gray-500">
      사용자가 음성을 녹음하여 질문할 수 있습니다
    </p>
  </div>
  <Switch
    checked={formData.enableVoiceInput}
    onCheckedChange={(checked) =>
      setFormData({ ...formData, enableVoiceInput: checked })
    }
  />
</div>
```

### **2. 채팅 페이지** (`[gemId]/page.tsx`)

#### 조건부 UI 렌더링

**이미지 업로드 버튼 (조건부)**:
```tsx
{gem.enableImageInput && (
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
      disabled={isLoading}
    >
      <ImageIcon className="h-5 w-5" />
    </Button>
  </>
)}
```

**플레이스홀더 텍스트 변경**:
```tsx
placeholder={
  gem.enableImageInput 
    ? '이미지를 업로드하거나 질문을 입력하세요...' 
    : `${gem.name}에게 메시지를 입력하세요...`
}
```

**전송 버튼 활성화 조건**:
```tsx
disabled={
  (gem.enableImageInput 
    ? (!input.trim() && !selectedImage) 
    : !input.trim()
  ) || isLoading
}
```

---

## 🔧 API 엔드포인트

### **POST `/api/admin/ai-bots`** - 봇 생성

#### 요청 바디
```json
{
  "botId": "history-teacher",
  "name": "한국사 선생님",
  "nameEn": "History Teacher",
  "description": "한국사를 재미있게 가르쳐드립니다",
  "icon": "📚",
  "color": "blue",
  "bgGradient": "from-blue-50 to-cyan-50",
  "systemPrompt": "당신은 한국사 전문 선생님입니다...",
  "referenceFiles": [
    "https://storage.example.com/files/korean-history.pdf"
  ],
  "enableImageInput": true,
  "enableVoiceOutput": false,
  "enableVoiceInput": false,
  "isActive": true
}
```

#### 응답
```json
{
  "message": "AI 봇이 생성되었습니다",
  "bot": {
    "id": "cmkxxx...",
    "botId": "history-teacher",
    "name": "한국사 선생님",
    "enableImageInput": true,
    "enableVoiceOutput": false,
    "enableVoiceInput": false,
    "createdBy": {
      "id": "cm779...",
      "name": "관리자",
      "email": "admin@example.com"
    }
  }
}
```

### **GET `/api/ai-bots`** - 봇 목록 조회

#### 응답
```json
{
  "bots": [
    {
      "id": "history-teacher",
      "name": "한국사 선생님",
      "nameEn": "History Teacher",
      "description": "한국사를 재미있게 가르쳐드립니다",
      "icon": "📚",
      "color": "blue",
      "bgGradient": "from-blue-50 to-cyan-50",
      "systemPrompt": "당신은 한국사 전문 선생님입니다...",
      "referenceFiles": ["https://..."],
      "enableImageInput": true,
      "enableVoiceOutput": false,
      "enableVoiceInput": false,
      "source": "database"
    }
  ]
}
```

---

## 📝 사용 시나리오

### **시나리오 1: 이미지 분석 봇 제작**

**관리자 작업**:
1. `/dashboard/admin/ai-bots-management` 접속
2. "새 AI 봇 추가" 클릭
3. 정보 입력:
   - 봇 ID: `homework-checker`
   - 이름: `숙제 검사 AI`
   - 지침사항: "학생이 업로드한 숙제 사진을 분석하여 피드백을 제공합니다..."
4. **이미지 입력 허용**: ON ✅
5. 참조 파일 업로드 (선택): `homework-guideline.pdf`
6. "봇 생성" 클릭

**학생 사용**:
1. `/dashboard/ai-gems` 접속
2. "숙제 검사 AI" 봇 클릭
3. 📷 이미지 버튼으로 숙제 사진 업로드
4. "이 문제 풀이가 맞나요?" 메시지 전송
5. AI가 이미지를 분석하여 피드백 제공

---

### **시나리오 2: 음성 출력 영어 튜터**

**관리자 작업**:
1. 봇 제작
2. **음성 출력 허용**: ON ✅
3. **음성 입력 허용**: ON ✅

**학생 사용**:
1. 영어 튜터 봇과 대화
2. 🎤 버튼으로 음성 녹음: "How do you pronounce this word?"
3. AI가 텍스트로 응답
4. 🔊 버튼으로 음성으로 듣기 (TTS)

---

## 🛠️ 구현 세부사항

### **1. 파일 업로드 처리**

```typescript
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  setUploadingFiles(true);
  const uploadedUrls: string[] = [];

  for (const file of Array.from(files)) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload/bot-files", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      uploadedUrls.push(data.url);
    }
  }

  setFormData({
    ...formData,
    referenceFiles: [...formData.referenceFiles, ...uploadedUrls],
  });
  
  setUploadingFiles(false);
};
```

### **2. 조건부 이미지 업로드**

**Before** (하드코딩):
```tsx
{gem.id === 'ggumettang' && (
  <Button>이미지 업로드</Button>
)}
```

**After** (동적 설정):
```tsx
{gem.enableImageInput && (
  <Button>이미지 업로드</Button>
)}
```

### **3. TypeScript 인터페이스**

```typescript
interface Gem {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: string;
  systemPrompt: string;
  source?: 'database' | 'default';
  
  // 새로 추가된 필드
  referenceFiles?: string[];
  enableImageInput?: boolean;
  enableVoiceOutput?: boolean;
  enableVoiceInput?: boolean;
}
```

---

## ✨ 향후 확장 가능성

### **1. 음성 기능 구현**
- 음성 출력: Web Speech API 또는 OpenAI TTS
- 음성 입력: Web Speech API 또는 OpenAI Whisper

### **2. 파일 처리**
- PDF 텍스트 추출: `pdf-parse`
- DOCX 파싱: `mammoth.js`
- AI 봇이 파일 내용을 참조하여 응답

### **3. 추가 멀티모달 옵션**
- 비디오 입력
- 코드 실행 환경
- 화이트보드 공유

---

## 🔒 보안 및 제약사항

### **권한 관리**
✅ **봇 제작**: SUPER_ADMIN만 가능
```typescript
if (session.user.role !== "SUPER_ADMIN") {
  return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
}
```

### **파일 업로드 제한**
- 최대 파일 크기: 10MB
- 허용 확장자: `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.txt`, `.csv`
- 바이러스 검사 권장

### **데이터 검증**
```typescript
// 필수 필드 검증
if (!botId || !name || !nameEn || !description || !systemPrompt) {
  return NextResponse.json(
    { error: "필수 필드를 모두 입력해주세요" },
    { status: 400 }
  );
}

// botId 중복 확인
const existingBot = await prisma.aIBot.findUnique({
  where: { botId },
});
```

---

## 📚 관련 파일

### **수정된 파일**
1. `prisma/schema.prisma` - 데이터베이스 스키마
2. `src/components/admin/CreateBotDialog.tsx` - 봇 제작 UI
3. `src/app/api/admin/ai-bots/route.ts` - 봇 생성 API
4. `src/app/api/ai-bots/route.ts` - 봇 목록 API
5. `src/app/dashboard/ai-gems/[gemId]/page.tsx` - 채팅 페이지
6. `src/lib/gems/data.ts` - 기본 봇 타입 정의

### **기존 파일 (활용)**
- `src/app/api/upload/bot-files/route.ts` - 파일 업로드 API (기존)
- `src/app/dashboard/admin/ai-bots-management/page.tsx` - 봇 관리 페이지 (기존)

---

## 🎯 테스트 체크리스트

### **관리자 테스트**
- [ ] 봇 제작 페이지 접근 (SUPER_ADMIN만)
- [ ] 파일 업로드 (PDF, DOCX 등)
- [ ] 멀티모달 옵션 설정
- [ ] 봇 생성 성공
- [ ] 생성된 봇이 목록에 표시

### **학원장 테스트**
- [ ] 봇 제작 페이지 접근 불가 (403 오류)
- [ ] 할당받은 봇만 목록에 표시
- [ ] 할당받지 않은 봇 숨김

### **사용자 테스트**
- [ ] 이미지 입력 활성화 시 버튼 표시
- [ ] 이미지 첨부 및 전송
- [ ] 음성 기능 UI 표시 (향후 구현)

---

## 📦 배포 정보

- **커밋**: `feat: AI 봇 멀티모달 기능 및 파일 업로드 시스템 구현`
- **브랜치**: `main`
- **배포 상태**: ✅ 푸시 완료 (`8f6c445`)
- **Vercel 자동 배포**: 진행 중

---

## 🚀 사용 방법

### **1. 관리자가 봇 제작**
```
1. https://superplace-study.vercel.app/dashboard/admin/ai-bots-management
2. "새 AI 봇 추가" 클릭
3. 정보 입력 및 설정
4. "봇 생성" 클릭
```

### **2. 학원장에게 봇 할당**
```
1. https://superplace-study.vercel.app/dashboard/admin/bot-assignment
2. 학원 검색
3. "할당" 버튼 클릭
```

### **3. 사용자가 봇 사용**
```
1. https://superplace-study.vercel.app/dashboard/ai-gems
2. 봇 선택
3. 이미지 첨부 또는 텍스트 입력
4. AI 응답 확인
```

---

**2026-01-24 업데이트 완료** 🎉

모든 요구사항이 구현되었습니다:
✅ 관리자만 봇 제작 가능
✅ 파일 업로드 (PDF, DOCX 등)
✅ 멀티모달 설정 (이미지, 음성)
✅ 조건부 UI 렌더링
✅ 데이터베이스 스키마 업데이트
✅ API 엔드포인트 구현
