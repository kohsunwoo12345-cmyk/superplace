# Gemini AI 숙제 자동 채점 시스템 ✅

## 📋 개요

출석 인증 후 카메라로 숙제를 촬영하면 Google Gemini AI가 자동으로 숙제를 분석하고 채점합니다.
모든 시간은 한국 시간(KST, UTC+9)으로 기록됩니다.

## ✨ 주요 기능

### 1. AI 자동 채점
- **Google Gemini 1.5 Flash** 모델 사용
- 이미지 분석을 통한 숙제 평가
- 0-100점 자동 점수 부여

### 2. 상세 피드백
- **전체 피드백**: 2-3문장으로 전체적인 평가
- **잘한 점**: 2개 항목 추천
- **개선 제안**: 2개 항목 추천
- **과목 자동 인식**: 수학, 영어 등
- **완성도 평가**: 상/중/하
- **노력도 평가**: 상/중/하

### 3. 한국 시간(KST) 적용
- **출석 인증 시간**: 한국 시간으로 정확히 기록
- **숙제 제출 시간**: 한국 시간으로 정확히 기록
- **형식**: `YYYY-MM-DD HH:MM:SS` (예: 2026-02-05 23:45:30)

## 🔄 프로세스 플로우

```
1. 학생 출석 인증
   ↓
   [출석 코드 입력]
   ↓
   출석 기록 저장 (한국 시간)
   ↓
2. 숙제 검사 페이지 이동
   ↓
   [카메라로 숙제 촬영]
   ↓
   [사진 제출]
   ↓
3. Gemini AI 분석
   ↓
   - 숙제 내용 인식
   - 점수 부여
   - 피드백 생성
   ↓
4. 결과 저장 및 표시
   ↓
   - 데이터베이스 저장
   - 학생에게 결과 표시
   - 선생님에게 전송
```

## 🎯 Gemini AI 분석 항목

### 분석 내용
1. **점수 (score)**: 0-100점
2. **피드백 (feedback)**: 전체적인 평가
3. **잘한 점 (strengths)**: 긍정적인 측면
4. **개선 제안 (suggestions)**: 발전 방향
5. **과목 (subject)**: 자동 인식 (수학, 영어, 과학 등)
6. **완성도 (completion)**: 상/중/하
7. **노력도 (effort)**: 상/중/하

### AI 프롬프트 구조
```
당신은 학생의 숙제를 채점하는 선생님입니다.
아래 이미지를 분석하여 JSON 형식으로 응답해주세요:

{
  "score": 85,
  "feedback": "전체적으로 잘 작성했습니다...",
  "strengths": ["문제 풀이가 정확합니다", "글씨가 깔끔합니다"],
  "suggestions": ["단위를 더 명확히 표시하세요", "답안 확인을 해보세요"],
  "subject": "수학",
  "completion": "상",
  "effort": "상"
}
```

## 📊 데이터베이스 구조

### homework_submissions 테이블
```sql
CREATE TABLE homework_submissions (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  attendanceRecordId TEXT,
  imageUrl TEXT,
  score INTEGER,
  feedback TEXT,
  subject TEXT,
  completion TEXT,
  effort TEXT,
  strengths TEXT,
  suggestions TEXT,
  submittedAt TEXT NOT NULL,     -- 한국 시간
  gradedAt TEXT,                 -- 한국 시간
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (attendanceRecordId) REFERENCES attendance_records(id)
);
```

### attendance_records 테이블 (업데이트)
```sql
ALTER TABLE attendance_records 
ADD COLUMN homeworkSubmitted INTEGER DEFAULT 0;

ALTER TABLE attendance_records 
ADD COLUMN homeworkSubmittedAt TEXT;
```

## 🔧 API 엔드포인트

### POST /api/homework/submit
숙제 이미지를 제출하고 AI 채점을 받습니다.

**Request**:
```json
{
  "userId": 116,
  "attendanceRecordId": "attendance-xxx",
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response**:
```json
{
  "success": true,
  "submissionId": "homework-1738778730465-abc123",
  "grading": {
    "score": 85,
    "feedback": "전체적으로 잘 작성했습니다. 문제 풀이 과정이 명확하고 답도 정확합니다.",
    "strengths": [
      "문제 풀이가 정확합니다",
      "글씨가 깔끔합니다"
    ],
    "suggestions": [
      "단위를 더 명확히 표시하세요",
      "답안 확인을 해보세요"
    ],
    "subject": "수학",
    "completion": "상",
    "effort": "상",
    "submittedAt": "2026-02-05 23:45:30",
    "gradedAt": "2026-02-05 23:45:30"
  },
  "message": "숙제가 성공적으로 제출되고 채점되었습니다"
}
```

### POST /api/attendance/verify (업데이트)
출석 코드를 인증하고 한국 시간으로 기록합니다.

**Response**:
```json
{
  "success": true,
  "message": "출석이 인증되었습니다.",
  "recordId": "attendance-1738778730465-abc123",
  "verifiedAt": "2026-02-05 23:40:15"
}
```

## 🕐 한국 시간(KST) 처리

### 시간 생성 함수
```typescript
// 한국 시간 (KST = UTC+9)
function getKoreanTime(): string {
  const now = new Date();
  const kstOffset = 9 * 60; // 9시간을 분으로
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  const hours = String(kstTime.getHours()).padStart(2, '0');
  const minutes = String(kstTime.getMinutes()).padStart(2, '0');
  const seconds = String(kstTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
```

### 날짜 비교 (오늘 출석 확인)
```typescript
// 한국 날짜 (YYYY-MM-DD)
function getKoreanDate(): string {
  const now = new Date();
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// 오늘 출석 기록 확인
const today = getKoreanDate(); // "2026-02-05"
const query = `
  SELECT * FROM attendance_records 
  WHERE userId = ? 
  AND substr(verifiedAt, 1, 10) = ?
`;
```

## 🎨 UI 표시 예시

### 채점 결과 화면
```
┌─────────────────────────────────┐
│         ✓ 제출 완료!            │
│   AI가 숙제를 채점했습니다      │
├─────────────────────────────────┤
│  점수                           │
│  85점                          │
├─────────────────────────────────┤
│  AI 피드백                      │
│  전체적으로 잘 작성했습니다.    │
│  문제 풀이 과정이 명확하고      │
│  답도 정확합니다.              │
├─────────────────────────────────┤
│  👍 잘한 점                     │
│  • 문제 풀이가 정확합니다       │
│  • 글씨가 깔끔합니다           │
├─────────────────────────────────┤
│  💡 개선 제안                   │
│  • 단위를 더 명확히 표시하세요  │
│  • 답안 확인을 해보세요         │
├─────────────────────────────────┤
│  제출 시간: 2026-02-05 23:45:30 │
└─────────────────────────────────┘
```

## 🧪 테스트

### 1. 데이터베이스 마이그레이션
```bash
curl -X POST "https://genspark-ai-developer.superplacestudy.pages.dev/api/admin/migrate-homework-table"

# 응답
{
  "success": true,
  "message": "Homework submissions table created successfully",
  "tableInfo": [...]
}
```

### 2. 출석 인증 (한국 시간)
```bash
curl -X POST "https://genspark-ai-developer.superplacestudy.pages.dev/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d '{"userId": "116", "code": "562313"}'

# 응답
{
  "success": true,
  "message": "출석이 인증되었습니다.",
  "recordId": "attendance-1738778730465-abc123",
  "verifiedAt": "2026-02-05 23:40:15"  # 한국 시간
}
```

### 3. 숙제 제출 및 채점
```bash
# 프론트엔드에서 자동 호출
# imageData: base64 인코딩된 이미지
# Gemini AI가 자동으로 분석 및 채점
```

## 📝 수정/생성된 파일

1. **functions/api/homework/submit.ts** (생성)
   - Gemini AI 숙제 채점 API
   - 이미지 분석 및 JSON 응답 파싱
   - 한국 시간 저장

2. **functions/api/attendance/verify.ts** (수정)
   - 한국 시간(KST) 적용
   - 출석 기록에 한국 시간 저장
   - 오늘 출석 확인 로직 개선

3. **functions/api/admin/migrate-homework-table.ts** (생성)
   - homework_submissions 테이블 생성
   - attendance_records 테이블 업데이트

## 🚀 배포 정보

- **배포 URL**: https://genspark-ai-developer.superplacestudy.pages.dev
- **브랜치**: genspark_ai_developer
- **최종 커밋**: e440094
- **상태**: ✅ 배포 완료

## ⚙️ 환경 변수

Cloudflare Pages에서 다음 환경 변수가 필요합니다:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

**설정 방법**:
1. Cloudflare Pages 대시보드
2. 프로젝트 선택
3. Settings > Environment variables
4. GEMINI_API_KEY 추가

## 💡 사용 시나리오

### 시나리오 1: 학생이 숙제 제출
1. **출석 인증**
   - 출석 인증 페이지 접속
   - 6자리 코드 입력
   - 출석 완료 (한국 시간 기록)

2. **숙제 검사 페이지 자동 이동**
   - `/homework-check?userId=116&attendanceId=attendance-xxx`

3. **숙제 촬영**
   - 카메라로 숙제 촬영
   - 이미지 확인

4. **제출 및 채점**
   - "제출하기" 버튼 클릭
   - AI 채점 중... (약 3-5초)
   - 채점 결과 표시

5. **결과 확인**
   - 점수, 피드백, 잘한 점, 개선 제안
   - 5초 후 완료 페이지로 이동

### 시나리오 2: 선생님이 결과 확인
1. 학생 관리 페이지 접속
2. 학생 상세 페이지 접속
3. "활동 내역" 탭 선택
4. 숙제 제출 내역 및 점수 확인
5. AI 피드백 확인

## 🔍 AI 분석 예시

### 예시 1: 수학 숙제
```json
{
  "score": 90,
  "feedback": "문제를 정확하게 풀었고 풀이 과정도 체계적입니다. 답도 모두 맞았습니다.",
  "strengths": [
    "모든 문제를 정확하게 풀었습니다",
    "풀이 과정이 명확하고 논리적입니다"
  ],
  "suggestions": [
    "단위를 좀 더 명확히 표시하면 좋겠습니다",
    "그림을 그려서 문제를 시각화하면 더 좋습니다"
  ],
  "subject": "수학",
  "completion": "상",
  "effort": "상"
}
```

### 예시 2: 영어 숙제
```json
{
  "score": 75,
  "feedback": "문법은 대체로 정확하나 일부 단어 철자에 오류가 있습니다. 문장 구성은 좋습니다.",
  "strengths": [
    "문장 구조가 잘 짜여있습니다",
    "다양한 어휘를 사용했습니다"
  ],
  "suggestions": [
    "철자를 다시 한 번 확인하세요",
    "문장 부호를 좀 더 정확히 사용하세요"
  ],
  "subject": "영어",
  "completion": "중",
  "effort": "상"
}
```

### 예시 3: 이미지 불명확
```json
{
  "score": null,
  "feedback": "이미지가 흐릿하여 숙제 내용을 정확히 확인할 수 없습니다.",
  "strengths": [],
  "suggestions": [
    "조명을 밝게 하고 다시 촬영해주세요",
    "카메라를 숙제에 가까이 대고 촬영하세요"
  ],
  "subject": "확인 불가",
  "completion": "확인 불가",
  "effort": "확인 불가"
}
```

## 🎯 주요 특징

### 1. 정확한 시간 기록
- 모든 시간이 한국 시간(KST)으로 저장
- 출석 시간: `2026-02-05 09:00:00`
- 숙제 제출 시간: `2026-02-05 15:30:00`

### 2. 자동화된 채점
- 선생님의 수동 채점 불필요
- 즉시 피드백 제공
- 일관된 평가 기준

### 3. 상세한 피드백
- 단순 점수 뿐만 아니라 상세 피드백
- 긍정적 강화 (잘한 점)
- 건설적 제안 (개선 방향)

### 4. 학습 데이터 축적
- 모든 숙제 제출 기록 저장
- 학생별 성장 추적 가능
- 과목별 통계 분석 가능

## 🐛 문제 해결

### Q: Gemini API 에러가 발생합니다
**A**: 
1. GEMINI_API_KEY 환경 변수 확인
2. API 키 유효성 확인
3. API 할당량 확인

### Q: 시간이 한국 시간이 아닙니다
**A**: 
1. getKoreanTime() 함수 확인
2. UTC+9 오프셋 적용 확인
3. 데이터베이스 저장 시 한국 시간 사용 확인

### Q: AI 채점이 부정확합니다
**A**: 
1. 이미지 품질 확인 (선명도, 조명)
2. 프롬프트 최적화
3. 온도(temperature) 조정 (현재 0.4)

## 📈 향후 개선사항

1. **이미지 저장소 연동**
   - 현재: base64만 전송
   - 개선: Cloudflare R2 또는 S3에 이미지 저장

2. **배치 채점**
   - 여러 학생의 숙제를 한 번에 채점

3. **채점 기준 커스터마이징**
   - 선생님이 채점 기준 설정 가능

4. **채점 이력 추적**
   - 학생별 숙제 점수 추이 그래프

5. **AI 피드백 개선**
   - 더 상세하고 구체적인 피드백
   - 학생 수준에 맞춘 피드백

---

## ✨ 요약

**Gemini AI 숙제 자동 채점 시스템이 성공적으로 구현되었습니다!**

- ✅ Gemini 1.5 Flash API 통합
- ✅ 이미지 분석 및 자동 채점
- ✅ 상세 피드백 (점수, 잘한 점, 개선 제안)
- ✅ 한국 시간(KST) 정확히 적용
- ✅ 출석 기록과 연동
- ✅ 데이터베이스 저장
- ✅ 실시간 결과 표시

**테스트 URL**: 
- 출석 인증: https://genspark-ai-developer.superplacestudy.pages.dev/attendance-verify
- 숙제 검사: https://genspark-ai-developer.superplacestudy.pages.dev/homework-check

---

*구현 완료: 2026-02-05*  
*배포 환경: Cloudflare Pages*  
*AI 모델: Google Gemini 1.5 Flash*
