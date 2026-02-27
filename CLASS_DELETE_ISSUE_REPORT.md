# 🚨 수업 자동 삭제 문제 긴급 보고

## 📅 발견 일자
2026-02-27

## 🔴 심각한 문제
**증상**: 수업을 추가해두면 갑자기 건들지 않아도 삭제됨

## 🔍 근본 원인

### 메모리 기반 저장소 사용
**파일**: `functions/api/classes/index.js`

```javascript
// Line 5: 메모리 내 저장소 선언
const CLASSES_BY_ACADEMY = new Map();

// Line 136: 빈 배열로 초기화
function getAcademyClasses(academyId) {
  if (!CLASSES_BY_ACADEMY.has(academyId)) {
    CLASSES_BY_ACADEMY.set(academyId, []); // ⚠️ 빈 배열로 초기화
    console.log(`🏫 Initialized empty classes for academy: ${academyId}`);
  }
  return CLASSES_BY_ACADEMY.get(academyId);
}
```

### Cloudflare Workers 특성
Cloudflare Workers는:
1. **각 요청마다 새로운 격리된 환경**에서 실행
2. **메모리는 휘발성** (요청 간 공유되지 않음)
3. **워커 인스턴스가 교체**되면 메모리 초기화

### 발생 시나리오
```
1. 사용자가 수업 추가 → CLASSES_BY_ACADEMY에 저장
   예: academy "1" → [class1, class2, class3]

2. Cloudflare가 새로운 워커 인스턴스 시작
   (또는 일정 시간 후 메모리 정리)
   
3. CLASSES_BY_ACADEMY = new Map() (빈 맵으로 초기화)

4. 다음 GET 요청 시 → getAcademyClasses("1")
   → CLASSES_BY_ACADEMY.has("1") === false
   → CLASSES_BY_ACADEMY.set("1", []) ⚠️ 빈 배열!
   
5. 사용자가 보는 화면: 수업이 모두 사라짐 😱
```

## 📊 문제 심각도
- **심각도**: 🔴 Critical
- **데이터 손실**: ✅ 발생 (복구 불가능)
- **사용자 영향**: 🔴 매우 높음 (핵심 기능 마비)
- **발생 빈도**: 🔴 자주 발생 (워커 재시작 시마다)

## 💾 현재 저장 구조

### 메모리 저장
```javascript
POST /api/classes
  ↓
CLASSES_BY_ACADEMY.set(academyId, [...classes, newClass])
  ↓
메모리 (RAM) 저장
  ↓
워커 재시작 → 데이터 소실 💥
```

### 문제점
- ❌ 영속성 없음 (Persistence)
- ❌ 데이터 복구 불가능
- ❌ 백업 없음
- ❌ 프로덕션 환경 부적합

## ✅ 해결 방안

### 방안 1: 데이터베이스 저장 (권장)
데이터베이스에 `Class` 테이블을 만들어 저장

**장점**:
- ✅ 영속성 보장
- ✅ 데이터 손실 방지
- ✅ 관계형 데이터 관리 (학생, 스케줄 연결)
- ✅ 프로덕션 환경에 적합

**필요 테이블**:
```sql
CREATE TABLE Class (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT,
  description TEXT,
  color TEXT,
  capacity INTEGER DEFAULT 20,
  isActive INTEGER DEFAULT 1,
  academyId TEXT NOT NULL,
  teacherId TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_class_academy ON Class(academyId);
```

### 방안 2: Cloudflare KV Storage (대안)
Cloudflare Workers KV를 사용하여 저장

**장점**:
- ✅ 영속성 보장
- ✅ 빠른 접근
- ✅ 워커와 통합 쉬움

**단점**:
- ⚠️ 추가 설정 필요
- ⚠️ 복잡한 쿼리 불가
- ⚠️ 비용 발생 가능

### 방안 3: 임시 해결 (비권장)
현재 상태 유지 + 사용자에게 경고

**장점**:
- ✅ 코드 변경 불필요

**단점**:
- ❌ 문제 해결 안됨
- ❌ 데이터 손실 계속 발생
- ❌ 사용자 불만 증가

## 🚀 권장 조치

### 즉시 조치 (긴급)
1. 사용자에게 문제 알림
2. 데이터베이스 마이그레이션 준비
3. 임시로 주의 메시지 표시

### 단기 조치 (1-2일)
1. `Class` 테이블 생성
2. API를 DB 기반으로 전환
3. 기존 메모리 데이터 마이그레이션

### 장기 조치 (1주일)
1. 모든 휘발성 데이터를 DB로 전환
2. 백업 시스템 구축
3. 데이터 복구 프로세스 마련

## 📝 현재 상태
- **문제**: ✅ 식별됨
- **원인**: ✅ 파악됨
- **해결책**: ✅ 제안됨
- **구현**: ❌ 대기 중 (사용자 승인 필요)

## ⚠️ 중요 참고사항
- **데이터베이스 수정 필요**: 예 (새 테이블 추가)
- **기존 데이터 영향**: 없음 (새 테이블 생성)
- **다른 테이블 변경**: 없음
- **롤백 가능**: 예

## 💬 사용자에게
현재 수업 관리 시스템은 메모리 기반으로 작동하여 **데이터가 휘발성**입니다.

**옵션**:
1. ✅ **권장**: 데이터베이스에 `Class` 테이블 추가 (영구 저장)
2. ⚠️ **대안**: Cloudflare KV 사용
3. ❌ **비권장**: 현재 상태 유지 (데이터 손실 계속)

어떤 방향으로 진행하시겠습니까?

---

**작성자**: AI Assistant  
**보고 일자**: 2026-02-27  
**우선순위**: 🔴 Critical  
**예상 작업 시간**: 1-2시간 (DB 방안)
