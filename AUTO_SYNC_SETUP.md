# ⚡ 자동 양방향 동기화 시스템

## 🎯 목적
Cloudflare D1과 로컬 PostgreSQL 간 **완전 자동** 양방향 동기화

---

## ✨ 핵심 기능

### 1️⃣ **자동 실행 (Vercel Cron Job)**
- **주기**: 5분마다 자동 실행
- **설정 파일**: `vercel.json`
- **인증 불필요**: 자동으로 실행됨

### 2️⃣ **양방향 동기화**

#### 📥 **D1 → Local (새 회원가입)**
- D1에서 최신 사용자 100명 조회
- 로컬 DB에 없으면 생성
- 있으면 정보 업데이트

#### 📤 **Local → D1 (백업)**
- 최근 24시간 내 업데이트된 사용자 조회
- D1에 백업
- 없으면 생성, 있으면 업데이트

---

## 🔧 설정 방법

### **Step 1: Vercel Cron Job 활성화**

#### Vercel 대시보드에서:
1. **Project Settings** → **Cron Jobs** 탭
2. 자동으로 인식됨: `vercel.json` 파일 기반
3. 확인:
   - Path: `/api/auto-sync-d1`
   - Schedule: `*/5 * * * *` (5분마다)
   - Status: ✅ Enabled

#### 또는 자동 배포:
- GitHub에 push하면 Vercel이 자동으로 인식
- Cron Job이 자동으로 활성화됨

---

### **Step 2: 수동 테스트 (선택사항)**

배포 완료 후 수동으로 실행 테스트:

```bash
curl https://superplace-study.vercel.app/api/auto-sync-d1
```

또는 브라우저에서:
```
https://superplace-study.vercel.app/api/auto-sync-d1
```

**예상 응답:**
```json
{
  "success": true,
  "message": "자동 양방향 동기화 완료",
  "result": {
    "d1ToLocal": {
      "created": 5,
      "updated": 3,
      "failed": 0,
      "errors": []
    },
    "localToD1": {
      "created": 2,
      "updated": 10,
      "failed": 0,
      "errors": []
    },
    "timestamp": "2025-01-30T12:00:00.000Z"
  }
}
```

---

## 📊 동작 방식

### **5분마다 자동 실행:**

```
12:00 → D1 ↔ Local 동기화
12:05 → D1 ↔ Local 동기화
12:10 → D1 ↔ Local 동기화
...
```

### **동기화 플로우:**

```
┌─────────────────────────────────────┐
│   Cloudflare D1                     │
│   (새 회원가입)                      │
└─────────────────────────────────────┘
            ↓ 5분마다 자동
            📥 D1 → Local
            ↓
┌─────────────────────────────────────┐
│   Local PostgreSQL                  │
│   (새 사용자 자동 생성)              │
└─────────────────────────────────────┘
            ↓ 5분마다 자동
            📤 Local → D1
            ↓
┌─────────────────────────────────────┐
│   Cloudflare D1                     │
│   (백업 완료)                        │
└─────────────────────────────────────┘
```

---

## 🎯 주요 특징

### ✅ **완전 자동**
- 수동 작업 불필요
- 관리자가 버튼 누를 필요 없음
- 5분마다 백그라운드에서 자동 실행

### ✅ **양방향**
- D1 → Local: 새 회원가입 자동 반영
- Local → D1: 기존 사용자 백업

### ✅ **성능 최적화**
- D1: 최신 100명만 조회
- Local: 최근 24시간 업데이트만 동기화
- 중복 방지: 이메일 기준 체크

### ✅ **에러 처리**
- 개별 사용자 실패해도 계속 진행
- 에러 로그 자동 기록
- 활동 로그에 결과 저장

---

## 🔍 모니터링

### **Vercel 대시보드에서 확인**

1. **Cron Jobs 로그**:
   - Project → Cron Jobs → Logs
   - 5분마다 실행 기록 확인

2. **Function 로그**:
   - Project → Logs → `/api/auto-sync-d1`
   - 동기화 상세 로그 확인

### **활동 로그에서 확인**

```
https://superplace-study.vercel.app/dashboard/sync
```

- 자동 동기화 히스토리 표시
- 생성/업데이트 통계

---

## ⚙️ 설정 변경

### **동기화 주기 변경**

`vercel.json` 파일 수정:

```json
{
  "crons": [
    {
      "path": "/api/auto-sync-d1",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**스케줄 형식**: Cron Expression
- `*/5 * * * *` = 5분마다
- `*/10 * * * *` = 10분마다
- `0 * * * *` = 매시간 정각
- `0 0 * * *` = 매일 자정
- `*/1 * * * *` = 1분마다 (최소)

---

## 🚨 주의사항

### **Vercel Cron Job 제한**

1. **Hobby Plan (무료)**:
   - 최대 1개 Cron Job
   - 실행 시간: 최대 10초
   - 동기화 사용자 수가 많으면 제한 걸릴 수 있음

2. **Pro Plan**:
   - 최대 10개 Cron Job
   - 실행 시간: 최대 60초
   - 권장

### **성능 최적화**

현재 설정:
- D1: 최신 100명만
- Local: 최근 24시간 업데이트만

사용자가 많아지면 조정 가능:
- D1: 최신 50명
- Local: 최근 12시간

---

## 📋 테스트 체크리스트

### **배포 후 확인사항**

1. ✅ **Vercel Cron Job 활성화**
   - Project Settings → Cron Jobs
   - Status: Enabled

2. ✅ **첫 실행 테스트**
   ```
   https://superplace-study.vercel.app/api/auto-sync-d1
   ```
   - 응답: `success: true`

3. ✅ **5분 후 자동 실행 확인**
   - Vercel Logs에서 확인
   - 활동 로그에서 확인

4. ✅ **새 회원가입 테스트**
   - D1에 테스트 사용자 추가
   - 5분 후 로컬 DB에 자동 생성 확인

---

## 🎊 완료!

이제:
- ✅ 5분마다 자동 양방향 동기화
- ✅ 새 회원가입 자동 반영
- ✅ 기존 사용자 자동 백업
- ✅ 관리자 개입 불필요

**아무것도 하지 않아도 계속 동기화됩니다!** 🚀

---

## 📞 문제 해결

### **Cron Job이 실행되지 않음**
- Vercel 대시보드 → Cron Jobs → Enable 확인
- `vercel.json` 파일 확인
- GitHub에 push 후 재배포

### **동기화 실패**
- `/api/auto-sync-d1` 직접 접속해서 에러 확인
- 환경 변수 확인: `/api/debug-env`
- D1 연결 확인: `/api/test-d1-connection`

---

**작성일**: 2025-01-30  
**버전**: 2.0.0  
**상태**: 완전 자동화 ✅
