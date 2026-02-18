# 데이터베이스 복구 가이드

## 🚨 데이터 손실 상황

현재 Cloudflare D1 데이터베이스에서 모든 데이터(사용자, 봇, 클래스 등)가 사라진 상태입니다.

---

## ✅ 복구 방법

### 방법 1: Cloudflare Dashboard에서 직접 실행 (권장)

1. **Cloudflare Dashboard 접속**
   - https://dash.cloudflare.com/
   - Workers & Pages → D1 데이터베이스

2. **D1 데이터베이스 선택**
   - 데이터베이스 이름: `superplace-db`
   - Database ID: `8c106540-21b4-4fa9-8879-c4956e459ca1`

3. **Console 탭 열기**
   - 좌측 메뉴에서 **Console** 클릭

4. **복구 스크립트 실행**
   - `database_recovery.sql` 파일의 내용을 복사
   - Console에 붙여넣기
   - **Execute** 버튼 클릭

---

### 방법 2: Wrangler CLI 사용 (로컬)

**전제조건**: Cloudflare API 토큰 필요

```bash
# 1. API 토큰 설정
export CLOUDFLARE_API_TOKEN="your_cloudflare_api_token"

# 2. 데이터베이스 복구 실행
cd /home/user/webapp
wrangler d1 execute superplace-db --remote --file=./database_recovery.sql

# 3. 확인
wrangler d1 execute superplace-db --remote --command="SELECT COUNT(*) as user_count FROM users;"
wrangler d1 execute superplace-db --remote --command="SELECT COUNT(*) as bot_count FROM ai_bots;"
```

---

### 방법 3: 각 스키마 파일 개별 실행

스크립트가 너무 크면 개별적으로 실행:

```bash
# Core tables
wrangler d1 execute superplace-db --remote --file=./migrations/0001_complete_schema.sql

# Admin user
wrangler d1 execute superplace-db --remote --file=./migrations/0002_admin_user.sql

# Attendance & Homework
wrangler d1 execute superplace-db --remote --file=./migrations/002_attendance_homework_system.sql

# AI Bots
wrangler d1 execute superplace-db --remote --file=./db_schema_bot_assignments.sql
wrangler d1 execute superplace-db --remote --file=./db_schema_chat.sql

# SMS
wrangler d1 execute superplace-db --remote --file=./sms_schema.sql

# Notifications
wrangler d1 execute superplace-db --remote --file=./migrations/notifications_tables.sql
```

---

## 📋 복구 후 확인 사항

### 1. 관리자 계정 로그인
- URL: https://superplacestudy.pages.dev/login
- Email: `admin@superplace.co.kr`
- Password: `admin123456`

### 2. 확인할 항목
- ✅ 사용자 목록 (`/dashboard/admin/users`)
- ✅ AI 봇 목록 (`/dashboard/admin/ai-bots`)
- ✅ 학원 정보 (`/dashboard/admin/academies`)
- ✅ 클래스 목록 (`/dashboard/classes`)

---

## 🔍 문제 원인 분석

### 가능한 원인

1. **데이터베이스 ID 변경**
   - `wrangler.toml`의 database_id가 다른 DB를 가리킴
   - 현재: `8c106540-21b4-4fa9-8879-c4956e459ca1`

2. **Cloudflare Pages 환경 변수**
   - D1 바인딩이 잘못 설정됨
   - Production vs Preview 환경 차이

3. **마이그레이션 미실행**
   - 새 데이터베이스가 생성되었지만 스키마 미적용

---

## 🔧 향후 예방책

### 1. 정기 백업 설정

Cloudflare D1은 자동 백업을 제공하지 않으므로, 정기적으로 데이터 내보내기:

```bash
# 모든 테이블 데이터 백업
wrangler d1 export superplace-db --remote --output=backup_$(date +%Y%m%d).sql
```

### 2. 환경별 데이터베이스 분리

```toml
# Production
[[env.production.d1_databases]]
binding = "DB"
database_name = "superplace-db-prod"
database_id = "prod-database-id"

# Preview
[[env.preview.d1_databases]]
binding = "DB"
database_name = "superplace-db-preview"
database_id = "preview-database-id"
```

### 3. 마이그레이션 자동화

```json
// package.json
{
  "scripts": {
    "db:migrate": "wrangler d1 execute superplace-db --remote --file=./database_recovery.sql",
    "db:backup": "wrangler d1 export superplace-db --remote --output=backup_$(date +%Y%m%d).sql"
  }
}
```

---

## 📞 추가 지원

복구 후에도 문제가 지속되면:

1. **Cloudflare Dashboard 확인**
   - D1 데이터베이스 → Query 탭
   - 실제 테이블 존재 여부 확인

2. **Environment Variables 확인**
   - Pages → Settings → Environment variables
   - D1 바인딩이 올바른지 확인

3. **빌드 로그 확인**
   - Functions가 올바른 DB에 연결되는지 확인

---

## ✅ 복구 완료 체크리스트

- [ ] `database_recovery.sql` 실행 완료
- [ ] 관리자 계정 로그인 성공
- [ ] 사용자 목록 확인
- [ ] AI 봇 목록 확인
- [ ] 학원 정보 확인
- [ ] SMS 기능 정상 작동
- [ ] 출석/숙제 시스템 정상 작동

복구 완료 후 이 체크리스트를 모두 확인하세요!
