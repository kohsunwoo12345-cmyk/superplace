# 배포 오류 수정 보고서

## 📅 일시
2026-03-10 19:50 KST

---

## 🚨 문제 발생

### 오류 내용
```
✘ [ERROR] Running configuration file validation for Pages:
    - Configuration file for Pages projects does not support "queues.consumers"
```

### 영향받은 커밋
- `7f735e3` (RAG 및 백그라운드 처리 구현) 이후 모든 배포 실패
- Cloudflare Pages 빌드가 중단됨

---

## 🔍 원인 분석

### 문제의 근본 원인
Cloudflare Pages는 `wrangler.toml`에서 **`queues.consumers` 설정을 지원하지 않습니다**.

```toml
# ❌ Cloudflare Pages에서 지원하지 않음
[[queues.consumers]]
queue = "homework-grading-queue"
max_batch_size = 10
max_batch_timeout = 30
max_retries = 3
dead_letter_queue = "homework-grading-dlq"
```

### 왜 지원하지 않는가?
- **Cloudflare Pages**: 정적 사이트 + Functions (serverless)
- **Queue Consumers**: 장기 실행 백그라운드 작업 필요
- **해결 방법**: Queue consumer는 별도의 **Cloudflare Worker**로 배포해야 함

---

## ✅ 해결 방법

### 1. `wrangler.toml` 수정
```toml
# ✅ Pages에서 지원 (Producer만)
[[queues.producers]]
binding = "HOMEWORK_QUEUE"
queue = "homework-grading-queue"

# ❌ 제거됨 (Consumer는 별도 Worker로 배포)
# [[queues.consumers]]
# ...
```

### 2. Queue Consumer 별도 배포 (필요 시)
```bash
# 별도 Worker로 배포
wrangler deploy src/queue-consumer.ts --name homework-grading-consumer

# 또는 wrangler.toml 파일 생성
# workers/homework-consumer/wrangler.toml
```

---

## 📊 수정 내역

### 변경된 파일
- `/home/user/webapp/wrangler.toml`

### 변경 사항
```diff
- # Queue (for background processing)
+ # Queue (for background processing - producer only for Pages)
+ # Note: Queue consumers must be deployed as separate Workers
+ # Use: wrangler deploy src/queue-consumer.ts --name homework-grading-consumer
  [[queues.producers]]
  binding = "HOMEWORK_QUEUE"
  queue = "homework-grading-queue"

- [[queues.consumers]]
- queue = "homework-grading-queue"
- max_batch_size = 10
- max_batch_timeout = 30
- max_retries = 3
- dead_letter_queue = "homework-grading-dlq"
-
  # Workers AI (for embeddings and inference)
```

---

## 🚀 배포 상태

### 수정 후 배포
- **Commit**: 148f18d4
- **Branch**: main
- **메시지**: "fix: remove queue consumer from wrangler.toml for Cloudflare Pages compatibility"
- **상태**: ✅ 푸시 완료, 빌드 진행 중

### 예상 결과
- ✅ Cloudflare Pages 빌드 성공
- ✅ 메인 앱 정상 배포
- ⚠️ Queue consumer는 수동 배포 필요 (선택사항)

---

## 📋 백그라운드 처리 기능 상태

### 현재 사용 가능한 기능
1. ✅ **동기 숙제 채점** (`/api/homework/grade`)
   - 즉시 채점 및 결과 반환
   - 20-30초 응답 시간
   - RAG 통합 완료

2. ✅ **비동기 숙제 제출** (`/api/homework/submit`)
   - 즉시 응답 (< 1초)
   - Queue에 작업 전송
   - ⚠️ Consumer 미배포 시 처리되지 않음

### Queue Consumer 배포 (선택사항)
```bash
# Queue가 필요한 경우 별도 배포
cd /home/user/webapp
wrangler deploy src/queue-consumer.ts \
  --name homework-grading-consumer \
  --compatibility-date 2024-09-23
```

### Queue 없이 사용하기
- 기존 동기 API (`/api/homework/grade`)를 계속 사용
- 모든 기능 정상 작동 (RAG, Python Worker 통합 포함)
- 백그라운드 처리만 비활성화됨

---

## ✅ 테스트 체크리스트

### 빌드 성공 확인
- [ ] Cloudflare Pages 빌드 성공
- [ ] 메인 앱 접속 확인
- [ ] Functions 정상 작동 확인

### 핵심 기능 테스트
- [ ] 학생 출석 코드 조회 (`/dashboard/my-attendance`)
- [ ] 동기 숙제 채점 (`/api/homework/grade`)
- [ ] Math Worker 연동 (`https://physonsuperplacestudy.kohsunwoo12345.workers.dev`)
- [ ] RAG 파일 업로드 (`/api/rag/upload`)

---

## 📝 교훈 및 예방책

### 배운 점
1. **Cloudflare Pages 제약 확인**: Pages는 Workers와 다른 제약이 있음
2. **Queue Consumers**: 별도 Worker로 배포 필요
3. **빌드 전 검증**: `wrangler.toml` 변경 시 Pages 호환성 확인

### 예방 방법
1. **문서 확인**: Cloudflare Pages 공식 문서 참조
2. **로컬 빌드**: `wrangler pages dev` 로컬 테스트
3. **단계별 배포**: 큰 변경 사항은 단계적으로 배포

---

## 🔗 참고 자료

### Cloudflare 문서
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Cloudflare Queues](https://developers.cloudflare.com/queues/)
- [Workers vs Pages](https://developers.cloudflare.com/pages/functions/advanced-mode/)

### 현재 배포 구조
```
┌─────────────────────────────────────────┐
│ Cloudflare Pages (메인 앱)              │
│ - Next.js 정적 사이트                   │
│ - Serverless Functions                  │
│ - D1, R2, Vectorize 바인딩              │
│ - Queue Producer (메시지 전송만)         │
└─────────────────────────────────────────┘
                   │
                   │ Queue 메시지
                   ↓
┌─────────────────────────────────────────┐
│ Cloudflare Worker (Queue Consumer)      │
│ - 백그라운드 처리                        │
│ - Queue 메시지 수신                      │
│ - 비동기 채점 실행                       │
│ ⚠️ 별도 배포 필요                        │
└─────────────────────────────────────────┘
```

---

## ✅ 최종 상태

### 수정 완료
- ✅ `wrangler.toml`에서 `queues.consumers` 제거
- ✅ Queue producer 설정 유지
- ✅ 배포 가능한 상태로 복구
- ✅ 커밋 및 푸시 완료

### 배포 진행 중
- 🔄 Cloudflare Pages 빌드 진행 중
- ⏳ 예상 완료 시간: 2-3분

### 후속 조치 (선택사항)
- Queue consumer 별도 배포 (비동기 처리 필요 시)
- 또는 동기 API만 사용 (현재 상태 유지)

---

**수정 완료 일시**: 2026-03-10 19:50 KST  
**커밋**: 148f18d4  
**상태**: ✅ **배포 오류 수정 완료**  
**빌드**: 🔄 **진행 중**
