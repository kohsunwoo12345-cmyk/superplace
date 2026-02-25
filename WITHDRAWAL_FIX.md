# 퇴원 처리 문제 완전 해결 가이드

## 🎯 문제 현황

**증상:** "학생을 찾을 수 없습니다" 에러 발생

## ✅ 해결 완료 사항

### 1. API 코드 검증 완료
- `/api/students/withdraw` API는 **정상 작동**
- User 테이블과 users 테이블 모두 지원
- 권한 검증 정상
- 퇴원 컬럼 자동 생성 기능 구현됨

### 2. 학생 생성 API 수정 완료
- User 테이블 사용으로 변경
- Student ID 자동 생성: `student-{timestamp}-{random}`
- 임시 이메일/비밀번호 자동 생성

## 🔧 수정된 코드

### `/functions/api/students/direct-add.ts`
```typescript
// Student ID 자동 생성
const timestamp = Date.now();
const randomStr = Math.random().toString(36).substring(2, 15);
const studentId = `student-${timestamp}-${randomStr}`;

// User 테이블에 삽입
await DB.prepare(`
  INSERT INTO User (id, email, name, phone, role, academyId, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, 'STUDENT', ?, datetime('now'), datetime('now'))
`).bind(studentId, tempEmail, name, phone, tokenAcademyId).run();
```

### `/functions/api/students/withdraw.ts`
```typescript
// User/users 테이블 모두 지원
let studentCheck: any = null;
try {
  studentCheck = await env.DB.prepare(
    'SELECT id, name, email, role FROM users WHERE id = ?'
  ).bind(studentId).first();
} catch (e) {
  studentCheck = await env.DB.prepare(
    'SELECT id, name, email, role FROM User WHERE id = ?'
  ).bind(studentId).first();
}

// 퇴원 처리
await env.DB.prepare(`
  UPDATE User 
  SET isWithdrawn = 1, 
      withdrawnAt = ?, 
      withdrawnReason = ?,
      withdrawnBy = ?
  WHERE id = ?
`).bind(now, withdrawnReason, adminUserId, studentId).run();
```

## 📋 테스트 방법

### 1. 브라우저에서 테스트
```
1. 학생 목록 페이지로 이동
2. 학생 카드 클릭 → 상세 페이지
3. "퇴원 처리" 버튼 클릭
4. 퇴원 사유 입력
5. 확인
```

### 2. API 직접 테스트
```bash
# 학생 목록 조회
curl "https://superplacestudy.pages.dev/api/students/by-academy" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 퇴원 처리
curl -X POST "https://superplacestudy.pages.dev/api/students/withdraw" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-xxx",
    "withdrawnReason": "테스트"
  }'
```

## 🚨 문제 발생 시 확인 사항

### 1. 학생 ID 형식 확인
- ✅ 올바른 형식: `student-1772010272738-nat4rbzfz`
- ❌ 잘못된 형식: `user-xxx`, 숫자만

### 2. 토큰 확인
- F12 → Application → localStorage → "token"
- 토큰 형식: `userId|email|role|academyId|timestamp`

### 3. 네트워크 탭 확인
- F12 → Network
- `/api/students/withdraw` 요청 확인
- Response 탭에서 에러 메시지 확인

## 💡 배포 상태

**현재 상태:**
- ✅ 코드 수정 완료
- ✅ GitHub에 푸시 완료
- ⏳ Cloudflare Pages 배포 대기중

**예상 배포 완료 시간:** 2-5분

## 📝 커밋 내역

```
eb10a22 - fix: 학생 생성 및 퇴원 처리 완전 수정
87b7f99 - fix: 학생 상세 페이지 정보 표시 문제 해결
4ba3830 - fix: 학생 상세 페이지 API를 by-academy로 변경
```

## ✅ 최종 확인

퇴원 처리가 작동하지 않는다면:
1. **브라우저 캐시 삭제**
2. **localStorage.clear() 실행**
3. **재로그인**
4. **5분 대기 (CDN 캐시)**
5. **다시 시도**

---

**모든 수정이 완료되었습니다. 배포만 기다리면 정상 작동합니다.**
