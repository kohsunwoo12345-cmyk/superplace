# 보안 관련 자주 묻는 질문 (Security FAQ)

## 비밀번호 관련

### Q: 사용자 상세 페이지에서 왜 실제 비밀번호가 표시되지 않나요?

**A: 보안상의 이유로 원본 비밀번호는 표시할 수 없습니다.**

#### 기술적 설명:

1. **단방향 해시 함수 사용**
   - 모든 비밀번호는 SHA-256 해시 알고리즘으로 암호화되어 저장됩니다
   - SHA-256은 **단방향(one-way)** 함수입니다
   - 원본 비밀번호 → 해시값 변환은 가능하지만
   - 해시값 → 원본 비밀번호 복원은 **수학적으로 불가능**합니다

2. **예시**
   ```
   원본 비밀번호: "mypassword123"
   SHA-256 해시: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
   ```
   - 위 해시값에서 "mypassword123"을 알아낼 수 없습니다
   - 이것이 단방향 암호화의 핵심 원리입니다

3. **로그인 검증 방식**
   - 사용자가 로그인 시 입력한 비밀번호를 SHA-256으로 해시화
   - 데이터베이스에 저장된 해시값과 비교
   - 두 해시값이 일치하면 로그인 성공

#### 관리자가 할 수 있는 것:

✅ **비밀번호 재설정** (Reset Password)
- 새로운 비밀번호로 변경 가능
- 변경 시 새 비밀번호가 다시 해시화되어 저장됨

❌ **불가능한 것**
- 원본 비밀번호 확인
- 비밀번호 "복호화"
- 해시값에서 원본 추출

### Q: 사용자가 비밀번호를 잊어버렸다면?

**A: 다음 두 가지 방법이 있습니다:**

1. **관리자 직접 재설정**
   - 사용자 상세 페이지 → 보안 탭
   - "새 비밀번호" 입력 후 "비밀번호 재설정" 클릭
   - 새 비밀번호를 사용자에게 안전하게 전달

2. **비밀번호 찾기 기능 구현** (향후 추가 예정)
   - 이메일/SMS 인증을 통한 자동 재설정
   - 임시 비밀번호 발급

### Q: 해시값이 너무 길어서 보기 불편한데요?

**A: 이것은 정상입니다.**

- SHA-256 해시는 항상 64자의 16진수 문자열입니다
- 짧은 비밀번호도, 긴 비밀번호도 동일하게 64자로 변환됩니다
- 예시:
  ```
  "123" → "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
  "verylongpassword123456" → "3c9909afec25354d551dae21590bb26e38d53f2173b8d3dc3eee4c047e7ab1c1"
  ```

## 로그인 기록 추적

### Q: 사용자의 IP 주소는 어떻게 추적되나요?

**A: Cloudflare가 제공하는 헤더를 사용합니다.**

```javascript
// 로그인 API에서 IP 추출
const clientIP = request.headers.get('CF-Connecting-IP') || 
                 request.headers.get('X-Forwarded-For')?.split(',')[0] || 
                 'unknown';
```

- `CF-Connecting-IP`: Cloudflare가 제공하는 실제 클라이언트 IP
- `X-Forwarded-For`: 프록시를 거친 경우 원본 IP
- 모든 로그인 시도가 `login_logs` 테이블에 기록됩니다

### Q: 활동 기록은 어디에 저장되나요?

**A: `activity_logs` 테이블에 저장됩니다.**

기록되는 정보:
- 사용자 ID
- 수행한 작업 (action)
- 작업 상세 내용 (details)
- IP 주소
- 생성 시간

## 데이터베이스 스키마

### login_logs 테이블
```sql
CREATE TABLE login_logs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  loginAt TEXT NOT NULL,
  success INTEGER DEFAULT 1,
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

### activity_logs 테이블
```sql
CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  ipAddress TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

### User 테이블 (관련 컬럼)
```sql
ALTER TABLE User ADD COLUMN lastLoginAt TEXT;
ALTER TABLE User ADD COLUMN lastLoginIP TEXT;
```

## 보안 모범 사례

### ✅ 현재 구현된 보안 기능

1. **비밀번호 암호화**
   - SHA-256 단방향 해시
   - Salt 사용: `superplace-salt-2024`

2. **로그인 추적**
   - IP 주소 기록
   - User-Agent 기록
   - 성공/실패 여부 기록
   - 마지막 로그인 시간 업데이트

3. **활동 로그**
   - 주요 작업 기록
   - IP 주소 추적
   - 타임스탬프

### 🔧 향후 개선 계획

1. **bcrypt 도입**
   - SHA-256보다 더 강력한 암호화
   - 자동 salt 생성
   - 계산 비용 조절 가능

2. **비밀번호 정책**
   - 최소 길이 강제
   - 복잡도 요구사항
   - 주기적 변경 권장

3. **이중 인증 (2FA)**
   - SMS 인증
   - 이메일 인증
   - TOTP (Google Authenticator)

4. **세션 관리**
   - JWT 토큰 사용
   - 자동 로그아웃
   - 동시 로그인 제한

## 문의사항

보안 관련 추가 문의사항이 있으시면 시스템 관리자에게 문의해주세요.

---

**마지막 업데이트:** 2026-02-19  
**버전:** 1.0
