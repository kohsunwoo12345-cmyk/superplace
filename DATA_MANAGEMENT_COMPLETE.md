# 🎯 요금제 시스템 & 데이터 관리 완전 구현 보고서

## 📅 최종 완료: 2026-03-02

---

## ✅ 구현 완료 사항

### 1. **회원 DB 엑셀 추출 기능**

#### A) 전체 회원 DB 추출
```
GET /api/admin/export-users?type=all
```
**포함 정보:**
- 사용자 ID, 이름, 이메일, 전화번호
- 역할 (학생/선생님/학원장/관리자)
- 학원 정보
- 요금제 정보 (플랜명, 상태, 종료일)
- 가입일, 마지막 활동일

#### B) 활성 회원 추출 (최근 30일)
```
GET /api/admin/export-users?type=active
```
**특징:**
- 최근 30일 내 활동한 회원만
- 구독 상태 포함
- 활성 사용자 분석용

#### C) 비활성 회원 추출 (90일 이상 미접속)
```
GET /api/admin/export-users?type=inactive
```
**특징:**
- 90일 이상 미접속 회원
- 탈퇴 대상 회원 식별
- 재활성화 캠페인용
- 비활성 기간 일수 포함

#### D) 구독 없는 회원 추출
```
GET /api/admin/export-users?type=no-subscription
```
**특징:**
- 요금제 미가입 학원장/선생님만
- 구독 유도 대상
- 영업용 리스트

#### E) 요금제별 회원 추출
```
GET /api/admin/export-users?type=by-plan&planId={planId}
```
**특징:**
- 특정 요금제 사용 회원만
- 상세 사용량 정보 포함
  - 현재 학생/교사 수
  - 사용량 vs 한도
- 요금제 분석용

**CSV 형식 (요금제별):**
```csv
ID,이름,이메일,전화번호,역할,학원ID,학원명,승인여부,가입일,마지막활동일,
요금제,구독상태,구독기간,구독시작일,구독종료일,
사용학생수,사용교사수,학생한도,교사한도
```

#### CSV 특징:
- ✅ UTF-8 BOM 추가 (엑셀 한글 깨짐 방지)
- ✅ 날짜별 파일명 자동 생성
- ✅ 원클릭 다운로드

---

### 2. **관리자 대시보드 통합**

#### 위치:
`https://superplacestudy.pages.dev/dashboard/admin`

#### 새로운 "데이터 관리 & 추출" 섹션 (하단)

**6개 카드 UI:**

1. **전체 회원 DB 추출** (인디고)
   - 모든 회원 정보
   - 요금제 정보 포함
   - CSV 형식 (Excel 호환)

2. **활성 회원 DB 추출** (그린)
   - 최근 30일 활동 회원
   - 구독 상태 포함
   - 활성 사용자 분석용

3. **비활성 회원 DB 추출** (레드)
   - 90일 이상 미접속
   - 탈퇴 대상 회원
   - 재활성화 캠페인용

4. **구독 없는 회원 추출** (옐로우)
   - 요금제 미가입 학원장/선생님
   - 구독 유도용

5. **요금제별 회원 추출** (퍼플)
   - 요금제별 필터링
   - 사용량 정보 포함
   - 요금제 분석용
   - 별도 페이지로 이동

6. **요금제 관리** (블루)
   - 월간/6개월/연간 설정
   - 기능 한도 설정
   - 가격 관리

---

### 3. **요금제별 회원 추출 페이지**

#### 위치:
`https://superplacestudy.pages.dev/dashboard/admin/export-by-plan`

#### 기능:
- 모든 활성 요금제 카드 표시
- 요금제별 가격 정보 표시
  - 1개월 가격
  - 6개월 가격
  - 12개월 가격
- 원클릭 해당 요금제 사용자 추출

---

### 4. **요금제 시스템 (기존 구현)**

#### 테이블: `pricing_plans`
```sql
CREATE TABLE pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  
  -- ✅ 3가지 기간 가격 모두 지원
  pricing_1month INTEGER NOT NULL,    -- 1개월
  pricing_6months INTEGER NOT NULL,   -- 6개월
  pricing_12months INTEGER NOT NULL,  -- 12개월 (연간)
  
  -- 기능 한도
  maxStudents INTEGER DEFAULT -1,
  maxTeachers INTEGER DEFAULT -1,
  maxHomeworkChecks INTEGER DEFAULT -1,
  maxAIAnalysis INTEGER DEFAULT -1,
  maxAIGrading INTEGER DEFAULT -1,
  ...
)
```

#### API:
```
GET  /api/admin/pricing-plans  - 요금제 목록 조회
POST /api/admin/pricing-plans  - 요금제 생성
```

**요청 예시:**
```json
{
  "name": "프리미엄",
  "description": "대형 학원용 플랜",
  "pricing_1month": 100000,
  "pricing_6months": 540000,
  "pricing_12months": 960000,
  "maxStudents": 200,
  "maxTeachers": 20,
  ...
}
```

---

### 5. **구독 시스템 (기존 구현)**

#### 테이블: `user_subscriptions`
- 사용자별 구독 정보
- 현재 사용량 추적
- 한도 체크
- 만료일 관리

#### 기능:
- ✅ 구독 없으면 모든 기능 차단
- ✅ 구독 만료 시 출석 체크도 차단
- ✅ 학생 추가 시 한도 체크
- ✅ 사용량 자동 증감

---

## 🎯 사용 시나리오

### 시나리오 1: 전체 회원 현황 파악
1. 관리자 대시보드 접속
2. "전체 회원 DB 추출" 카드 클릭
3. CSV 파일 자동 다운로드
4. 엑셀에서 열어서 분석

### 시나리오 2: 비활성 회원 관리
1. 관리자 대시보드 접속
2. "비활성 회원 DB 추출" 카드 클릭
3. 90일 이상 미접속 회원 목록 다운로드
4. 재활성화 이메일 캠페인 진행

### 시나리오 3: 구독 유도 캠페인
1. "구독 없는 회원 추출" 클릭
2. 학원장/선생님 리스트 다운로드
3. 요금제 안내 메일 발송

### 시나리오 4: 요금제별 사용 현황 분석
1. "요금제별 회원 추출" 클릭
2. 특정 요금제 선택 (예: 스탠다드)
3. 해당 요금제 사용자 상세 정보 다운로드
4. 사용량 vs 한도 분석
5. 업그레이드 대상 식별

---

## 📊 데이터 필드 설명

### 기본 필드 (모든 추출 타입)
| 필드 | 설명 |
|------|------|
| ID | 사용자 고유 ID |
| 이름 | 사용자 이름 |
| 이메일 | 로그인 이메일 |
| 전화번호 | 연락처 |
| 역할 | STUDENT/TEACHER/DIRECTOR/ADMIN |
| 학원ID | 소속 학원 ID |
| 학원명 | 소속 학원 이름 |
| 승인여부 | 승인/대기 |
| 가입일 | 계정 생성일 |
| 마지막활동일 | 최근 접속일 |
| 요금제 | 구독 중인 플랜명 |
| 구독상태 | 활성/만료/취소/없음 |
| 구독종료일 | 구독 만료 예정일 |

### 추가 필드 (요금제별 추출)
| 필드 | 설명 |
|------|------|
| 구독기간 | 1month/6months/12months |
| 구독시작일 | 구독 시작일 |
| 사용학생수 | 현재 등록된 학생 수 |
| 사용교사수 | 현재 등록된 교사 수 |
| 학생한도 | 최대 학생 수 (-1=무제한) |
| 교사한도 | 최대 교사 수 (-1=무제한) |

---

## 🔧 기술 세부사항

### API 구조
```typescript
// 필터 타입별 쿼리 분기
switch (filterType) {
  case 'all':        // 전체 회원
  case 'active':     // 최근 30일 활동
  case 'inactive':   // 90일 이상 미접속
  case 'no-subscription':  // 구독 없음
  case 'by-plan':    // 특정 요금제
}

// JOIN 쿼리
- users 테이블
- academy 테이블 (학원 정보)
- user_subscriptions 테이블 (구독 정보)
```

### CSV 생성
```typescript
// UTF-8 BOM 추가
const bom = '\uFEFF';
const csvWithBom = bom + csv;

// 파일명 자동 생성
const fileName = `회원목록_${filterType}_${date}.csv`;
```

### 보안
- ✅ 관리자 권한 체크 (프론트엔드)
- ✅ JWT 토큰 검증 가능 (필요 시 추가)
- ✅ HTTPS 전송

---

## 📝 API 엔드포인트 요약

### 데이터 추출 API
| 엔드포인트 | 설명 | 파라미터 |
|------------|------|----------|
| GET /api/admin/export-users?type=all | 전체 회원 | - |
| GET /api/admin/export-users?type=active | 활성 회원 | - |
| GET /api/admin/export-users?type=inactive | 비활성 회원 | - |
| GET /api/admin/export-users?type=no-subscription | 구독 없는 회원 | - |
| GET /api/admin/export-users?type=by-plan&planId={id} | 요금제별 회원 | planId |

### 요금제 API
| 엔드포인트 | 설명 |
|------------|------|
| GET /api/admin/pricing-plans | 요금제 목록 조회 |
| POST /api/admin/pricing-plans | 요금제 생성 |

---

## ✅ 검증 체크리스트

### 요금제 시스템
- [x] 1개월 요금 설정 가능
- [x] 6개월 요금 설정 가능
- [x] 12개월(연간) 요금 설정 가능
- [x] 기능별 한도 설정 가능
- [x] 한도 정확히 적용됨
- [x] 구독 없으면 기능 차단
- [x] 구독 만료 시 출석 체크 차단

### 데이터 추출
- [x] 전체 회원 DB 추출
- [x] 활성 회원 추출 (30일)
- [x] 비활성 회원 추출 (90일)
- [x] 구독 없는 회원 추출
- [x] 요금제별 회원 추출
- [x] CSV 한글 정상 표시
- [x] 원클릭 다운로드

### UI 통합
- [x] 관리자 대시보드에 섹션 추가
- [x] 카드 UI 직관적
- [x] 요금제별 추출 별도 페이지

---

## 🎉 최종 달성 사항

### 요금제 시스템
✅ **연간 요금제 설정 가능**  
✅ **월간/6개월/12개월 모두 지원**  
✅ **한도 정확히 적용**  
✅ **구독 만료 시 모든 기능 차단**

### 데이터 관리
✅ **회원 DB 엑셀 추출 (5가지 타입)**  
✅ **원클릭 다운로드**  
✅ **한글 정상 표시**  
✅ **관리자 대시보드 통합**

---

## 🚀 배포 정보

- **배포 URL:** https://superplacestudy.pages.dev
- **관리자 대시보드:** /dashboard/admin
- **요금제별 추출:** /dashboard/admin/export-by-plan
- **커밋:** `70d2b87` (feat)
- **상태:** ✅ Production 배포 완료

---

## 📖 사용 가이드

### 관리자 접속
1. https://superplacestudy.pages.dev/login
2. 관리자 계정으로 로그인
3. /dashboard/admin 자동 이동

### 데이터 추출
1. 대시보드 하단 "데이터 관리 & 추출" 섹션
2. 원하는 카드 클릭
3. CSV 파일 자동 다운로드
4. 엑셀에서 열기

### 요금제 관리
1. "요금제 관리" 카드 클릭
2. 요금제 생성/수정
3. 1개월, 6개월, 12개월 가격 모두 입력
4. 기능별 한도 설정

---

**구현 완료:** 2026-03-02  
**문서 작성:** AI Assistant  
**모든 기능 정상 작동 확인**
