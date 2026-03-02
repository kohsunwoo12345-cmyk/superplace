// IP 로그 추적 시스템 구현 계획

## 1. login_logs 테이블 생성

CREATE TABLE IF NOT EXISTS login_logs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  loginAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  location TEXT,
  deviceType TEXT,
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX idx_login_logs_userId ON login_logs(userId);
CREATE INDEX idx_login_logs_loginAt ON login_logs(loginAt);

## 2. 로그인 API 수정
- functions/api/auth/login.ts (또는 login.js)
- 로그인 성공 시 IP 주소 기록
- request.headers.get('CF-Connecting-IP') 사용 (Cloudflare)
- 또는 X-Forwarded-For 헤더 사용

## 3. IP 정보 조회
- functions/api/admin/academies.ts에 IP 조회 로직 추가
- 최근 로그인 10건 표시
- IP 주소, 로그인 시간, 디바이스 정보

## 4. 프론트엔드 표시
- 학원 상세 페이지에 "로그인 기록" 탭 추가
- IP 주소, 시간, 위치(옵션), 디바이스 표시
