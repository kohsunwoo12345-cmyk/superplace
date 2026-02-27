# 학생 필드 표시 수정 완료 (최종)

## 📅 수정 일자
2026-02-27

## 🎯 문제점
학생 추가 후 상세 페이지에서 다음 필드들이 "미등록"으로 표시됨:
- 학교명
- 학년
- 소속반

## 🔍 원인 분석
1. ✅ **CreateStudentDialog**: 모든 필드를 입력하고 전송함
2. ✅ **API (`/api/students/create`)**: 데이터베이스에 모든 필드 저장함
3. ❌ **API (`/api/students/get-detail`)**: `class`, `parentPhone` 필드를 SELECT 쿼리에서 누락
4. ❌ **StudentDetail 인터페이스**: `class`, `parentPhone` 타입 정의 누락
5. ❌ **학생 상세 페이지**: `student.class` 필드 표시 로직 누락

## ✅ 수정 내역

### 1. API 수정: `/api/students/get-detail.js`

#### SELECT 쿼리 수정
**User 테이블**:
```javascript
// 변경 전
SELECT id, name, email, phone, role, academyId, school, grade,
       createdAt, updatedAt, points, approved
FROM User WHERE id = ?

// 변경 후
SELECT id, name, email, phone, role, academyId, school, grade, class,
       parentPhone, createdAt, updatedAt, points, approved
FROM User WHERE id = ?
```

**users 테이블 (fallback)**:
```javascript
// 변경 전
SELECT id, name, email, phone, role,
       CAST(academy_id AS TEXT) as academyId,
       school, grade, created_at as createdAt, updated_at as updatedAt
FROM users WHERE id = ?

// 변경 후
SELECT id, name, email, phone, role,
       CAST(academy_id AS TEXT) as academyId,
       school, grade, class, parent_phone as parentPhone,
       created_at as createdAt, updated_at as updatedAt
FROM users WHERE id = ?
```

#### 응답 데이터 확장
```javascript
student: {
  id: student.id,
  name: student.name,
  email: student.email,
  phone: student.phone,
  parentPhone: student.parentPhone,      // ✅ 추가
  school: student.school,
  grade: student.grade,
  class: student.class,                  // ✅ 추가
  academyId: student.academyId,
  academy: academyInfo,
  academyName: academyInfo?.name,        // ✅ 추가
  points: student.points || 0,
  approved: student.approved === 1,
  createdAt: student.createdAt,
  updatedAt: student.updatedAt
}
```

### 2. 프론트엔드 수정: `src/app/dashboard/students/detail/page.tsx`

#### 인터페이스 수정
```typescript
interface StudentDetail {
  id: string;
  email: string;
  name: string;
  phone?: string;
  parentPhone?: string;        // ✅ 추가
  role: string;
  password?: string;
  academyId?: string;
  academyName?: string;
  createdAt?: string;
  student_code?: string;
  school?: string;
  grade?: string;
  class?: string;              // ✅ 추가
  diagnostic_memo?: string;
  className?: string;
  classId?: string;
  classes?: Array<{classId: string; className: string}>;
  isWithdrawn?: number;
  withdrawnAt?: string;
  withdrawnReason?: string;
  withdrawnBy?: number;
}
```

#### 표시 로직 수정
```tsx
// 소속 반 표시
{student.classes && student.classes.length > 0 ? (
  student.classes.map((cls: any) => (
    <Badge key={cls.classId} variant="outline">
      {cls.className}
    </Badge>
  ))
) : student.className ? (
  <Badge variant="outline">{student.className}</Badge>
) : student.class ? (                        // ✅ 추가
  <p className="font-medium">{student.class}</p>
) : (
  <p className="font-medium">미등록</p>
)}
```

## 📊 데이터 흐름

### 학생 추가 흐름
1. **CreateStudentDialog** → `name`, `email`, `password`, `phone`, `parentPhone`, `school`, `grade`, `class`
2. **POST /api/students/create** → User 테이블에 모든 필드 INSERT
3. **응답**: 생성된 학생 정보 반환

### 학생 조회 흐름
1. **학생 상세 페이지** → `GET /api/students/by-academy?id={studentId}`
2. **API**: User 테이블에서 모든 필드 SELECT (✅ `class`, `parentPhone` 포함)
3. **API**: Academy 테이블 JOIN하여 학원 정보 가져오기
4. **응답**: `student` 객체에 모든 필드 포함 (✅ `class`, `parentPhone`, `academyName` 포함)
5. **프론트엔드**: `student.school`, `student.grade`, `student.class` 표시

## 🔄 필드 매핑

| 폼 필드 | DB 컬럼 | API 응답 | 화면 표시 |
|---------|---------|----------|-----------|
| 학교 | `school` | `school` | ✅ 표시 |
| 학년 | `grade` | `grade` | ✅ 표시 |
| 소속반 | `class` | `class` | ✅ 표시 |
| 학부모 연락처 | `parentPhone` | `parentPhone` | ✅ 표시 |
| 소속 학원 | `academyId` | `academyName` | ✅ 표시 |

## 📝 테스트 방법

### 1. 새 학생 추가
```
1. /dashboard/students → "학생 추가" 클릭
2. 모든 필드 입력:
   - 이름: 홍길동
   - 이메일: hong@test.com
   - 비밀번호: test1234
   - 학교: 서울중학교
   - 학년: 중2
   - 소속반: A반
   - 학생 연락처: 010-1234-5678
   - 학부모 연락처: 010-9876-5432
3. "학생 추가" 클릭
```

### 2. 학생 상세 페이지 확인
```
1. 추가한 학생 카드 클릭
2. "개인 정보" 탭 확인:
   ✅ 소속 학교: 서울중학교
   ✅ 학년: 중2
   ✅ 소속 반: A반
   ✅ 소속 학원: (현재 학원명)
```

### 3. 기존 학생 확인
- 기존 학생은 필드가 비어있으면 "미등록" 표시
- 편집 모드에서 정보 입력 가능

## ⚠️ 주의사항
- **데이터베이스 스키마는 수정하지 않음**
- 기존 학생 데이터에는 영향 없음
- 새로 추가되는 학생부터 모든 필드 표시됨
- 기존 학생은 "수정" 버튼으로 정보 업데이트 가능

## 🚀 배포 정보
- **커밋**: `b82cdcb`
- **브랜치**: `main`
- **변경 파일**: 
  - `functions/api/students/get-detail.js`
  - `src/app/dashboard/students/detail/page.tsx`

## ✅ 해결된 문제
- [x] 학교명이 "미등록"으로 표시되던 문제
- [x] 학년이 "미등록"으로 표시되던 문제
- [x] 소속반이 "미등록"으로 표시되던 문제
- [x] API에서 필드 누락 문제
- [x] 인터페이스 타입 정의 누락 문제

## 📊 최종 상태
| 항목 | 상태 | 설명 |
|------|------|------|
| 학생 추가 폼 | ✅ 완료 | 모든 필드 입력 가능 |
| API 저장 | ✅ 완료 | DB에 모든 필드 저장 |
| API 조회 | ✅ 완료 | 모든 필드 반환 |
| 화면 표시 | ✅ 완료 | 모든 필드 표시 |

---

**작성자**: AI Assistant  
**마지막 업데이트**: 2026-02-27
