# 🔍 출석 통계 및 숙제 채점 문제 진단 보고서

**날짜**: 2026-03-12 08:40 KST  
**요청 사항**:
1. 출석 통계 UI에 출결 데이터 미표시 문제
2. 숙제 채점 설정(DeepSeek OCR2) 작동 확인

---

## 📋 진단 결과 요약

### 1. 출석 통계 문제 ❌
**증상**: 학생과 학원장 모두 출석 통계 UI에 데이터가 표시되지 않음

**원인**: 
- ✅ API 코드: 정상 (이전 수정 완료)
- ❌ **데이터 부재**: `attendance_records_v3` 테이블에 출석 기록이 없음

**확인 결과**:
```json
{
  "success": true,
  "role": "STUDENT",
  "calendar": {},  // ← 빈 객체
  "attendanceDays": 0,
  "thisMonth": "2026-03"
}
```

### 2. 숙제 채점 문제 ❌
**증상**: Admin 페이지에서 설정한 모델이 작동하지 않음

**원인**:
- ❌ **잘못된 모델명**: `deepseek-ocr-2` (존재하지 않는 모델)
- ❌ **API 키 오류**: DEEPSEEK_API_KEY not configured

**현재 설정**:
```json
{
  "model": "deepseek-ocr-2",  // ← 잘못된 모델명!
  "temperature": 0.3,
  "enableRAG": 0
}
```

**오류 메시지**:
```
{
  "error": "DeepSeek API key not configured"
}
```

---

## 🔧 해결 방법

### 문제 1: 출석 통계 데이터 없음

#### 원인
- 학생들이 출석 체크인을 한 번도 하지 않음
- `attendance_records_v3` 테이블이 비어있음

#### 해결책

**A. 출석 체크인 테스트**
```
1. 학생 계정으로 로그인
2. 출석 체크인 페이지 접속
   https://superplacestudy.pages.dev/attendance-verify
3. 출석 코드 입력
4. 출석 완료 후 출석 통계 페이지에서 확인
```

**B. 테스트 데이터 생성 (관리자)**
```sql
-- Cloudflare Dashboard → D1 Database → Console

INSERT INTO attendance_records_v3 
  (id, userId, code, checkInTime, status, academyId) 
VALUES 
  ('att-001', 1, 'TEST001', '2026-03-01 09:00:00', 'VERIFIED', 1),
  ('att-002', 1, 'TEST002', '2026-03-05 09:15:00', 'LATE', 1),
  ('att-003', 1, 'TEST003', '2026-03-10 09:00:00', 'VERIFIED', 1),
  ('att-004', 2, 'TEST004', '2026-03-01 09:00:00', 'VERIFIED', 1),
  ('att-005', 2, 'TEST005', '2026-03-05 09:00:00', 'VERIFIED', 1);
```

**C. 출석 코드 확인**
- 학생의 `attendance` 컬럼에 출석 코드가 있는지 확인
- User 테이블 또는 users 테이블 확인

---

### 문제 2: 숙제 채점 모델 잘못 설정

#### 원인
**잘못된 모델명**: `deepseek-ocr-2`는 존재하지 않는 모델입니다.

**올바른 DeepSeek 모델명**:
- `deepseek-chat` ✅ (일반 대화형 모델, 이미지 지원)
- `deepseek-reasoner` ✅ (추론 모델)
- ~~`deepseek-ocr-2`~~ ❌ (존재하지 않음)

#### 해결책

**방법 1: Admin UI에서 모델 수정**
```
1. https://superplacestudy.pages.dev/dashboard/admin/homework-grading-config/ 접속
2. "Model" 드롭다운에서 deepseek-chat 선택
3. "저장" 버튼 클릭
4. 테스트 숙제 제출하여 확인
```

**방법 2: API로 직접 수정**
```bash
curl -X POST "https://superplacestudy.pages.dev/api/admin/homework-grading-config" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "temperature": 0.3,
    "enableRAG": 0
  }'
```

**방법 3: Gemini 모델 사용**
```
GOOGLE_GEMINI_API_KEY는 이미 설정되어 있으므로
Admin UI에서 "gemini-2.5-flash" 선택
```

---

## 🧪 검증 방법

### 1. 출석 통계 검증

**Step 1: 출석 체크인**
```
URL: https://superplacestudy.pages.dev/attendance-verify
학생 계정으로 출석 코드 입력
```

**Step 2: 출석 통계 확인**
```
URL: https://superplacestudy.pages.dev/dashboard/attendance-statistics/
캘린더에 🟢 출석 표시 확인
```

**Step 3: API 직접 확인**
```bash
# 학생 계정 (userId=1 예시)
curl "https://superplacestudy.pages.dev/api/attendance/statistics?userId=1&role=STUDENT&academyId="

# 기대 결과
{
  "success": true,
  "calendar": {
    "2026-03-01": "VERIFIED",
    "2026-03-05": "LATE",
    ...
  },
  "attendanceDays": 3
}
```

### 2. 숙제 채점 검증

**Step 1: 모델 수정**
```
Admin UI에서 deepseek-chat 또는 gemini-2.5-flash 선택
```

**Step 2: 설정 확인**
```bash
curl "https://superplacestudy.pages.dev/api/admin/homework-grading-config" | jq '.config.model'
# 결과: "deepseek-chat" 또는 "gemini-2.5-flash"
```

**Step 3: 실제 채점 테스트**
```bash
# 1. 숙제 제출
RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="]
  }')

SUBMISSION_ID=$(echo "$RESPONSE" | jq -r '.submission.id')

# 2. 15초 대기 후 상태 확인
sleep 15
curl "https://superplacestudy.pages.dev/api/homework/status/$SUBMISSION_ID" | jq '{status, score: .grading.score}'

# 기대 결과
{
  "status": "graded",
  "score": 75
}
```

---

## 📊 코드 검토 결과

### 출석 통계 API (functions/api/attendance/statistics.ts)
```typescript
// ✅ 수정 완료 (이전 작업)
const result = await DB.prepare(`
  SELECT substr(checkInTime, 1, 10) as date, status, userId
  FROM attendance_records_v3
  WHERE userId = ?
`).bind(userId).all();

// 모든 월 데이터 반환 (thisMonth 필터링 제거됨)
result.results.filter((r: any) => r.date).forEach(...)
```

**상태**: ✅ 코드 정상 (데이터만 없음)

### 숙제 채점 API (functions/api/homework/process-grading.ts)
```typescript
// ✅ 모델 선택 로직 정상
const model = config?.model || 'deepseek-chat';

if (model.startsWith('deepseek')) {
  apiKey = DEEPSEEK_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "DeepSeek API key not configured" });
  }
  return await performDeepSeekGrading(...);
}
```

**상태**: ✅ 코드 정상

**문제**:
- Admin UI에서 잘못된 모델명(`deepseek-ocr-2`) 저장
- DeepSeek API 키 미설정 (DEEPSEEK_API_KEY 환경변수 필요)

---

## 🎯 즉시 조치 사항

### 우선순위 1: 숙제 채점 모델 수정 🔴
```
현재 상태: deepseek-ocr-2 (잘못된 모델명)
→ 수정 필요: deepseek-chat 또는 gemini-2.5-flash

조치 방법:
1. Admin UI 접속
2. Model 드롭다운에서 올바른 모델 선택
   - deepseek-chat (DEEPSEEK_API_KEY 필요)
   - gemini-2.5-flash (이미 설정된 GOOGLE_GEMINI_API_KEY 사용)
3. 저장 후 테스트
```

### 우선순위 2: 출석 데이터 생성 🟡
```
현재 상태: attendance_records_v3 테이블 비어있음
→ 출석 체크인 또는 테스트 데이터 생성 필요

조치 방법:
1. 학생 계정으로 출석 체크인 페이지 접속
2. 출석 코드 입력
3. 또는 D1 Console에서 테스트 데이터 INSERT
```

---

## 🔍 추가 확인 필요 사항

### 1. DEEPSEEK_API_KEY 환경변수
```
DeepSeek 모델 사용 시 필수

설정 위치:
Cloudflare Pages → superplacestudy → Settings → Environment Variables
변수명: DEEPSEEK_API_KEY
값: sk-xxxxxxxxxxxxxxxx (DeepSeek API 키)

발급: https://platform.deepseek.com
```

### 2. 학생 출석 코드 확인
```sql
-- User 테이블에서 출석 코드 확인
SELECT id, name, attendance FROM User WHERE role = 'STUDENT';
SELECT id, name, attendance FROM users WHERE role = 'STUDENT';
```

출석 코드가 없으면:
1. Admin 페이지에서 출석 코드 생성
2. 또는 출석 코드 활성화 API 호출

---

## 📝 결론

### 출석 통계 문제
- **API 코드**: ✅ 정상
- **데이터**: ❌ 없음 (출석 체크인 필요)
- **해결**: 학생이 출석 체크인을 하거나 테스트 데이터 생성

### 숙제 채점 문제
- **API 코드**: ✅ 정상
- **모델 설정**: ❌ 잘못됨 (`deepseek-ocr-2` → `deepseek-chat` 또는 `gemini-2.5-flash`)
- **API 키**: ⚠️ DEEPSEEK_API_KEY 미설정 (Gemini는 설정됨)
- **해결**: Admin UI에서 올바른 모델 선택

---

## 🔗 관련 URL

- **출석 통계**: https://superplacestudy.pages.dev/dashboard/attendance-statistics/
- **출석 체크인**: https://superplacestudy.pages.dev/attendance-verify
- **숙제 채점 설정**: https://superplacestudy.pages.dev/dashboard/admin/homework-grading-config/
- **Cloudflare Dashboard**: https://dash.cloudflare.com

---

**작성**: AI Assistant  
**진단 일시**: 2026-03-12 08:40 KST  
**상태**: 진단 완료, 조치 필요
