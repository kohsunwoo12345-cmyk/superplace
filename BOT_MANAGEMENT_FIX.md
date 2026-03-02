# 🤖 AI 봇 관리 - 학원 목록 표시 문제 해결

## 📅 작성일: 2026-03-02

## 🐛 문제 설명
- **페이지**: https://superplacestudy.pages.dev/dashboard/admin/bot-management/
- **증상**: 봇 할당 시 "학원 선택" 필드에 학원 목록이 표시되지 않음
- **원인**: API 호출 시 Authorization 헤더를 전달하지 않아 401 Unauthorized 발생

---

## ✅ 해결 방법

### 수정된 함수들

#### 1. `fetchAcademies()` - 학원 목록 로드
```typescript
const fetchAcademies = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/admin/academies", {
      headers: {
        Authorization: `Bearer ${token}`,  // ✅ 토큰 추가
      },
    });
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Academies loaded:", data.academies?.length || 0);
      setAcademies(data.academies || []);
    }
  } catch (error) {
    console.error("학원 목록 로드 실패:", error);
  }
};
```

#### 2. `fetchBots()` - AI 봇 목록 로드
```typescript
const fetchBots = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/admin/ai-bots", {
      headers: {
        Authorization: `Bearer ${token}`,  // ✅ 토큰 추가
      },
    });
    // ...
  }
};
```

#### 3. `fetchAssignments()` - 할당 목록 로드
```typescript
const fetchAssignments = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/admin/bot-assignments", {
      headers: {
        Authorization: `Bearer ${token}`,  // ✅ 토큰 추가
      },
    });
    // ...
  }
};
```

#### 4. `handleAssignBot()` - 봇 할당
```typescript
const handleAssignBot = async () => {
  // ...
  const token = localStorage.getItem("token");
  const response = await fetch("/api/admin/bot-assignments", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,  // ✅ 토큰 추가
    },
    body: JSON.stringify({ /* ... */ }),
  });
  // ...
};
```

#### 5. `handleRevokeBot()` - 봇 할당 취소
```typescript
const handleRevokeBot = async (assignmentId: number) => {
  // ...
  const token = localStorage.getItem("token");
  const response = await fetch(`/api/admin/bot-assignments/${assignmentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,  // ✅ 토큰 추가
    },
  });
  // ...
};
```

---

## 🔧 추가 개선 사항

### 디버깅 로그 추가
각 데이터 로드 함수에 성공/실패 로그 추가:
```typescript
console.log("✅ Academies loaded:", data.academies?.length || 0);
console.log("✅ Bots loaded:", data.bots?.length || 0);
console.log("✅ Assignments loaded:", data.assignments?.length || 0);
console.error("❌ Failed to load academies, status:", response.status);
```

---

## 📊 테스트 방법

### 1. 페이지 접속
```
https://superplacestudy.pages.dev/dashboard/admin/bot-management/
```

### 2. 로그인 확인
- 로그인한 상태여야 함
- localStorage에 `token` 존재 확인

### 3. 개발자 도구 확인 (F12)
```javascript
// Console에서 다음 로그 확인:
✅ Academies loaded: 3
✅ Bots loaded: 5
✅ Assignments loaded: 2
```

### 4. 할당 모달 테스트
1. "개별 할당" 버튼 클릭
2. "학원 선택" 드롭다운 확인
3. **기대 결과**: 학원 목록이 정상 표시됨
   ```
   학원을 선택하세요
   강남학원 (academy-001)
   서초학원 (academy-002)
   ...
   ```

### 5. 할당 테스트
1. 학원 선택
2. 봇 선택
3. 만료일 설정 (선택)
4. "할당" 버튼 클릭
5. **기대 결과**: "봇이 할당되었습니다." 알림 표시

---

## 🚨 문제 발생 시 체크리스트

### 학원 목록이 여전히 비어있을 때
1. **로그인 상태 확인**
   ```javascript
   // F12 Console
   localStorage.getItem('token')
   // null이 아니어야 함
   ```

2. **API 응답 확인**
   ```javascript
   // F12 Network 탭
   // /api/admin/academies 요청 확인
   // Status: 200 OK
   // Response: { success: true, academies: [...] }
   ```

3. **학원장 데이터 확인**
   - 학원장(DIRECTOR) 역할의 사용자가 DB에 등록되어 있는지 확인
   - https://superplacestudy.pages.dev/dashboard/admin/users/ 에서 확인

4. **토큰 갱신**
   - 토큰이 만료된 경우 다시 로그인

### API가 401 Unauthorized 반환
```javascript
// 문제: Authorization 헤더가 없거나 잘못된 토큰
// 해결: 로그아웃 후 다시 로그인
```

### 봇 목록이 비어있을 때
- AI 봇이 등록되어 있는지 확인
- https://superplacestudy.pages.dev/dashboard/admin/ai-bots/ 에서 확인

---

## 📝 관련 API 엔드포인트

### 1. `/api/admin/academies` (GET)
- **인증**: Bearer Token 필수
- **응답**:
  ```json
  {
    "success": true,
    "academies": [
      {
        "id": "1",
        "name": "강남학원",
        "code": "academy-001",
        "directorName": "김원장",
        "studentCount": 15,
        "teacherCount": 3
      }
    ],
    "total": 1
  }
  ```

### 2. `/api/admin/ai-bots` (GET)
- **인증**: Bearer Token 필수
- **응답**:
  ```json
  {
    "success": true,
    "bots": [
      {
        "id": "bot-1",
        "name": "수학 봇",
        "profileIcon": "🤖",
        "isActive": true
      }
    ]
  }
  ```

### 3. `/api/admin/bot-assignments` (GET, POST, DELETE)
- **인증**: Bearer Token 필수
- **POST 요청**:
  ```json
  {
    "academyId": "1",
    "botId": "bot-1",
    "expiresAt": "2026-12-31T23:59:59",
    "notes": "무료 체험"
  }
  ```

---

## 🔗 GitHub 커밋

- **커밋 ID**: `320daaf`
- **URL**: https://github.com/kohsunwoo12345-cmyk/superplace/commit/320daaf
- **변경 파일**: `src/app/dashboard/admin/bot-management/page.tsx`
- **변경 사항**: 
  - Authorization 헤더 추가 (5개 함수)
  - 콘솔 로그 추가 (디버깅)

---

## ⏰ 배포 정보

- **커밋 시간**: 2026-03-02 07:10 UTC
- **배포 플랫폼**: Cloudflare Pages
- **예상 배포 완료**: 2026-03-02 07:13 UTC (약 3분)
- **배포 URL**: https://superplacestudy.pages.dev

---

## ✅ 최종 체크리스트

- [x] Authorization 헤더 추가
- [x] 콘솔 로그 추가
- [x] 빌드 성공
- [x] GitHub 푸시 완료
- [x] Cloudflare Pages 배포 대기 중
- [ ] 브라우저 테스트 (사용자)
- [ ] 학원 목록 정상 표시 확인
- [ ] 할당 기능 정상 작동 확인

---

**작성자**: AI Assistant  
**최종 업데이트**: 2026-03-02 07:10 UTC  
**상태**: ✅ 수정 완료, 배포 대기 중
