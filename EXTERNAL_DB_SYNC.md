# 🔄 데이터베이스 실시간 동기화 시스템

## 📋 개요

이 시스템은 **Cloudflare를 통해 외부 데이터베이스와 실시간 동기화**를 제공합니다.  
여러 웹사이트가 **동일한 학생, 선생님, 반 데이터를 공유**하여, 한 곳에서 데이터를 추가/수정/삭제하면 **모든 웹사이트에 즉시 반영**됩니다.

---

## 🎯 동기화 대상

### 1. **학생 (Students)**
- 이름, 이메일, 학년, 학번
- 연락처, 학부모 연락처
- 승인 상태

### 2. **선생님 (Teachers)**
- 이름, 이메일
- 연락처
- 담당 과목 (추후 구현)

### 3. **반 (Classes)** - 추후 구현
- 반 이름, 학년
- 담당 선생님
- 소속 학생

---

## 🔧 설정 방법

### 1. Vercel 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 추가하세요:

```bash
EXTERNAL_DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

**⚠️ 중요:**
- 이 URL은 **Cloudflare를 통해 공유되는 외부 데이터베이스**입니다
- **같은 학원 그룹의 모든 웹사이트가 동일한 URL을 사용**합니다
- Vercel에서만 설정하고, Git에는 커밋하지 마세요

### 2. 환경 변수 적용

1. Vercel 프로젝트 → Settings → Environment Variables
2. `EXTERNAL_DATABASE_URL` 추가
3. Production, Preview, Development 모두 체크
4. Save
5. 재배포 (Redeploy)

### 3. 연결 확인

API를 호출하여 연결 상태를 확인:

```bash
curl -X GET https://your-domain.vercel.app/api/sync/status \
  -H "Cookie: your-session-cookie"
```

**응답 예시:**
```json
{
  "success": true,
  "sync": {
    "enabled": true,
    "connected": true,
    "externalDB": "설정됨"
  },
  "stats": {
    "externalStudentCount": 42,
    "externalTeacherCount": 5,
    "lastChecked": "2024-01-15T10:30:00Z"
  },
  "message": "외부 DB와 연결되어 실시간 동기화가 활성화되었습니다."
}
```

---

## 📡 API 엔드포인트

### 1. 학생 관리

#### 학생 생성 (자동 동기화)
```http
POST /api/sync/students
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "student@example.com",
  "name": "홍길동",
  "password": "password123",
  "grade": "고등학교 1학년",
  "studentId": "2024001",
  "phone": "010-1234-5678",
  "parentPhone": "010-8765-4321",
  "academyId": "academy_id" // SUPER_ADMIN만 필요
}
```

**응답:**
```json
{
  "success": true,
  "student": {
    "id": "local_id",
    "email": "student@example.com",
    "name": "홍길동",
    "grade": "고등학교 1학년",
    "approved": true
  },
  "sync": {
    "local": "local_id",
    "external": "external_id",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### 학생 목록 조회
```http
GET /api/sync/students
Authorization: Bearer <token>
```

**응답:**
```json
{
  "success": true,
  "students": [
    {
      "id": "student_id",
      "email": "student@example.com",
      "name": "홍길동",
      "grade": "고등학교 1학년",
      "approved": true
    }
  ],
  "count": 1
}
```

#### 학생 수정 (자동 동기화)
```http
PATCH /api/sync/students/[id]
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "홍길동",
  "grade": "고등학교 2학년",
  "phone": "010-1111-2222"
}
```

#### 학생 삭제 (자동 동기화)
```http
DELETE /api/sync/students/[id]
Authorization: Bearer <token>
```

**응답:**
```json
{
  "success": true,
  "message": "학생이 삭제되었습니다",
  "sync": {
    "local": "local_id",
    "external": "external_id",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

### 2. 선생님 관리

#### 선생님 생성 (자동 동기화)
```http
POST /api/sync/teachers
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "teacher@example.com",
  "name": "김선생",
  "password": "password123",
  "phone": "010-9999-8888",
  "academyId": "academy_id" // SUPER_ADMIN만 필요
}
```

#### 선생님 목록 조회
```http
GET /api/sync/teachers
Authorization: Bearer <token>
```

---

### 3. 동기화 상태 확인

```http
GET /api/sync/status
Authorization: Bearer <token>
```

**응답:**
```json
{
  "success": true,
  "sync": {
    "enabled": true,
    "connected": true,
    "externalDB": "설정됨"
  },
  "stats": {
    "externalStudentCount": 42,
    "externalTeacherCount": 5,
    "lastChecked": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🔄 동기화 동작 원리

### 1. 데이터 생성 플로우

```
웹사이트 A에서 학생 추가
    ↓
1. 로컬 DB에 학생 생성
    ↓
2. 외부 DB에 동일 데이터 생성
    ↓
3. 웹사이트 B에서 조회 시 외부 DB의 데이터 표시
    ↓
✅ 모든 웹사이트에서 동일한 학생 데이터 공유
```

### 2. 데이터 수정 플로우

```
웹사이트 A에서 학생 정보 수정
    ↓
1. 로컬 DB 업데이트
    ↓
2. 이메일 기준으로 외부 DB의 동일 학생 찾기
    ↓
3. 외부 DB 업데이트
    ↓
✅ 웹사이트 B에서도 수정된 정보 표시
```

### 3. 데이터 삭제 플로우

```
웹사이트 A에서 학생 삭제
    ↓
1. 로컬 DB에서 학생 삭제
    ↓
2. 이메일 기준으로 외부 DB의 동일 학생 삭제
    ↓
✅ 웹사이트 B에서도 해당 학생 사라짐
```

---

## 🔑 동기화 키

**이메일(email)**을 고유 식별자로 사용합니다.

- 로컬 DB의 ID ≠ 외부 DB의 ID
- 이메일이 같으면 동일한 사용자로 간주
- 이메일 중복 불가

---

## 🛡️ 보안 및 권한

### 권한 체계

| 역할 | 학생 추가 | 학생 수정 | 학생 삭제 | 다른 학원 데이터 접근 |
|------|----------|----------|----------|---------------------|
| **SUPER_ADMIN** | ✅ | ✅ | ✅ | ✅ |
| **DIRECTOR** | ✅ | ✅ (자기 학원만) | ✅ (자기 학원만) | ❌ |
| **TEACHER** | ❌ | ❌ | ❌ | ❌ |
| **STUDENT** | ❌ | ❌ | ❌ | ❌ |

### 보안 규칙

1. **인증 필수:** 모든 API는 로그인 필요
2. **학원 격리:** DIRECTOR는 자기 학원 데이터만 접근
3. **비밀번호 암호화:** bcrypt 해시 사용
4. **동일 비밀번호:** 모든 웹사이트에서 같은 계정/비밀번호 사용

---

## 📝 동기화 로그

모든 동기화 작업은 로그로 기록됩니다:

```typescript
{
  success: true,
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  entity: 'STUDENT' | 'TEACHER' | 'CLASS',
  localId: 'local_db_id',
  externalId: 'external_db_id',
  timestamp: '2024-01-15T10:30:00Z',
  error: null // 실패 시 에러 메시지
}
```

콘솔에서 확인:
```
✅ 외부 DB 연결 성공
📝 동기화 로그: STUDENT CREATE
  success: true
  localId: cm5abc123
  externalId: cm5xyz789
  timestamp: 2024-01-15T10:30:00Z
```

---

## 🧪 테스트 방법

### 1. 로컬 테스트 (외부 DB 없이)

환경 변수를 설정하지 않으면 **로컬 DB만 사용**:

```bash
# .env에 EXTERNAL_DATABASE_URL 없음
npm run dev
```

API 호출 시:
- 로컬 DB에만 저장
- 외부 동기화는 건너뜀
- 정상 작동

### 2. 외부 DB 연결 테스트

```bash
# 1. Vercel에 EXTERNAL_DATABASE_URL 설정
# 2. 재배포
# 3. 상태 확인
curl https://your-domain.vercel.app/api/sync/status

# 4. 학생 추가 테스트
curl -X POST https://your-domain.vercel.app/api/sync/students \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "email": "test@example.com",
    "name": "테스트 학생",
    "password": "test1234",
    "grade": "고1"
  }'

# 5. 다른 웹사이트에서 확인
# 동일한 이메일의 학생이 표시되어야 함
```

---

## ⚠️ 주의사항

### 1. 환경 변수 관리
- ❌ `.env` 파일을 Git에 커밋하지 마세요
- ✅ Vercel 환경 변수에서만 설정
- ✅ `.env.example`은 예시만 포함

### 2. 데이터 충돌
- 같은 이메일로 여러 웹사이트에서 동시에 생성 시 충돌 가능
- 이메일 중복 확인 로직으로 방지

### 3. 비밀번호 동기화
- 모든 웹사이트에서 같은 비밀번호 사용
- 한 곳에서 비밀번호 변경 시 다른 곳에서도 변경됨

### 4. 삭제 주의
- 한 웹사이트에서 삭제 → 모든 웹사이트에서 삭제
- 복구 불가능

---

## 🚀 다음 단계

### 구현 완료
- [x] 외부 DB 연결 시스템
- [x] 학생 CRUD 동기화
- [x] 선생님 CRUD 동기화
- [x] 동기화 상태 확인 API
- [x] 로그 시스템

### 추후 구현
- [ ] 반(Class) 동기화
- [ ] 과제 동기화
- [ ] 출석 동기화
- [ ] Webhook 실시간 알림
- [ ] 동기화 충돌 해결
- [ ] 동기화 이력 대시보드

---

## 📊 파일 구조

```
src/
├── lib/
│   ├── external-db.ts          # 외부 DB 연결 클라이언트
│   ├── sync-utils.ts            # 동기화 유틸리티
│   └── prisma.ts                # 로컬 DB 클라이언트
├── app/api/sync/
│   ├── students/
│   │   ├── route.ts             # POST (생성), GET (목록)
│   │   └── [id]/route.ts        # PATCH (수정), DELETE (삭제)
│   ├── teachers/
│   │   ├── route.ts             # POST, GET
│   │   └── [id]/route.ts        # PATCH, DELETE
│   └── status/
│       └── route.ts             # GET (동기화 상태)
```

---

## 🎉 완료!

이제 여러 웹사이트가 **하나의 데이터베이스를 공유**하여:
- ✅ 학생 추가 → 모든 웹사이트에 즉시 반영
- ✅ 학생 수정 → 모든 웹사이트에서 업데이트
- ✅ 학생 삭제 → 모든 웹사이트에서 삭제
- ✅ 동일한 계정으로 모든 웹사이트 로그인

**Vercel에 `EXTERNAL_DATABASE_URL`만 설정하면 자동으로 작동합니다!** 🚀
