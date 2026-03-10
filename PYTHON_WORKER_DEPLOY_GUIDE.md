# Python Workers 구현 및 배포 가이드

## 📦 구현 완료

두 가지 버전의 Workers 코드를 제공합니다:

### Option 1: JavaScript 구현 (권장, 빠름)
- **파일**: `python-worker-simple.js`
- **장점**: 
  - 빠른 응답 속도 (< 10ms)
  - 작은 번들 사이즈
  - Workers 제한 없음
- **지원**:
  - 사칙연산 (+, -, ×, ÷, *, /)
  - 괄호
  - 일차방정식 (2x + 5 = 15)
  - 간단한 계산식

### Option 2: Pyodide 구현 (완전한 Python)
- **파일**: `python-worker-src.js`
- **장점**:
  - 실제 Python + SymPy 사용
  - 복잡한 방정식 지원
  - 이차방정식, 미적분 등
- **단점**:
  - 느린 초기 로드 (Pyodide 크기 큼)
  - Workers 메모리 제한 주의

---

## 🚀 배포 방법

### 준비물
- Cloudflare 계정
- Wrangler CLI 설치: `npm install -g wrangler`

### 방법 1: 기존 Workers 업데이트 (권장)

#### Step 1: Cloudflare Dashboard 접속
```
https://dash.cloudflare.com/
→ Workers & Pages
→ physonsuperplacestudy 선택
```

#### Step 2: Quick Edit 또는 코드 업로드

**Option A: Quick Edit**
1. "Quick Edit" 버튼 클릭
2. `python-worker-simple.js` 전체 내용 복사
3. 기존 코드를 모두 지우고 붙여넣기
4. "Save and Deploy" 클릭

**Option B: Wrangler CLI**
```bash
# 1. 프로젝트 디렉토리 생성
mkdir ~/python-math-worker
cd ~/python-math-worker

# 2. 파일 복사
cp /home/user/webapp/python-worker-simple.js ./index.js
cp /home/user/webapp/python-worker-wrangler.toml ./wrangler.toml

# 3. wrangler.toml 수정 (name 확인)
nano wrangler.toml
# name = "physonsuperplacestudy"

# 4. Wrangler 로그인
wrangler login

# 5. 배포
wrangler deploy
```

---

### 방법 2: 새 Worker 생성 후 연결

```bash
# 1. 새 Worker 생성
wrangler init python-math-solver

# 2. 코드 복사
cp /home/user/webapp/python-worker-simple.js python-math-solver/src/index.js

# 3. 배포
cd python-math-solver
wrangler deploy

# 4. 배포된 URL 확인 (예: https://python-math-solver.yourname.workers.dev)

# 5. 기존 Pages의 wrangler.toml 업데이트
# PYTHON_WORKER_URL = "https://python-math-solver.yourname.workers.dev"
```

---

## 🧪 배포 후 테스트

### 1. 헬스체크
```bash
curl https://physonsuperplacestudy.kohsunwoo12345.workers.dev/
```

**예상 응답**:
```json
{
  "status": "ok",
  "version": "2.0",
  "service": "Python-like Math Solver (JavaScript)",
  "features": [...],
  "endpoints": {...}
}
```

---

### 2. 간단한 계산
```bash
curl -X POST https://physonsuperplacestudy.kohsunwoo12345.workers.dev/solve \
  -H "Content-Type: application/json" \
  -d '{"equation":"15 + 27","method":"sympy"}'
```

**예상 응답**:
```json
{
  "success": true,
  "result": "42",
  "steps": ["15 + 27", "= 42"],
  "method": "javascript-solver",
  "processingTime": "2ms"
}
```

---

### 3. 방정식 풀이
```bash
curl -X POST https://physonsuperplacestudy.kohsunwoo12345.workers.dev/solve \
  -H "Content-Type: application/json" \
  -d '{"equation":"2x + 5 = 15","method":"sympy"}'
```

**예상 응답**:
```json
{
  "success": true,
  "result": "5",
  "steps": [
    "2x + 5 = 15",
    "2x + 5 = 15",
    "2x = 10",
    "x = 5"
  ],
  "method": "javascript-solver",
  "processingTime": "3ms"
}
```

---

### 4. 복잡한 계산
```bash
curl -X POST https://physonsuperplacestudy.kohsunwoo12345.workers.dev/solve \
  -H "Content-Type: application/json" \
  -d '{"equation":"(10 + 5) * 2 - 8","method":"sympy"}'
```

**예상 응답**:
```json
{
  "success": true,
  "result": "22",
  "steps": ["(10 + 5) * 2 - 8", "= 22"],
  "method": "javascript-solver",
  "processingTime": "1ms"
}
```

---

## 🔧 전체 시스템 테스트

배포 완료 후 Pages 프로젝트에서 테스트:

```bash
cd /home/user/webapp
node test-python-worker-grading.js
```

**예상 결과**:
```
✅ 테스트 1: Python Workers 헬스체크 (통과)
✅ 테스트 2: 간단한 수학 문제 풀이 (5/5 통과)
✅ 테스트 3: 방정식 풀이 (4/4 성공)
✅ 테스트 4: 실제 숙제 채점 (100점)

🎉 모든 테스트 통과!
```

---

## 📋 Quick Deploy Script

한 번에 배포하는 스크립트:

```bash
#!/bin/bash
# deploy-python-worker.sh

echo "🚀 Python Math Worker 배포 시작..."

# Workers 프로젝트 생성
mkdir -p ~/python-math-worker
cd ~/python-math-worker

# 코드 복사
cat > index.js << 'EOF'
[python-worker-simple.js 전체 내용 붙여넣기]
EOF

# wrangler.toml 생성
cat > wrangler.toml << 'EOF'
name = "physonsuperplacestudy"
main = "index.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
workers_dev = true
EOF

# 배포
echo "📦 배포 중..."
wrangler deploy

echo "✅ 배포 완료!"
echo ""
echo "🧪 테스트:"
echo "curl https://physonsuperplacestudy.kohsunwoo12345.workers.dev/"
```

---

## 🐛 문제 해결

### 문제 1: "Hello world"만 나옴
**원인**: 기존 코드가 아직 배포되어 있음  
**해결**: Cloudflare Dashboard에서 Quick Edit으로 코드 교체

### 문제 2: CORS 오류
**원인**: CORS 헤더 누락  
**해결**: 코드에 이미 포함됨 (`Access-Control-Allow-Origin: *`)

### 문제 3: 복잡한 방정식 실패
**원인**: JavaScript 구현의 제한  
**해결**: Pyodide 버전 사용 (`python-worker-src.js`)

### 문제 4: Wrangler 인증 실패
```bash
wrangler login
# 브라우저에서 로그인
```

---

## 📊 성능 비교

| 방법 | 초기 로드 | 응답 시간 | 메모리 | 지원 범위 |
|------|----------|----------|--------|----------|
| JavaScript | 즉시 | 1-5ms | 작음 | 기본 |
| Pyodide | 느림 (초기) | 50-200ms | 큼 | 완전 |
| Fallback | 즉시 | 1ms | 매우 작음 | 매우 제한적 |

---

## ✅ 체크리스트

### 배포 전
- [ ] `python-worker-simple.js` 파일 확인
- [ ] Cloudflare 계정 로그인
- [ ] Wrangler CLI 설치 (옵션)

### 배포
- [ ] Cloudflare Dashboard에서 Quick Edit
- [ ] 코드 복사 및 붙여넣기
- [ ] Save and Deploy 클릭
- [ ] 배포 완료 확인

### 테스트
- [ ] `curl` 헬스체크 (GET /)
- [ ] 간단한 계산 테스트 (15 + 27)
- [ ] 방정식 풀이 테스트 (2x + 5 = 15)
- [ ] 전체 시스템 테스트 (`node test-python-worker-grading.js`)

### Pages 연동 확인
- [ ] Pages 프로젝트 재배포 (자동 또는 수동)
- [ ] 실제 숙제 채점 테스트
- [ ] Python 계산 결과 확인

---

## 🎉 완료 후 확인사항

배포 성공 시:
1. ✅ Workers 서비스: https://physonsuperplacestudy.kohsunwoo12345.workers.dev
2. ✅ Pages 서비스: https://superplacestudy.pages.dev
3. ✅ 통합 테스트 모두 통과
4. ✅ 실제 숙제 채점 정확도 향상

---

**마지막 업데이트**: 2026-03-10  
**버전**: 2.0 (JavaScript 구현)
