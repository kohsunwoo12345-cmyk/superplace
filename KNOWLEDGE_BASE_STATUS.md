# AI 봇 지식 베이스 현황 및 개선 방안

**작성일**: 2026-03-02  
**조사 결과**: PDF 지원 없음, RAG 미구현

---

## 📋 현재 상황

### 1. 지식 베이스 구현 현황

#### ✅ 지원하는 파일 형식
- TXT (텍스트)
- MD (마크다운)
- JSON
- CSV
- HTML
- XML

#### ❌ 미지원 파일 형식
- **PDF** ← 사용자 요청 항목

### 2. 현재 동작 방식

#### 파일 업로드 (프론트엔드)
```typescript
// src/app/dashboard/admin/ai-bots/create/page.tsx
const handleFileUpload = async (files: FileList) => {
  for (const file of Array.from(files)) {
    // 텍스트 파일 읽기
    const text = await file.text();
    
    // knowledgeBase에 텍스트 그대로 추가
    setFormData(prev => ({
      ...prev,
      knowledgeBase: prev.knowledgeBase + `\n\n## 📄 ${file.name}\n\n${text}\n\n---\n`
    }));
  }
};
```

#### AI 챗 응답 생성 (백엔드)
```typescript
// functions/api/ai-chat.ts
if (bot.knowledgeBase) {
  // 시스템 프롬프트에 지식 베이스 텍스트 추가
  systemMessage += `\n\n--- 지식 베이스 (Knowledge Base) ---\n${bot.knowledgeBase}\n--- 지식 베이스 끝 ---\n\n위 지식 베이스의 정보를 참고하여 질문에 답변하세요.`;
}

// Gemini API 호출
contents.push({
  role: "user",
  parts: [{ text: systemMessage }]
});
```

### 3. 문제점

#### ❌ RAG (Retrieval-Augmented Generation) 미구현
현재는 **전체 지식 베이스 텍스트를 시스템 프롬프트에 추가**하는 방식입니다.

**문제**:
- 지식 베이스가 크면 토큰 제한 초과
- 관련 없는 정보도 모두 포함
- 응답 속도 저하
- 비용 증가

#### ❌ PDF 파일 지원 안 함
```typescript
const allowedTypes = [
  'text/plain',
  'text/markdown',
  'application/json',
  'text/csv',
  'text/html',
  'application/xml',
  'text/xml'
];
// 'application/pdf' 없음!
```

**에러 메시지**:
```
지원하지 않는 파일 형식입니다.
지원 형식: TXT, MD (Markdown), JSON, CSV, HTML, XML
참고: PDF 파일은 텍스트를 복사하여 직접 붙여넣기 하거나, 텍스트로 변환 후 업로드해주세요.
```

---

## ✅ 해결 방안

### Option 1: PDF 지원 추가 (간단한 방법)

#### A. 클라이언트 사이드 PDF 파싱 (권장)
프론트엔드에서 PDF를 텍스트로 변환 후 업로드

**장점**:
- 구현 간단
- 서버 부하 없음
- 빠른 처리

**단점**:
- 이미지 기반 PDF는 OCR 필요
- 복잡한 레이아웃은 텍스트 순서 깨질 수 있음

**구현 코드**:
```typescript
// PDF.js 라이브러리 설치
npm install pdfjs-dist

// src/app/dashboard/admin/ai-bots/create/page.tsx
import * as pdfjsLib from 'pdfjs-dist';

const handleFileUpload = async (files: FileList) => {
  for (const file of Array.from(files)) {
    let text = '';
    
    // PDF 파일인 경우
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n\n';
      }
    } else {
      // 기존 텍스트 파일 읽기
      text = await file.text();
    }
    
    // knowledgeBase에 추가
    setFormData(prev => ({
      ...prev,
      knowledgeBase: prev.knowledgeBase + `\n\n## 📄 ${file.name}\n\n${text}\n\n---\n`
    }));
  }
};
```

#### B. 서버 사이드 PDF 파싱
Cloudflare Workers에서 PDF 파싱

**장점**:
- 클라이언트 부담 없음
- 통합된 처리

**단점**:
- Cloudflare Workers에서 PDF 라이브러리 제한
- 서버 부하

### Option 2: 실제 RAG 구현 (권장)

#### 아키텍처
```
1. 문서 업로드
   ↓
2. 텍스트 추출 (PDF → 텍스트)
   ↓
3. 청크 분할 (1000 토큰씩)
   ↓
4. 벡터 임베딩 생성 (Gemini Embedding API)
   ↓
5. 벡터 DB 저장 (Cloudflare Vectorize)
   ↓
6. 사용자 질문
   ↓
7. 질문 임베딩
   ↓
8. 유사도 검색 (Top-K)
   ↓
9. 관련 청크만 시스템 프롬프트에 추가
   ↓
10. Gemini API 호출
```

#### 구현 코드 (간소화)

**1. 임베딩 생성 API**
```typescript
// functions/api/admin/knowledge-base/embed.ts
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { text, botId } = await context.request.json();
  
  // 텍스트를 청크로 분할
  const chunks = splitTextIntoChunks(text, 1000);
  
  // 각 청크의 임베딩 생성
  const embeddings = await Promise.all(
    chunks.map(async (chunk, index) => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${context.env.GOOGLE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text: chunk }] }
          })
        }
      );
      const data = await response.json();
      return {
        id: `${botId}-chunk-${index}`,
        values: data.embedding.values,
        metadata: { botId, chunkIndex: index, text: chunk }
      };
    })
  );
  
  // Cloudflare Vectorize에 저장
  await context.env.VECTORIZE.upsert(embeddings);
  
  return new Response(JSON.stringify({ success: true }));
};
```

**2. RAG 검색 및 응답**
```typescript
// functions/api/ai-chat.ts
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { message, botId } = await context.request.json();
  
  // 질문 임베딩 생성
  const queryEmbedding = await generateEmbedding(message, context.env.GOOGLE_GEMINI_API_KEY);
  
  // 유사도 검색 (Top 5)
  const searchResults = await context.env.VECTORIZE.query(queryEmbedding, {
    topK: 5,
    filter: { botId }
  });
  
  // 관련 텍스트만 추출
  const relevantContext = searchResults.matches
    .map(match => match.metadata.text)
    .join('\n\n');
  
  // 시스템 프롬프트에 관련 컨텍스트만 추가
  const systemMessage = `${bot.systemPrompt}\n\n--- 관련 자료 ---\n${relevantContext}\n--- 자료 끝 ---`;
  
  // Gemini API 호출
  // ...
};
```

### Option 3: Gemini File API 사용 (가장 간단)

Gemini는 파일을 직접 업로드하고 참조할 수 있습니다.

```typescript
// 1. 파일 업로드
const uploadResponse = await fetch(
  'https://generativelanguage.googleapis.com/v1/files',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/pdf'
    },
    body: pdfFile
  }
);
const { file } = await uploadResponse.json();

// 2. 챗 API에서 파일 참조
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: message },
            { fileData: { fileUri: file.uri, mimeType: 'application/pdf' } }
          ]
        }
      ]
    })
  }
);
```

---

## 🎯 권장 구현 순서

### Phase 1: PDF 지원 추가 (즉시 가능)
1. PDF.js 라이브러리 설치
2. 프론트엔드에서 PDF → 텍스트 변환
3. 기존 로직에 통합
4. 테스트

**예상 작업 시간**: 1-2시간

### Phase 2: RAG 구현 (중장기)
1. Cloudflare Vectorize 설정
2. 임베딩 생성 API 구현
3. 유사도 검색 로직 추가
4. AI 챗 API에 RAG 통합
5. 테스트

**예상 작업 시간**: 4-8시간

### Phase 3: Gemini File API 검토 (대안)
1. Gemini File API 테스트
2. 파일 업로드/관리 로직 구현
3. 챗 API에 파일 참조 추가

**예상 작업 시간**: 2-4시간

---

## 📊 비교표

| 방식 | 구현 난이도 | 성능 | 비용 | 유지보수 |
|------|-----------|------|------|---------|
| 현재 (전체 텍스트) | ⭐ | ❌ | 💰💰 | ⭐ |
| PDF 지원 추가 | ⭐⭐ | ❌ | 💰💰 | ⭐⭐ |
| RAG 구현 | ⭐⭐⭐⭐ | ✅ | 💰 | ⭐⭐⭐ |
| Gemini File API | ⭐⭐ | ✅ | 💰 | ⭐⭐ |

---

## 💡 즉시 적용 가능한 개선

### 1. PDF 경고 메시지 개선
현재 UI에서 PDF를 accept하면서 막고 있습니다:

```typescript
// 수정 전
accept=".txt,.md,.pdf,.json,.csv"  // PDF 포함
// 하지만 업로드하면 에러

// 수정 후 (Option A: PDF 제거)
accept=".txt,.md,.json,.csv"

// 또는 (Option B: PDF 지원 추가)
accept=".txt,.md,.pdf,.json,.csv"
// + PDF 파싱 로직 추가
```

### 2. 지식 베이스 크기 제한
토큰 제한을 고려하여 경고 추가:

```typescript
if (formData.knowledgeBase.length > 50000) {
  alert('⚠️ 지식 베이스가 너무 큽니다 (50,000자 초과).\nAI 응답 품질이 저하될 수 있습니다.\n\nRAG 구현을 권장합니다.');
}
```

---

## 🔗 참고 자료

- [PDF.js 공식 문서](https://mozilla.github.io/pdf.js/)
- [Gemini File API](https://ai.google.dev/gemini-api/docs/file-api)
- [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/)
- [Gemini Embedding API](https://ai.google.dev/gemini-api/docs/embeddings)

---

## 📝 다음 단계

**사용자 결정 필요**:
1. PDF 지원을 즉시 추가할지?
2. RAG를 구현할지?
3. Gemini File API를 사용할지?

**권장사항**:
- **단기**: PDF 지원 추가 (PDF.js)
- **중장기**: RAG 구현 (Vectorize + Embedding)
