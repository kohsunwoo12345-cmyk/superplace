# 클래스 표시 문제 종합 진단 도구

## 🎯 목적
학원장이 클래스를 추가했는데 `/dashboard/classes/` 페이지에 표시되지 않는 문제의 정확한 원인을 파악하기 위한 종합 진단 도구입니다.

## 🔧 구현 내용

### 1. 새로운 Diagnostic API 생성
**파일**: `functions/api/classes/diagnostic.js`

**기능**:
- 사용자 정보 확인 (User/users 테이블 모두 체크)
- 데이터베이스의 모든 클래스 조회
- 모든 학원(Academy) 정보 조회
- 사용자 academyId와 일치하는 클래스 필터링
- **타입 비교 분석** (academyId가 문자열인지 숫자인지, loose/strict 비교)
- SQL JOIN 결과 확인 (User, Academy 테이블 포함)

### 2. 디버그 페이지 개선
**파일**: `src/app/dashboard/debug-classes/page.tsx`

**새로운 기능**:
- 종합 진단 버튼 추가
- 타입 비교 섹션 (문자열 vs 숫자 불일치 감지)
- 매칭된 클래스 vs 전체 클래스 비교
- JOIN 쿼리 결과 표시
- 각 클래스의 academy_id가 사용자 academyId와 매칭되는지 시각적 표시

## 🔍 진단 방법

### 사용 절차:
1. **배포 대기**: 약 2-3분 후 https://superplacestudy.pages.dev 에 반영됨
2. **디버그 페이지 접속**: https://superplacestudy.pages.dev/dashboard/debug-classes
3. **"종합 진단" 버튼 클릭**
4. **결과 확인**:
   - 👤 데이터베이스 사용자 정보 → academyId 확인
   - 🔍 타입 비교 분석 → 문자열/숫자 타입 불일치 확인
   - 📚 모든 클래스 → DB에 존재하는 전체 클래스
   - ✅ 매칭된 클래스 → 사용자 academyId와 일치하는 클래스
   - 🔗 JOIN 쿼리 결과 → Academy, User 테이블 조인 결과

## 🐛 예상되는 문제들

### 시나리오 A: academyId 타입 불일치
**증상**: 
- DB에 클래스는 존재함
- 매칭된 클래스는 0개

**원인**:
- 클래스 생성 시 `academy_id`가 문자열로 저장됨 (예: "10")
- 사용자 조회 시 `academyId`가 숫자로 읽힘 (예: 10)
- JavaScript의 loose equality (==)는 통과하지만, SQL WHERE 절에서 불일치

**해결책**:
```javascript
// 클래스 생성 시 parseInt 또는 Number() 사용
const academyId = parseInt(body.academyId, 10);
```

### 시나리오 B: academyId가 NULL
**증상**:
- 사용자의 academyId가 NULL 또는 undefined

**원인**:
- 사용자 생성 시 academy 배정이 안됨
- User 테이블 데이터 누락

**해결책**:
- 사용자에게 academy 배정
- User 테이블 UPDATE 쿼리 실행

### 시나리오 C: 테이블명 불일치
**증상**:
- 클래스 생성은 `classes` 테이블에 저장
- 조회는 `Class` 테이블에서 검색

**원인**:
- 대소문자 구분 문제

**해결책**:
- 모든 API에서 동일한 테이블명 사용

## 📊 진단 결과 예시

### 정상 케이스:
```json
{
  "user": {
    "academyId": 1,
    "role": "DIRECTOR"
  },
  "classes": {
    "all": [{"id": 123, "academy_id": 1, "class_name": "초등 3학년"}],
    "matchingCount": 1
  },
  "typeChecks": {
    "userAcademyIdType": "number",
    "classAcademyIds": [
      {"id": 123, "academy_id": 1, "type": "number", "matches": true, "strictMatches": true}
    ]
  }
}
```

### 문제 케이스:
```json
{
  "user": {
    "academyId": 1,
    "role": "DIRECTOR"
  },
  "classes": {
    "all": [{"id": 123, "academy_id": "10", "class_name": "초등 3학년"}],
    "matchingCount": 0
  },
  "typeChecks": {
    "userAcademyIdType": "number",
    "classAcademyIds": [
      {"id": 123, "academy_id": "10", "type": "string", "matches": false, "strictMatches": false}
    ]
  }
}
```

## 📝 다음 단계

### 진단 후 조치:
1. **타입 불일치 발견 시**:
   - `functions/api/classes/create.ts` 수정
   - `parseInt()` 추가하여 academy_id를 숫자로 저장

2. **NULL academyId 발견 시**:
   - 사용자 계정에 academy 배정
   - 또는 회원가입/사용자 생성 로직 수정

3. **테이블명 불일치 발견 시**:
   - 모든 API에서 `classes` 테이블 사용하도록 통일

## 🚀 배포 정보

- **커밋**: d89bc45
- **브랜치**: main
- **배포 URL**: https://superplacestudy.pages.dev
- **진단 페이지**: https://superplacestudy.pages.dev/dashboard/debug-classes
- **예상 배포 시간**: 2-3분

## 📸 스크린샷 요청

진단 페이지에서 다음 정보를 확인하고 스크린샷을 공유해주세요:

1. ✅ "종합 진단" 버튼 클릭 후 전체 화면
2. ✅ "🔍 타입 비교 분석" 섹션 (특히 matches/strictMatches 값)
3. ✅ "✅ 매칭된 클래스" 섹션

이 정보로 정확한 원인을 파악하고 즉시 수정할 수 있습니다! 🎯
