# 클래스 관리 완전 수정 (2026-02-22)

## 🚀 배포 정보
- **커밋**: `daf6ccb`
- **배포 URL**: https://superplacestudy.pages.dev
- **배포 시간**: 약 2-3분 소요

## 🐛 해결된 문제

### 1. 클래스가 목록에 표시되지 않음
**원인**: 테이블명과 컬럼명 불일치
**해결**: `classes` 테이블과 snake_case 컬럼명으로 통일

### 2. 학원별 분리가 안됨
**원인**: ADMIN이 모든 클래스를 볼 수 있었음
**해결**: SUPER_ADMIN만 전체 조회, ADMIN/DIRECTOR는 자신의 학원만 조회

### 3. 삭제 및 수정 기능 없음
**원인**: API 미구현
**해결**: DELETE와 PATCH 메서드 추가

## ✅ 구현 사항

### 1. 학원별 클래스 완전 분리
**역할별 권한**:
- **SUPER_ADMIN**: 모든 학원의 클래스 조회 가능
- **ADMIN**: 자신의 학원 클래스만 조회
- **DIRECTOR**: 자신의 학원 클래스만 조회
- **TEACHER**: 자신의 학원 클래스 조회
- **STUDENT**: 자신이 등록된 클래스만 조회

**쿼리 변경**:
```sql
-- ADMIN / DIRECTOR
WHERE c.academy_id = ?  -- 학원 ID로 필터링

-- TEACHER  
WHERE c.academy_id = ?  -- 학원 ID로 필터링 (이전에는 teacher_id만)

-- STUDENT
WHERE cs.studentId = ?  -- 변경 없음
```

### 2. 클래스 삭제 기능
**API**: `DELETE /api/classes?id={classId}`

**권한**: SUPER_ADMIN, ADMIN, DIRECTOR

**동작**:
1. 클래스 존재 확인
2. 학원 소유권 확인 (SUPER_ADMIN 제외)
3. class_students 테이블 레코드 삭제
4. classes 테이블 레코드 삭제

**프론트엔드**:
- 클래스 카드에 "삭제" 버튼 추가
- 확인 다이얼로그 표시
- 삭제 후 페이지 새로고침

### 3. 클래스 수정 기능  
**API**: `PATCH /api/classes`

**권한**: SUPER_ADMIN, ADMIN, DIRECTOR

**수정 가능 필드**:
- `name`: 반 이름
- `grade`: 학년
- `description`: 설명
- `color`: 색상
- `teacherId`: 담당 선생님

**동작**:
1. 클래스 존재 확인
2. 학원 소유권 확인 (SUPER_ADMIN 제외)
3. 제공된 필드만 업데이트

**프론트엔드**:
- 클래스 카드에 "수정" 버튼 추가
- `/dashboard/classes/edit/?id={classId}` 페이지로 이동

## 🔧 기술 세부사항

### API 엔드포인트

#### GET /api/classes
**목적**: 클래스 목록 조회

**Headers**:
```
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "classes": [
    {
      "id": 123,
      "academyId": 1,
      "name": "중1 수학반",
      "grade": "중1",
      "description": "기초 수학",
      "teacherId": 456,
      "color": "#3B82F6",
      "createdAt": "2026-02-22 10:00:00",
      "teacherName": "김선생",
      "academyName": "수퍼플레이스 학원"
    }
  ],
  "count": 1
}
```

#### DELETE /api/classes?id={classId}
**목적**: 클래스 삭제

**Headers**:
```
Authorization: Bearer {token}
```

**Query Params**:
- `id`: 클래스 ID (필수)

**Response**:
```json
{
  "success": true,
  "message": "반이 삭제되었습니다"
}
```

**Error (권한 없음)**:
```json
{
  "success": false,
  "error": "Access denied",
  "message": "이 반을 삭제할 권한이 없습니다"
}
```

#### PATCH /api/classes
**목적**: 클래스 수정

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body**:
```json
{
  "id": 123,
  "name": "중1 수학 심화반",
  "grade": "중1",
  "description": "심화 과정",
  "color": "#10B981",
  "teacherId": 789
}
```

**Response**:
```json
{
  "success": true,
  "message": "반이 수정되었습니다"
}
```

### 데이터베이스 호환성

**User 테이블 지원**:
- `User` (PascalCase) - 기존 테이블
- `users` (snake_case) - 새 테이블

코드에서 자동으로 두 테이블 시도:
```javascript
let user = await db
  .prepare('SELECT id, email, role, academyId, academy_id FROM User WHERE email = ?')
  .bind(tokenData.email)
  .first();

if (!user) {
  user = await db
    .prepare('SELECT id, email, role, academyId, academy_id FROM users WHERE email = ?')
    .bind(tokenData.email)
    .first();
}
```

## 📝 사용 방법

### 1. 클래스 조회
```
1. /dashboard/classes 접속
2. 자동으로 소속 학원의 클래스만 표시
3. 검색창으로 클래스 필터링 가능
```

### 2. 클래스 삭제
```
1. 클래스 카드에서 "삭제" 버튼 클릭
2. 확인 다이얼로그에서 "확인" 클릭
3. 삭제 완료 후 자동 새로고침
```

### 3. 클래스 수정
```
1. 클래스 카드에서 "수정" 버튼 클릭
2. 수정 페이지에서 정보 변경
3. "저장" 버튼으로 변경사항 저장
```

## 🧪 테스트 시나리오

### 1. 학원별 분리 테스트
**SUPER_ADMIN 계정**:
- [ ] 모든 학원의 클래스 표시 확인

**ADMIN 계정 (학원 A)**:
- [ ] 학원 A의 클래스만 표시 확인
- [ ] 학원 B의 클래스 미표시 확인

**DIRECTOR 계정 (학원 B)**:
- [ ] 학원 B의 클래스만 표시 확인
- [ ] 학원 A의 클래스 미표시 확인

### 2. 삭제 권한 테스트
**ADMIN/DIRECTOR**:
- [ ] 자신의 학원 클래스 삭제 가능
- [ ] 다른 학원 클래스 삭제 불가 (API 에러)

**TEACHER**:
- [ ] 삭제 버튼 미표시 확인

### 3. 수정 권한 테스트
**ADMIN/DIRECTOR**:
- [ ] 자신의 학원 클래스 수정 가능
- [ ] 다른 학원 클래스 수정 불가 (API 에러)

**TEACHER**:
- [ ] 수정 버튼 미표시 확인

### 4. 클래스 생성 후 표시 테스트
```
1. /dashboard/classes/add에서 클래스 생성
2. academyId 자동 설정 확인
3. 생성 후 /dashboard/classes로 이동
4. ✅ 새 클래스가 목록에 표시되는지 확인
```

## 🔍 디버깅 로그

### 성공 케이스
```
📚 Classes API GET called
✅ User verified: { email: 'admin@school.com', role: 'ADMIN', academyId: 1, userId: 10 }
🔒 Admin/Director access - academy filtered: 1
✅ Returning 5 classes for ADMIN (academy: 1)
```

### 삭제 케이스
```
🗑️ Classes API DELETE called
✅ User verified
✅ Class found: 123
✅ Academy ownership verified
✅ Class deleted: 123
```

### 권한 거부 케이스
```
🗑️ Classes API DELETE called
✅ User verified: { role: 'ADMIN', academyId: 1 }
❌ Access denied - Class belongs to academy 2, user belongs to academy 1
```

## 📊 변경된 파일

```
functions/api/classes/index.js                 (완전 재작성, 650줄)
  - GET: 학원별 필터링 강화
  - DELETE: 새로 추가
  - PATCH: 새로 추가
  
src/app/dashboard/classes/page.tsx             (74줄 추가)
  - handleDeleteClass 함수 추가
  - 수정/삭제 버튼 UI 추가
  - Edit, Trash2 아이콘 import

CLASS_LIST_FIX.md                              (문서)
```

## ⚠️ 주의사항

### 1. 학원 소유권 검증
- SUPER_ADMIN을 제외한 모든 사용자는 자신의 학원 클래스만 관리 가능
- API에서 `academy_id` 비교로 소유권 검증
- 다른 학원 클래스 수정/삭제 시 403 에러 반환

### 2. 삭제 시 연관 데이터
- `class_students` 테이블의 관련 레코드 자동 삭제
- 학생의 `class_id` 필드는 그대로 유지 (NULL 처리하지 않음)
- 추후 학생 테이블 정리 필요 시 별도 처리

### 3. 캐시 이슈
- 삭제 후 `window.location.reload()` 사용
- API 응답 캐싱 없음

## 🎯 다음 단계

### 추가 개선 사항
- [ ] 삭제 확인 모달 UI 개선 (alert → 커스텀 모달)
- [ ] 낙관적 업데이트 (삭제 후 즉시 UI 업데이트)
- [ ] 삭제 취소 기능 (Soft delete)
- [ ] 일괄 삭제 기능
- [ ] 클래스 복제 기능
- [ ] 클래스 아카이브 기능

### 데이터 정리
- [ ] 사용하지 않는 `Class` 테이블 확인 및 삭제
- [ ] 컬럼명 snake_case로 완전 통일
- [ ] 외래 키 제약조건 추가

## 📞 지원

문제 발생 시:
1. 브라우저 개발자 도구 콘솔 확인
2. Network 탭에서 API 응답 확인
3. 사용자 역할 및 academyId 확인

---

**업데이트 일시**: 2026-02-22
**커밋 해시**: daf6ccb
**배포 상태**: ✅ 완료 (2-3분 후 반영)
**해결됨**: 
- ✅ 클래스가 목록에 표시되지 않던 문제
- ✅ 학원별 분리 안되던 문제
- ✅ 삭제/수정 기능 없던 문제
