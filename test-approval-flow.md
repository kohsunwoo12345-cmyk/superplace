# 관리자 승인 시스템 테스트 가이드

## 🎯 구현된 기능

관리자가 승인해야만 회원가입이 완료되는 시스템이 구현되었습니다.

## 🔄 승인 프로세스

1. **회원가입** → `approved: false` (승인 대기)
2. **로그인 시도** → "관리자 승인 대기 중입니다" 에러
3. **관리자 승인** → `approved: true` 변경
4. **로그인 가능** → 서비스 이용 가능

## 🧪 테스트 방법

### 1단계: 새 사용자 회원가입

1. 웹사이트 접속: https://3000-i9j6yk3jh6bv6fx7v3pje-2e77fc33.sandbox.novita.ai
2. "회원가입" 클릭
3. 정보 입력 후 가입
4. "관리자 승인 후 로그인하실 수 있습니다" 메시지 확인

### 2단계: 로그인 시도 (실패 확인)

1. 가입한 이메일/비밀번호로 로그인 시도
2. "관리자 승인 대기 중입니다" 에러 메시지 확인
3. 로그인 차단 확인

### 3단계: 관리자 승인

1. 관리자 계정으로 로그인:
   - 이메일: `admin@example.com` 또는 `test@example.com`
   - 비밀번호: 기존 설정된 비밀번호
   
2. 관리자 대시보드 접속

3. **"승인 대기 중인 회원"** 섹션 확인:
   - 오렌지색 강조 카드
   - 대기 중인 회원 목록 표시
   - 회원 정보 (이름, 이메일, 회사, 전화번호, 가입일)

4. "승인하기" 버튼 클릭

5. "승인 완료" Toast 알림 확인

### 4단계: 승인된 사용자 로그인

1. 승인된 사용자 계정으로 다시 로그인
2. 로그인 성공 확인
3. 대시보드 접근 가능 확인

## 📊 데이터베이스 구조

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String
  role          String    @default("USER")
  
  // 승인 관련 필드
  approved      Boolean   @default(false)  // 승인 여부
  approvedBy    String?                     // 승인한 관리자 ID
  approvedAt    DateTime?                   // 승인 시각
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

## 🔌 API 엔드포인트

### GET /api/admin/users/pending
승인 대기 중인 사용자 목록 조회

**권한**: ADMIN, SUPERADMIN

**응답**:
```json
{
  "users": [
    {
      "id": "...",
      "email": "user@example.com",
      "name": "홍길동",
      "phone": "010-1234-5678",
      "company": "ABC Corp",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/admin/users/approve
사용자 승인 처리

**권한**: ADMIN, SUPERADMIN

**요청**:
```json
{
  "userId": "user_id_here"
}
```

**응답**:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "user@example.com",
    "approved": true,
    "approvedBy": "admin_id",
    "approvedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🎨 UI 특징

### 승인 대기 섹션 (관리자 페이지)
- **위치**: 관리자 대시보드 상단 (통계 카드 아래)
- **디자인**: 오렌지색 강조 카드 (`border-orange-200 bg-orange-50`)
- **아이콘**: ⏰ Clock 아이콘
- **표시 정보**:
  - 대기 인원 수
  - 각 회원의 이름, 이메일, 회사, 전화번호, 가입일
  - "승인 대기" 배지
- **액션**: 
  - "승인하기" 버튼 (녹색)
  - 승인 처리 중 로딩 스피너
  - 승인 완료 Toast 알림

### 회원가입 완료 메시지
```
회원가입 신청이 완료되었습니다. 
관리자 승인 후 로그인하실 수 있습니다.
```

### 로그인 차단 메시지
```
관리자 승인 대기 중입니다. 
승인 후 로그인하실 수 있습니다.
```

## 🔒 보안 고려사항

1. **권한 체크**: ADMIN, SUPERADMIN만 승인 API 접근 가능
2. **인증 체크**: NextAuth 세션 기반 인증
3. **승인 이력**: 누가 언제 승인했는지 추적 가능
4. **로그인 차단**: 미승인 사용자는 로그인 불가

## ✅ 구현 완료 항목

- [x] Database schema에 승인 필드 추가
- [x] 회원가입 시 approved=false로 설정
- [x] 로그인 시 승인 여부 체크
- [x] 승인 대기 사용자 목록 API
- [x] 사용자 승인 API
- [x] 관리자 페이지 승인 UI
- [x] Toast 알림 시스템
- [x] 승인 이력 추적
- [x] 기존 관리자 계정 승인 처리

## 📝 Pull Request

**PR 링크**: https://github.com/kohsunwoo12345-cmyk/superplace/pull/1

**브랜치**: `genspark_ai_developer` → `main`

**변경 파일**:
- `prisma/schema.prisma` - User 모델에 승인 필드 추가
- `src/app/api/register/route.ts` - 회원가입 시 approved=false 설정
- `src/lib/auth.ts` - 로그인 시 승인 체크
- `src/app/api/admin/users/pending/route.ts` - 대기 목록 API (신규)
- `src/app/api/admin/users/approve/route.ts` - 승인 처리 API (신규)
- `src/app/dashboard/admin/page.tsx` - 승인 UI 추가

## 🚀 현재 서버 상태

- **서버 URL**: https://3000-i9j6yk3jh6bv6fx7v3pje-2e77fc33.sandbox.novita.ai
- **상태**: ✅ 실행 중
- **브랜치**: genspark_ai_developer
- **데이터베이스**: ✅ 마이그레이션 완료
- **기존 관리자**: ✅ 승인 처리 완료

## 📞 문의 사항

추가 기능이나 수정이 필요하시면 말씀해주세요!
