# Cloudflare Sandbox Durable Object 설정 완료

## 🎯 구현 내용

Cloudflare Sandbox SDK를 사용하여 Python SymPy 계산을 실행할 수 있도록 Durable Object binding을 추가했습니다.

## 📦 추가된 파일

### 1. `wrangler.jsonc`
- Cloudflare Sandbox SDK 설정 파일
- Durable Object binding: `SANDBOX`
- Container 설정: Python 3.12 + SymPy
- 최대 인스턴스: 3개 (동시 요청 처리)

```jsonc
{
  "containers": [
    {
      "class_name": "Sandbox",
      "image": "./Dockerfile.sandbox",
      "instance_type": "lite",
      "max_instances": 3
    }
  ],
  "durable_objects": {
    "bindings": [
      {
        "class_name": "Sandbox",
        "name": "SANDBOX"
      }
    ]
  }
}
```

### 2. `Dockerfile.sandbox`
- Python 3.12 기반 이미지
- SymPy, NumPy, SciPy, Matplotlib 설치
- 작업 디렉토리: `/workspace`

### 3. `functions/_worker.ts`
- Pages Functions에서 Sandbox Durable Object export
- `export { Sandbox } from '@cloudflare/sandbox';`

### 4. `functions/api/homework/precision-grading/index.ts`
- `calculateWithPython(equation, SANDBOX)` 함수 업데이트
- SANDBOX binding이 없으면 fallback 계산 사용
- `getSandbox(sandboxBinding, id)` 호출

## 🔧 Python 실행 방식

```typescript
// 1. Sandbox 인스턴스 생성
const sandbox = getSandbox(SANDBOX, `homework-${Date.now()}`);

// 2. Python 코드 실행
const result = await sandbox.commands.exec({
  cmd: ['python3', '-c', pythonCode]
});

// 3. 결과 반환
if (result.exitCode === 0 && result.stdout) {
  return {
    result: result.stdout.trim(),
    steps: ['Cloudflare Sandbox SymPy 계산'],
    pythonCode
  };
}
```

## 🧪 테스트 엔드포인트

### API: `/api/homework/test-python`
```bash
curl -X POST https://superplacestudy.pages.dev/api/homework/test-python \
  -H "Content-Type: application/json" \
  -d '{"equation": "3*x + 5 = 14"}'
```

**예상 응답:**
```json
{
  "success": true,
  "equation": "3*x + 5 = 14",
  "result": "3",
  "pythonCode": "from sympy import ...",
  "stdout": "정답: 3\n",
  "exitCode": 0
}
```

## 📋 배포 체크리스트

### ✅ 완료된 항목
- [x] wrangler.jsonc 생성 (Durable Object + Container)
- [x] Dockerfile.sandbox 생성 (Python + SymPy)
- [x] SANDBOX binding을 코드에 추가
- [x] functions/_worker.ts에서 Sandbox export
- [x] Git 커밋 및 푸시 완료

### ⚠️ 주의사항 (Cloudflare 측 설정)

**Cloudflare Pages는 현재 Container 이미지를 자동으로 빌드하지 않습니다.**

다음 두 가지 방법 중 하나를 선택해야 합니다:

#### 방법 1: Cloudflare Workers (권장)
Cloudflare Pages 대신 **Cloudflare Workers**로 배포:
```bash
# 로컬에서 Docker 실행 후
npx wrangler deploy
```

이 방법은:
- Docker가 로컬에서 컨테이너 이미지를 빌드
- Cloudflare Container Registry에 업로드
- Worker + Durable Object + Container 모두 배포

#### 방법 2: Cloudflare Pages + Workers 하이브리드
- 정적 페이지와 API는 Pages에 배포
- Python 계산만 별도 Worker로 배포
- Pages Functions에서 Worker를 호출

현재 프로젝트는 **Pages**로 배포되고 있으므로, **방법 2**가 적합합니다.

## 🔄 현재 상태

### 작동하는 기능
✅ LLM 채점 (Gemini 2.5 Flash)
✅ RAG 검색 (Vectorize + Workers AI)
✅ OCR 입력 처리
✅ Fallback 간단 계산

### 작동하지 않는 기능 (Sandbox binding 필요)
❌ Python SymPy 계산 (SANDBOX binding 없음)

### 로그 메시지
```
⚠️ SANDBOX binding 없음 - Fallback 계산 사용
```

## 🚀 다음 단계

### 옵션 A: Pages에서 계속 사용 (Fallback만 사용)
현재 상태 유지 - Python은 간단한 계산만 지원

### 옵션 B: Hybrid 아키텍처 (권장)
1. `functions/api/homework/python-worker/` 별도 Worker 생성
2. Pages Functions에서 Worker 호출
3. Worker에서 Sandbox 실행

### 옵션 C: Workers로 전체 마이그레이션
- 정적 페이지는 Pages 유지
- API 엔드포인트만 Workers로 이동

## 📊 성능

- **LLM 채점**: ~6초/이미지
- **RAG 검색**: ~1초 (지식베이스 있을 때)
- **Python 계산** (Sandbox): ~0.5-1초 예상
- **Fallback 계산**: <10ms

## 📌 요약

**코드 구현 완료**: ✅
- Durable Object binding 설정 완료
- Python 실행 코드 완료
- Fallback 로직 완료

**실제 작동**: ⚠️
- Cloudflare Pages는 Container를 지원하지 않음
- Worker로 배포하거나 Hybrid 구조 필요

**현재 배포**: https://superplacestudy.pages.dev
- Commit: `8624af51`
- Python: Fallback 계산 사용 중

---

**2026-03-09 22:15 UTC**
