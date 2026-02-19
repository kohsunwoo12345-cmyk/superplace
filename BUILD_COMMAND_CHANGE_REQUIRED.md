# ⚠️ Cloudflare Pages 빌드 명령어 변경 필수

## 🚨 현재 상황

Build command가 `npx @cloudflare/next-on-pages`로 설정되어 있어서 `postbuild` 스크립트가 제대로 실행되지 않습니다.

**빌드 로그에서 확인된 문제**:
```
▲  > super-place-marketing@1.0.0 postbuild
▲  > test -d .vercel/output/static && (rm -rf out && cp -r .vercel/output/static out) || true

⚡️ Build completed in 0.89s
Finished

... (중략) ...

Error: Output directory "out" not found.
```

`postbuild`가 실행되었지만, Cloudflare가 최종적으로 `out` 디렉토리를 찾을 수 없습니다.

---

## ✅ 해결 방법

### Cloudflare Pages 대시보드에서 Build command 변경

**현재**: `npx @cloudflare/next-on-pages` ❌  
**변경**: `bash cloudflare-build.sh` ✅

---

## 📋 단계별 가이드

### 1. Cloudflare Pages 대시보드 접속

1. https://dash.cloudflare.com/ 열기
2. **Workers & Pages** 클릭
3. 프로젝트 선택 (superplacestudy 또는 superplace)

### 2. Build 설정 변경

1. 왼쪽 메뉴에서 **Settings** 클릭
2. **Builds & deployments** 섹션
3. **Edit configuration** 버튼 클릭

### 3. Build command 변경

**기존**:
```bash
npx @cloudflare/next-on-pages
```

**변경 →**:
```bash
bash cloudflare-build.sh
```

### 4. 다른 설정 확인

- **Build output directory**: `out` (그대로 유지)
- **Root directory**: `/` (그대로 유지)

### 5. 저장 및 재배포

1. **Save** 버튼 클릭
2. **Deployments** 탭으로 이동
3. 가장 최근 배포에서 **Retry deployment** 클릭

---

## 🔍 왜 이렇게 해야 하나요?

### 문제 분석

1. **`npx @cloudflare/next-on-pages` 직접 실행 시**:
   - `@cloudflare/next-on-pages`가 `npm run build` 호출
   - `npm run build`가 `next build` 실행
   - `postbuild` 스크립트 실행 (`.vercel/output/static` → `out` 복사)
   - **하지만**: `postbuild`가 다른 디렉토리 컨텍스트에서 실행되거나 타이밍 문제 발생
   - Wrangler가 `out` 디렉토리를 찾을 때 이미 사라짐 또는 다른 위치

2. **`bash cloudflare-build.sh` 실행 시**:
   - 쉘 스크립트가 순차적으로 실행
   - `npx @cloudflare/next-on-pages` 완료 대기
   - 명시적으로 `cp -r .vercel/output/static out` 실행
   - `out` 디렉토리 존재 확인
   - Wrangler가 `out` 디렉토리 발견 ✅

---

## 📦 cloudflare-build.sh 내용

```bash
#!/bin/bash
set -e

echo "🚀 Building with @cloudflare/next-on-pages..."
npx @cloudflare/next-on-pages

echo "📦 Copying build output to 'out' directory..."
rm -rf out
cp -r .vercel/output/static out

echo "✅ Build complete! Output is in 'out' directory"
ls -la out/ | head -20

echo "📂 Checking _worker.js..."
if [ -d "out/_worker.js" ]; then
  echo "✅ _worker.js directory exists"
  ls -la out/_worker.js/
else
  echo "❌ _worker.js directory not found"
fi
```

이 스크립트는:
1. `@cloudflare/next-on-pages` 실행
2. `.vercel/output/static` → `out` 복사
3. `out` 디렉토리 확인
4. `_worker.js` 존재 확인

---

## ✅ 예상 빌드 로그

변경 후 성공하면 다음과 같은 로그가 나타납니다:

```
🚀 Building with @cloudflare/next-on-pages...
⚡️ @cloudflare/next-on-pages CLI v.1.13.16
⚡️ Building project...
⚡️ Build completed in 0.89s

📦 Copying build output to 'out' directory...
✅ Build complete! Output is in 'out' directory
total 584
drwxr-xr-x  8 user user  4096 ...
-rw-r--r--  1 user user  9681 404.html
...
drwxr-xr-x  3 user user  4096 _worker.js

📂 Checking _worker.js...
✅ _worker.js directory exists
total 16180
-rw-r--r-- 1 user user   128754 index.js
...

Validating asset output directory
Deploying...
✅ Deployment complete!
```

---

## 🎯 요약

**현재 Build command**: `npx @cloudflare/next-on-pages` ❌  
**필수 변경**: `bash cloudflare-build.sh` ✅

**이유**: `postbuild`의 타이밍 문제를 해결하고, 명시적으로 `out` 디렉토리를 생성하기 위함

**다음 단계**:
1. Cloudflare 대시보드에서 Build command 변경
2. Retry deployment
3. 2-3분 후 배포 성공 확인

---

## 📞 추가 지원

변경 후에도 문제가 발생하면 빌드 로그를 공유해 주세요.

**확인할 내용**:
- `🚀 Building with @cloudflare/next-on-pages...` 메시지
- `📦 Copying build output to 'out' directory...` 메시지
- `✅ _worker.js directory exists` 메시지
- `Validating asset output directory` 이후 오류 없음

모든 체크 표시가 나타나면 배포 성공입니다! 🎉
