# 관리자 역할 수정 가이드

## 🎯 문제 확인

현재 로그인한 계정의 역할: **TEACHER**
- 관리자 메뉴를 보려면: **ADMIN** 또는 **SUPER_ADMIN** 필요

```javascript
// 브라우저 콘솔 로그
🔍 User Role: TEACHER  ← 문제!
🎯 Is Admin? false
📋 Total menu items: 7
```

---

## 🔧 해결 방법

### 방법 1: 데이터베이스에서 역할 변경 (영구적) ⭐ 권장

#### Cloudflare D1 데이터베이스에서 실행:

1. **Cloudflare Dashboard** 접속
   - https://dash.cloudflare.com

2. **Workers & Pages** → **D1** 선택

3. **superplace-db** 데이터베이스 선택

4. **Console** 탭에서 SQL 실행:

```sql
-- 현재 사용자 확인
SELECT id, email, name, role FROM users WHERE email = 'admin@superplace.co.kr';

-- 역할을 ADMIN으로 변경
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@superplace.co.kr';

-- 변경 확인
SELECT id, email, name, role FROM users WHERE email = 'admin@superplace.co.kr';
```

5. **로그아웃 후 다시 로그인**
   - localStorage가 업데이트되도록 재로그인 필요

---

### 방법 2: 브라우저에서 임시 변경 (임시적)

#### 브라우저 콘솔(F12)에서 실행:

```javascript
// 1. 현재 사용자 정보 확인
const user = JSON.parse(localStorage.getItem('user'));
console.log('현재 Role:', user.role);

// 2. 역할을 ADMIN으로 변경
user.role = 'ADMIN';
localStorage.setItem('user', JSON.stringify(user));

// 3. 페이지 새로고침
location.reload();
```

**주의**: 
- 이 방법은 **임시적**이며, 로그아웃하면 다시 원래 역할로 돌아갑니다
- 영구적으로 변경하려면 방법 1 (데이터베이스 수정) 필요

---

### 방법 3: 새 관리자 계정 생성

```sql
-- 새 관리자 계정 생성
INSERT INTO users (email, password, name, role, phone)
VALUES (
  'admin@superplace.co.kr',
  'admin123',  -- 실제 비밀번호로 변경
  '슈퍼 관리자',
  'ADMIN',
  '010-1234-5678'
);
```

---

## 📊 역할별 메뉴 개수

| 역할 | 메뉴 개수 | 설명 |
|------|----------|------|
| **ADMIN** / **SUPER_ADMIN** | 19개 | 관리자 전용 10개 + 일반 9개 |
| **DIRECTOR** (원장) | 8개 | 학원 관리 메뉴 |
| **TEACHER** (선생님) | 7개 | 수업 및 학생 관리 |
| **STUDENT** (학생) | 7개 | 학습 관련 메뉴 |

---

## ✅ 역할 변경 후 확인

변경 후 다시 로그인하면 다음과 같이 표시되어야 합니다:

```javascript
🔍 User Role: ADMIN          ← 변경됨!
🎯 Is Admin? true            ← 관리자 확인
✅ Loading ADMIN menu        ← 관리자 메뉴 로드
📋 Total menu items: 19      ← 19개 메뉴
```

**관리자 메뉴 (19개)**:
1. 대시보드
2. 사용자 관리 ⭐
3. 학원 관리 ⭐
4. 알림 관리 ⭐
5. 매출 관리 ⭐
6. 요금제 관리 ⭐
7. 교육 세미나 ⭐
8. 상세 기록 ⭐
9. AI 봇 관리 ⭐
10. 문의 관리 ⭐
11. 시스템 설정 ⭐
12. 학생 관리
13. 선생님 관리
14. 수업 관리
15. 출석 관리
16. AI 챗봇
17. Gemini 채팅
18. 통계 분석
19. 설정

---

## 🎯 권장 순서

1. **데이터베이스에서 역할 변경** (방법 1)
2. **로그아웃**
3. **다시 로그인**
4. **관리자 메뉴 19개 확인** ✅

---

**작성**: 2026-02-06  
**문제**: User Role = TEACHER (관리자 아님)  
**해결**: DB에서 role을 ADMIN으로 변경 필요
