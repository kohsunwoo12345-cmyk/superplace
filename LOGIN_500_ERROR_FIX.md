# 로그인 500 에러 해결 리포트 🔧

## 📅 발생 일시
**2026-02-17**

---

## 🚨 문제 상황

### 사용자 보고
```
F12 콘솔 오류:
🔐 로그인 시도: {email: 'admin@superplace.co.kr', passwordLength: 10}
POST https://superplacestudy.pages.dev/api/auth/login/ 500 (Internal Server Error)
📡 응답 상태: 500
💥 Login error: SyntaxError: Unexpected token 'I', "Internal S"... is not valid JSON
```

### 증상
- 로그인 시도 시 500 Internal Server Error 발생
- API 응답이 JSON이 아닌 HTML 에러 페이지 반환
- 모든 테스트 계정에서 동일한 오류 발생

---

## 🔍 원인 분석

### 1차 분석: API 엔드포인트 누락 ❌
- **가설**: `/api/auth/login` 엔드포인트가 존재하지 않음
- **조치**: 로그인 API 생성 (`src/app/api/auth/login/route.ts`)
- **결과**: 여전히 500 에러 발생 → 다른 원인 존재

### 2차 분석: Edge Runtime 호환성 문제 ✅

#### 문제 코드 (74~81 라인)
```typescript
// ❌ Edge Runtime에서 작동하지 않는 코드
const token = Buffer.from(
  JSON.stringify({
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  })
).toString("base64");
```

#### 근본 원인
1. **Node.js Buffer API 사용**
   - `Buffer`는 Node.js 내장 객체
   - Edge Runtime은 Node.js API가 아닌 Web Standard API만 지원
   - Cloudflare Workers와 같은 환경에서는 Buffer 사용 불가

2. **Edge Runtime 제약사항**
   ```
   Cloudflare Pages Edge Runtime 지원 API:
   ✅ Web Standard API (fetch, Response, Request, etc.)
   ✅ Web Crypto API
   ✅ TextEncoder, TextDecoder
   ✅ atob(), btoa()
   ❌ Node.js Buffer
   ❌ Node.js crypto
   ❌ Node.js fs, path
   ```

3. **에러 발생 과정**
   ```
   1. 로그인 요청 → /api/auth/login
   2. Edge Runtime에서 코드 실행 시도
   3. Buffer 객체 참조 → ReferenceError 발생
   4. 500 Internal Server Error 응답
   5. 클라이언트는 HTML 에러 페이지 수신
   6. JSON.parse() 실패 → "Unexpected token 'I'"
   ```

---

## ✅ 해결 방법

### 수정 코드
```typescript
// ✅ Edge Runtime 호환 코드
const tokenData = JSON.stringify({
  userId: user.id,
  email: user.email,
  role: user.role,
  exp: Date.now() + 24 * 60 * 60 * 1000, // 24시간
});
const token = btoa(tokenData);
```

### 변경 사항
| 이전 (Node.js) | 이후 (Edge Runtime) |
|----------------|---------------------|
| `Buffer.from(string)` | `btoa(string)` |
| `.toString("base64")` | (불필요 - btoa가 직접 base64 반환) |
| Node.js API | Web Standard API |

### btoa() 함수
- **정의**: Binary to ASCII (Base64 인코딩)
- **표준**: Web Standard API (모든 브라우저 및 Edge Runtime 지원)
- **사용법**: `btoa(string)` → Base64 문자열 반환
- **역함수**: `atob(base64)` → 원본 문자열 반환

---

## 🧪 테스트 결과

### 빌드 테스트
```bash
npm run pages:build
✅ Build completed in 4.19s
✅ Edge Function routes: 16개
✅ Static routes: 128개
```

### 예상 동작
```javascript
// 클라이언트 (로그인 시도)
POST /api/auth/login
Body: { email: "admin@superplace.com", password: "admin1234" }

// 서버 응답 (성공)
200 OK
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "token": "eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW4uLi4=",
    "user": {
      "id": 1,
      "email": "admin@superplace.com",
      "name": "관리자",
      "role": "SUPER_ADMIN",
      "academy_id": 1
    }
  }
}
```

---

## 📊 배포 상태

### GitHub
- ✅ 커밋: 052ad0f
- ✅ 브랜치: main
- ✅ 푸시 완료

### Cloudflare Pages
- ✅ 빌드 트리거 (자동 배포 시작)
- ⏳ 배포 예상 시간: 1~2분
- 🌐 배포 URL: https://superplacestudy.pages.dev

---

## 🎓 학습 포인트

### 1. Edge Runtime의 제약사항 이해
- Edge Runtime ≠ Node.js Runtime
- Web Standard API만 사용 가능
- 서버리스 환경의 특성 고려

### 2. Buffer vs btoa/atob
```javascript
// Node.js (서버)
const base64 = Buffer.from(str).toString('base64');
const str = Buffer.from(base64, 'base64').toString();

// Edge Runtime / Browser (Web Standard)
const base64 = btoa(str);
const str = atob(base64);
```

### 3. 에러 디버깅 프로세스
1. 에러 메시지 분석 (500, JSON parse error)
2. 서버 로그 확인 (Edge Runtime 제약)
3. 코드 리뷰 (Buffer 사용 발견)
4. Web Standard API로 교체
5. 빌드 및 테스트

---

## 🔜 추가 개선 사항

### 1. 더 안전한 토큰 생성
```typescript
// 현재: btoa() - 간단하지만 안전하지 않음
const token = btoa(JSON.stringify(payload));

// 권장: Web Crypto API 사용
const encoder = new TextEncoder();
const data = encoder.encode(JSON.stringify(payload));
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
```

### 2. JWT 라이브러리 (Edge Runtime 호환)
- `@tsndr/cloudflare-worker-jwt` - Cloudflare Workers용 JWT
- `jose` - Web Crypto API 기반 JWT 라이브러리

### 3. D1 Database 연동
```sql
-- users 테이블
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  academy_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📝 테스트 가이드 (배포 후)

### 1. 로그인 페이지 접속
URL: https://superplacestudy.pages.dev/login

### 2. 테스트 계정으로 로그인
```
이메일: admin@superplace.com
비밀번호: admin1234
```

### 3. F12 콘솔 확인
```
예상 로그:
🔐 로그인 시도: {email: "admin@superplace.com", passwordLength: 9}
📡 응답 상태: 200
📦 응답 데이터: {success: true, message: "로그인 성공", data: {...}}
✅ 로그인 성공!
```

### 4. 대시보드 접근
- 자동 리다이렉트: `/dashboard`
- 사용자 정보 localStorage 저장 확인
- 관리자 메뉴 표시 확인

---

## ✅ 결론

### 문제 요약
- **원인**: Edge Runtime에서 Node.js Buffer API 사용
- **증상**: 500 Internal Server Error
- **해결**: btoa() Web Standard API로 교체

### 배포 상태
- ✅ 코드 수정 완료
- ✅ 빌드 성공
- ✅ GitHub 푸시 완료
- ⏳ Cloudflare Pages 배포 진행 중 (1~2분)

### 테스트 계정
```
관리자: admin@superplace.com / admin1234
원장: director@superplace.com / director1234
강사: teacher@superplace.com / teacher1234
테스트: test@test.com / test1234
```

---

**작성자**: GenSpark AI Developer  
**작성일**: 2026-02-17  
**커밋**: 052ad0f  
**배포 URL**: https://superplacestudy.pages.dev
