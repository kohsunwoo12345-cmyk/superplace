# 🔍 100% 문제 분석 보고서

날짜: 2026-02-11 16:00 UTC

## 📋 문제 요약

### 문제 1: "부족한 개념 분석" 버튼 클릭 시 "Load failed" 오류
- **증상**: F12 콘솔에 "Load failed" 메시지 표시, 분석 결과가 화면에 표시되지 않음
- **발생 위치**: `/dashboard/students/detail?id=3`의 "부족한 개념" 탭

### 문제 2: 숙제 결과 페이지에서 "AI 채점하기" 버튼 누락
- **증상**: 제출된 숙제에 AI 채점 버튼이 표시되지 않음
- **발생 위치**: `/dashboard/homework/results/`
- **영향**: 백그라운드 채점이 실패했을 때 수동으로 재채점할 방법이 없음

### 문제 3: 프리로드된 폰트 리소스 미사용 경고
- **증상**: `e4af272ccee01ff0-s.p.woff2` 파일이 로드되었지만 사용되지 않음
- **영향**: 성능 저하, 불필요한 네트워크 요청

---

## 🔬 문제 1: "부족한 개념 분석" Load failed 오류

### 근본 원인

#### 1.1 API 응답 시간 (11초)
```bash
# 테스트 결과
curl -X POST https://superplacestudy.pages.dev/api/students/weak-concepts \
  -d '{"studentId":"3"}' \
  -H "Content-Type: application/json"

# 응답 시간: 11,261ms (11초)
```

**문제**: 
- Gemini API 호출에 10초 이상 소요
- 브라우저 fetch 타임아웃 (기본 30초)에는 문제없지만, 사용자 경험 저하
- 느린 응답으로 인해 네트워크 오류처럼 보일 수 있음

#### 1.2 CORS 및 인증 문제
- API는 `/api/students/weak-concepts`로 호출됨 (상대 경로)
- 하지만 `Authorization: Bearer ${token}` 헤더가 필요
- **토큰이 없거나 만료된 경우 API 실패**

#### 1.3 에러 처리 부족
```typescript
// 현재 코드 (src/app/dashboard/students/detail/page.tsx:236-261)
const analyzeWeakConcepts = async () => {
  try {
    setConceptAnalyzingLoading(true);
    const token = localStorage.getItem("token");

    const response = await fetch(`/api/students/weak-concepts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studentId }),
    });

    if (response.ok) {
      const data = await response.json();
      setWeakConcepts(data.weakConcepts || []);
      setConceptRecommendations(data.recommendations || []);
      setConceptSummary(data.summary || "");
    } else {
      throw new Error("부족한 개념 분석에 실패했습니다.");
    }
  } catch (error: any) {
    console.error("Failed to analyze weak concepts:", error);
    alert(error.message || "부족한 개념 분석 중 오류가 발생했습니다.");
  } finally {
    setConceptAnalyzingLoading(false);
  }
};
```

**문제점**:
1. **네트워크 오류 시 상세 정보 없음**: `response.ok`가 false일 때 응답 본문을 읽지 않음
2. **타임아웃 없음**: 11초 이상 걸리는 API를 무한정 기다림
3. **로딩 상태 UI 부족**: "분석 중..." 메시지만 표시, 진행률 없음
4. **에러 메시지가 사용자 친화적이지 않음**: "Load failed"는 브라우저 기본 메시지

---

## 🔬 문제 2: 숙제 결과 페이지 "AI 채점하기" 버튼 누락

### 근본 원인

#### 2.1 함수는 정의되어 있지만 호출되지 않음
```typescript
// functions/api/homework/submit.ts에서 자동 채점 호출
const handleGradeSubmission = async (submissionId: string) => {
  // 정의만 되어 있고 UI에서 호출되지 않음
  try {
    console.log('🤖 AI 채점 시작:', submissionId);
    const token = localStorage.getItem('token');
    
    const response = await fetch('/api/homework/process-grading', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ submissionId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '채점 실패');
    }
    
    const data = await response.json();
    console.log('✅ 채점 완료:', data);
    
    // 숙제 결과 다시 불러오기
    await fetchHomeworkResults(currentUser, selectedDate);
    
    alert(`✅ 채점 완료!\n점수: ${data.grading?.score || '확인 중'}점`);
  } catch (error: any) {
    console.error('❌ 채점 오류:', error);
    alert('채점 중 오류가 발생했습니다: ' + error.message);
  }
};
```

#### 2.2 UI에 버튼 없음
```typescript
// src/app/dashboard/homework/results/page.tsx:420-479
// 제출 카드 렌더링
{submissions.map((submission) => (
  <Card key={submission.id}>
    {/* 점수와 정보만 표시 */}
    <Badge>{submission.score}점</Badge>
    {/* AI 채점하기 버튼 없음! */}
    <Button>상세 보기</Button>
  </Card>
))}
```

**문제점**:
1. **status === 'pending'이거나 score === 0일 때 버튼이 없음**
2. 백그라운드 채점이 실패해도 재시도할 방법이 없음
3. 선생님이 수동으로 채점을 트리거할 방법이 없음

#### 2.3 자동 채점 실패 케이스
```typescript
// functions/api/homework/submit.ts:130-140
// 백그라운드 채점 호출
setTimeout(async () => {
  try {
    const gradingResponse = await fetch(/* ... */);
    // 실패 시 catch로 빠짐
  } catch (err) {
    console.error('❌ Background grading failed:', err);
    // 에러 로그만 남기고 끝 -> 사용자는 모름
  }
}, 1000);
```

**문제**: 백그라운드 채점이 실패해도 사용자에게 알림 없음

---

## 🔬 문제 3: 프리로드 폰트 미사용 경고

### 근본 원인
```
The resource https://superplacestudy.pages.dev/_next/static/media/e4af272ccee01ff0-s.p.woff2 
was preloaded using link preload but not used within a few seconds
```

#### 3.1 Next.js 폰트 최적화 설정 문제
- Next.js는 자동으로 폰트를 preload함
- 하지만 해당 폰트가 즉시 사용되지 않으면 경고 발생

#### 3.2 조건부 렌더링으로 폰트 지연 사용
- 페이지 로드 시 폰트를 preload
- 실제로 폰트를 사용하는 컴포넌트가 lazy load되거나 조건부로 렌더링됨

---

## ✅ 해결 방안

### 해결 1: 부족한 개념 분석 오류 수정

#### 1.1 타임아웃 추가 및 상세 에러 처리
```typescript
const analyzeWeakConcepts = async () => {
  try {
    setConceptAnalyzingLoading(true);
    const token = localStorage.getItem("token");

    // 타임아웃 설정 (30초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`/api/students/weak-concepts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studentId }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API 오류: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ 분석 완료:', data);
    
    setWeakConcepts(data.weakConcepts || []);
    setConceptRecommendations(data.recommendations || []);
    setConceptSummary(data.summary || "");
  } catch (error: any) {
    console.error("Failed to analyze weak concepts:", error);
    
    if (error.name === 'AbortError') {
      alert('⏱️ 분석 시간이 초과되었습니다. 다시 시도해주세요.');
    } else if (error.message.includes('Failed to fetch')) {
      alert('🌐 네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
    } else {
      alert('❌ ' + (error.message || "부족한 개념 분석 중 오류가 발생했습니다."));
    }
  } finally {
    setConceptAnalyzingLoading(false);
  }
};
```

#### 1.2 진행 상태 표시 개선
```typescript
// 분석 중 메시지에 예상 시간 표시
{conceptAnalyzingLoading ? (
  <div className="text-center py-12">
    <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
    <p className="text-gray-700 font-medium">AI가 분석 중입니다...</p>
    <p className="text-sm text-gray-500 mt-2">
      약 10-15초 정도 소요될 수 있습니다.
    </p>
  </div>
) : (
  // 기존 UI
)}
```

### 해결 2: 숙제 결과 페이지 AI 채점 버튼 추가

#### 2.1 pending/score===0인 제출에 버튼 추가
```typescript
<CardContent>
  <div className="flex items-center gap-4 mb-3">
    <Badge variant="outline">
      완성도: {submission.completion}
    </Badge>
    <Badge variant="outline">
      노력도: {submission.effort}
    </Badge>
  </div>
  
  {/* 피드백 */}
  {submission.feedback && (
    <p className="text-gray-700 line-clamp-2 mb-3">
      {submission.feedback}
    </p>
  )}
  
  {/* 버튼 영역 */}
  <div className="flex gap-2">
    {/* AI 채점하기 버튼: score가 0이거나 null일 때만 표시 */}
    {(!submission.score || submission.score === 0) && (
      <Button
        variant="default"
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        onClick={(e) => {
          e.stopPropagation();
          handleGradeSubmission(submission.id);
        }}
      >
        <Brain className="w-4 h-4 mr-2" />
        AI 채점하기
      </Button>
    )}
    
    {/* 상세 보기 버튼 */}
    <Button
      variant="outline"
      onClick={(e) => {
        e.stopPropagation();
        setSelectedSubmission(submission);
      }}
    >
      <Eye className="w-4 h-4 mr-2" />
      상세 보기
    </Button>
  </div>
</CardContent>
```

#### 2.2 채점 상태 표시 추가
```typescript
// 채점 중인 제출 ID 추적
const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);

const handleGradeSubmission = async (submissionId: string) => {
  try {
    setGradingSubmissionId(submissionId);
    // ... 기존 코드
  } finally {
    setGradingSubmissionId(null);
  }
};

// UI에서 사용
{gradingSubmissionId === submission.id ? (
  <Button disabled>
    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
    채점 중...
  </Button>
) : (
  <Button onClick={() => handleGradeSubmission(submission.id)}>
    AI 채점하기
  </Button>
)}
```

### 해결 3: 프리로드 폰트 경고 제거

#### 3.1 폰트 preload 비활성화 (선택적)
```typescript
// next.config.ts
const nextConfig = {
  optimizeFonts: true,
  experimental: {
    optimizeFonts: false, // preload 비활성화
  },
};
```

#### 3.2 또는 경고 무시 (권장)
- 이 경고는 성능 최적화를 위한 것일 뿐 기능에는 영향 없음
- preload된 폰트는 캐시되어 이후 빠르게 로드됨

---

## 📊 테스트 계획

### 테스트 1: 부족한 개념 분석
1. https://superplacestudy.pages.dev/dashboard/students/detail?id=3 접속
2. "부족한 개념" 탭 클릭
3. "개념 분석 실행" 버튼 클릭
4. 10-15초 대기 후 결과 확인
5. F12 콘솔에서 에러 로그 확인

**예상 결과**:
- "분석 중..." 메시지와 예상 시간 표시
- 11초 후 분석 완료
- weakConcepts 2개 표시
- recommendations 2개 표시

### 테스트 2: AI 채점 버튼
1. https://superplacestudy.pages.dev/dashboard/homework/results/ 접속
2. 미채점 제출 찾기 (score === 0)
3. "AI 채점하기" 버튼 클릭
4. 5-10초 대기 후 결과 확인

**예상 결과**:
- "채점 중..." 메시지 표시
- 채점 완료 후 점수 업데이트
- 페이지 자동 새로고침

---

## 📈 다음 단계

1. ✅ 문제 1 수정: 타임아웃 및 에러 처리 개선
2. ✅ 문제 2 수정: AI 채점 버튼 추가
3. ⏳ 배포 및 테스트
4. ⏳ 사용자 피드백 수집
5. ⏳ 반응형 디자인 추가 개선

---

## 📝 결론

**근본 원인**:
1. **부족한 개념 분석**: API 응답 시간(11초) + 부족한 에러 처리 + 타임아웃 없음
2. **AI 채점 버튼**: UI에서 함수 호출 누락, pending 상태 처리 없음
3. **폰트 경고**: Next.js 최적화 기능의 부작용 (무시 가능)

**해결 방향**:
1. 타임아웃, 상세 에러 메시지, 진행 상태 표시 추가
2. pending 제출에 AI 채점 버튼 표시
3. 폰트 경고는 기능에 영향 없으므로 무시

**배포 후 확인 사항**:
- [ ] 부족한 개념 분석이 정상적으로 표시되는지
- [ ] AI 채점 버튼이 pending 제출에 표시되는지
- [ ] 에러 메시지가 사용자 친화적인지
- [ ] 모바일/태블릿/PC에서 정상 작동하는지
