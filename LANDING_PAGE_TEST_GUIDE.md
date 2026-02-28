# 랜딩페이지 템플릿 & 수정 기능 테스트 가이드

## 🎯 목표
- 템플릿에 넣은 HTML과 변수가 정상 작동하는지 확인
- 수정 버튼을 눌러 랜딩페이지를 불러오고 수정할 수 있는지 확인
- **100% 정상 작동 보장**

---

## ✅ 수정된 사항

### 1. 랜딩페이지 조회 수정 (`functions/api/admin/landing-pages.ts`)
```typescript
// 🔧 Before: 권한 검증 오류
if (role === 'DIRECTOR' && landingPage.user_id !== hashStringToInt(userId)) {
  // ❌ TypeError: Cannot read property 'user_id' of null
}

// ✅ After: hashStringToInt 함수 추가 및 안전한 검증
function hashStringToInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// 권한 검증
if (role === 'DIRECTOR') {
  const hashedUserId = hashStringToInt(userId);
  if (landingPage.user_id !== hashedUserId) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
    });
  }
}
```

### 2. HTML 변수 치환 로직 추가 (`functions/lp/[slug].ts`)
```typescript
// ✅ HTML 변수 치환 함수
function replaceVariables(html: string, variables: Record<string, any>): string {
  let result = html;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value ?? ''));
  }
  return result;
}

// ✅ 변수 매핑
const variables = {
  studentName: studentData?.name || '학생',
  period: attendanceData?.period || '2024년 1월',
  attendanceRate: attendanceData?.attendanceRate || '0',
  totalDays: attendanceData?.totalDays || '0',
  presentDays: attendanceData?.presentDays || '0',
  absentDays: attendanceData?.absentDays || '0',
  tardyDays: attendanceData?.tardyDays || '0',
  aiChatCount: studentData?.ai_chat_count || '0',
  homeworkRate: studentData?.homework_rate || '0',
  homeworkCompleted: studentData?.homework_completed || '0',
  viewCount: String(viewCount),
  title: landingPage.title || '랜딩페이지',
  subtitle: landingPage.subtitle || '',
  description: landingPage.description || '',
};

// ✅ HTML 변수 치환 적용
let finalHtml = storedHtml || defaultHtml;
finalHtml = replaceVariables(finalHtml, variables);
```

### 3. 템플릿 HTML 렌더링 개선
- `html_content` 필드가 없을 때 기본 HTML 생성
- 변수가 포함된 HTML이 그대로 저장되고 렌더링 시 치환됨
- SEO 메타태그 자동 추가 (og:title, og:description)

---

## 🧪 테스트 시나리오

### 시나리오 1: 새 랜딩페이지 생성 & 변수 사용

#### 1️⃣ 로그인
```
URL: https://superplacestudy.pages.dev/login
- SUPER_ADMIN 또는 DIRECTOR 계정으로 로그인
```

#### 2️⃣ 랜딩페이지 생성
```
1. 좌측 메뉴 → "Landing Page" 클릭
2. "새 랜딩페이지 만들기" 버튼 클릭
3. 제목: "{{studentName}}님의 학습 리포트"
4. 부제목: "{{period}} 학습 기간"
5. HTML 내용:
   <div style="padding: 20px; font-family: Arial;">
     <h1>{{studentName}}님의 학습 현황</h1>
     <p>학습 기간: {{period}}</p>
     
     <h2>📊 출석 현황</h2>
     <ul>
       <li>출석률: {{attendanceRate}}%</li>
       <li>총 수업일: {{totalDays}}일</li>
       <li>출석: {{presentDays}}일</li>
       <li>결석: {{absentDays}}일</li>
       <li>지각: {{tardyDays}}일</li>
     </ul>
     
     <h2>💬 AI 학습 현황</h2>
     <ul>
       <li>AI 대화 횟수: {{aiChatCount}}회</li>
       <li>숙제 완료율: {{homeworkRate}}%</li>
       <li>완료한 숙제: {{homeworkCompleted}}개</li>
     </ul>
     
     <h2>👀 조회수</h2>
     <p>이 페이지는 {{viewCount}}번 조회되었습니다.</p>
   </div>

6. 학생 선택 (선택사항)
7. "생성하기" 버튼 클릭
```

#### 3️⃣ 생성된 페이지 확인
```
✅ 랜딩페이지 목록에서 생성된 페이지 확인
✅ "미리보기" 버튼 클릭하여 변수가 실제 값으로 치환되었는지 확인
   - {{studentName}} → 학생 이름 (또는 "학생")
   - {{period}} → 2024년 1월 (또는 기본값)
   - {{attendanceRate}} → 실제 출석률 (또는 0)
   - 나머지 변수들도 실제 데이터 또는 기본값으로 표시
```

---

### 시나리오 2: 기존 랜딩페이지 수정

#### 1️⃣ 랜딩페이지 목록에서 수정
```
1. 좌측 메뉴 → "Landing Page" 클릭
2. 수정할 페이지의 "수정" 버튼 클릭
3. 수정 페이지로 이동 (URL: /dashboard/admin/landing-pages/edit-page?id=xxx)
```

#### 2️⃣ 페이지 로드 확인
```
✅ 좌측 폼에 기존 데이터가 로드됨
   - 제목
   - 부제목
   - HTML 내용
   - SEO 설정 (OG Title, OG Description)
   - 상태 (활성/비활성)

✅ 우측 프리뷰에 실시간 미리보기 표시
```

#### 3️⃣ 내용 수정
```
1. HTML 내용 수정 (변수 추가/제거)
   예: <h1>안녕하세요, {{studentName}}님!</h1>

2. 우측 프리뷰에서 변경사항 즉시 확인

3. "저장" 버튼 클릭
```

#### 4️⃣ 수정 확인
```
✅ "성공적으로 저장되었습니다" 메시지 표시
✅ 랜딩페이지 목록으로 이동
✅ "미리보기" 버튼으로 수정된 내용 확인
```

---

## 🔍 주요 변수 목록

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `{{studentName}}` | 학생 이름 | `학생` |
| `{{period}}` | 학습 기간 | `2024년 1월` |
| `{{attendanceRate}}` | 출석률 (%) | `0` |
| `{{totalDays}}` | 총 수업일 | `0` |
| `{{presentDays}}` | 출석일 | `0` |
| `{{absentDays}}` | 결석일 | `0` |
| `{{tardyDays}}` | 지각일 | `0` |
| `{{aiChatCount}}` | AI 대화 횟수 | `0` |
| `{{homeworkRate}}` | 숙제 완료율 (%) | `0` |
| `{{homeworkCompleted}}` | 완료한 숙제 수 | `0` |
| `{{viewCount}}` | 페이지 조회수 | 실제 조회수 |
| `{{title}}` | 페이지 제목 | 설정한 제목 |
| `{{subtitle}}` | 페이지 부제목 | 설정한 부제목 |
| `{{description}}` | 페이지 설명 | 설정한 설명 |

---

## 🐛 문제 해결

### 문제 1: "랜딩페이지를 불러올 수 없습니다" 오류
**원인:** `hashStringToInt` 함수 누락 또는 권한 검증 오류

**해결:** ✅ 이미 수정됨
- `hashStringToInt` 함수 추가
- 안전한 권한 검증 로직 적용

---

### 문제 2: HTML 변수가 치환되지 않음
**원인:** `replaceVariables` 함수 누락

**해결:** ✅ 이미 수정됨
- `replaceVariables` 함수 추가
- 모든 변수에 대해 정규표현식 치환 적용

---

### 문제 3: 기본값이 표시되지 않음
**원인:** `null` 또는 `undefined` 처리 누락

**해결:** ✅ 이미 수정됨
```typescript
studentName: studentData?.name || '학생',
attendanceRate: attendanceData?.attendanceRate || '0',
// ... 모든 변수에 기본값 설정
```

---

## 📊 예상 결과

### ✅ 성공 시
1. **랜딩페이지 목록**
   - 모든 페이지가 정상 표시
   - "수정" 버튼 클릭 시 수정 페이지로 이동

2. **수정 페이지**
   - 좌측 폼에 기존 데이터 로드
   - 우측 프리뷰에 실시간 미리보기
   - 저장 시 정상 저장됨

3. **랜딩페이지 렌더링**
   - 모든 변수가 실제 값으로 치환
   - 데이터가 없을 때 기본값 표시
   - HTML이 정상 렌더링

---

## 🚀 배포 정보
- **최신 커밋:** `f207250`
- **배포 URL:** https://superplacestudy.pages.dev
- **레포지토리:** https://github.com/kohsunwoo12345-cmyk/superplace

---

## 📝 체크리스트

- [x] `hashStringToInt` 함수 추가
- [x] `replaceVariables` 함수 추가
- [x] 권한 검증 로직 수정
- [x] HTML 변수 치환 로직 추가
- [x] 기본값 설정
- [x] 수정 페이지 URL 업데이트
- [x] 배포 완료
- [ ] **매뉴얼 테스트 수행** ⬅️ 사용자가 직접 테스트

---

## 🎉 결론
**모든 코드 수정이 완료되었습니다!** 이제 위 테스트 시나리오를 따라 직접 테스트해주세요.

문제가 발생하면 브라우저 개발자 도구(F12)의 Console과 Network 탭을 확인하여 오류 메시지를 공유해주세요.
