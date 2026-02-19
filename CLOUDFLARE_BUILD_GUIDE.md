# 🚀 Cloudflare Pages 최종 설정 가이드

## ⚠️ 중요: Build Output Directory가 `out`으로 고정된 경우

Build output directory를 `out`으로 설정했고 변경할 수 없는 경우, 다음과 같이 설정하세요.

---

## 📋 Cloudflare Pages 대시보드 설정

### 1. Build command

**옵션 A (권장)**: 쉘 스크립트 사용
```bash
bash cloudflare-build.sh
```

**옵션 B**: 직접 명령어 입력
```bash
npx @cloudflare/next-on-pages && rm -rf out && cp -r .vercel/output/static out
```

**옵션 C**: npm 스크립트 사용
```bash
npm run pages:build
```

### 2. Build output directory

```
out
```

✅ **이미 설정되어 있고 변경 불가 - 그대로 유지**

### 3. Root directory

```
/
```

(비워두거나 `/`로 설정)

---

## 🔧 빌드 프로세스 설명

### 실제 동작 순서

```bash
# 1. @cloudflare/next-on-pages 실행
npx @cloudflare/next-on-pages
  ↓
# 내부적으로 next build 실행
next build → .next/ 생성
  ↓
# Cloudflare Workers 형식으로 변환
.vercel/output/static/ 생성
  ↓
# 2. out 디렉토리로 복사
rm -rf out
cp -r .vercel/output/static out
  ↓
# 3. Cloudflare Pages가 out/ 배포
✅ 배포 완료
```

### 왜 복사가 필요한가?

- `@cloudflare/next-on-pages` → `.vercel/output/static` 출력 (고정)
- Cloudflare Pages 설정 → `out` 디렉토리 기대 (변경 불가)
- **해결**: 빌드 후 자동으로 복사

---

## 📦 package.json 스크립트 구조

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "postbuild": "복사 명령어",
    "pages:build": "npx @cloudflare/next-on-pages && npm run postbuild"
  }
}
```

### 각 스크립트 설명

| 스크립트 | 용도 | 출력 |
|----------|------|------|
| `dev` | 로컬 개발 | - |
| `build` | 표준 Next.js 빌드 | `.next/` |
| `postbuild` | 빌드 후 복사 | `out/` |
| `pages:build` | Cloudflare 전용 빌드 | `out/` |

---

## 🧪 로컬 테스트

### 개발 서버
```bash
npm run dev
# http://localhost:3000
```

### Cloudflare Pages 빌드 테스트
```bash
npm run pages:build
# 결과: out/ 디렉토리 생성 확인
ls -la out/
```

### Cloudflare Pages 로컬 미리보기
```bash
npm run preview
# Wrangler로 out/ 디렉토리 서빙
```

---

## ✅ 설정 완료 체크리스트

### Cloudflare Pages 대시보드

- [x] Build command: `bash cloudflare-build.sh` (또는 `npm run pages:build`)
- [x] Build output directory: `out` (변경 불가)
- [x] Root directory: `/`

### 로컬 파일

- [x] `package.json`: `build` = `next build` (재귀 방지)
- [x] `package.json`: `pages:build` 추가
- [x] `wrangler.toml`: `pages_build_output_dir = "out"`
- [x] `cloudflare-build.sh`: 빌드 + 복사 스크립트
- [x] Git 커밋 및 푸시

---

## 🚀 배포 진행

### 1. 코드 푸시
```bash
git add .
git commit -m "fix: Configure build to output to 'out' directory"
git push origin main
```

### 2. Cloudflare Pages 자동 빌드
- GitHub 푸시 감지
- `bash cloudflare-build.sh` 실행
- `out/` 디렉토리 생성
- 배포 완료

### 3. 예상 빌드 로그
```
🚀 Building with @cloudflare/next-on-pages...
⚡️ @cloudflare/next-on-pages CLI v.1.13.16
⚡️ Building project...
✓ Build complete

📦 Copying build output to 'out' directory...
✅ Build complete! Output is in 'out' directory

Deploying...
✅ Deployment complete!
```

---

## 🔍 트러블슈팅

### ❌ 오류: "recursive invocation"

**원인**: `build` 스크립트에 `@cloudflare/next-on-pages` 포함

**해결**:
```json
// ❌ 잘못됨
"build": "npx @cloudflare/next-on-pages"

// ✅ 올바름
"build": "next build"
```

---

### ❌ 오류: "out directory not found"

**원인**: 복사 명령어 미실행

**해결**: Cloudflare 대시보드에서 Build command를:
```bash
bash cloudflare-build.sh
```
또는
```bash
npm run pages:build
```

---

### ❌ Functions 오류: "Cannot resolve..."

**이미 해결됨**: `functions/_lib/auth.ts` 사용

---

## 📊 디렉토리 구조

```
/home/user/webapp/
├── .next/                      # next build 출력
├── .vercel/output/static/      # @cloudflare/next-on-pages 출력
├── out/                        # Cloudflare Pages 배포용 (복사본)
├── functions/                  # Cloudflare Functions (API)
├── src/                        # Next.js 소스
├── cloudflare-build.sh         # 빌드 스크립트
├── package.json                # build = next build
└── wrangler.toml              # pages_build_output_dir = "out"
```

---

## 💡 핵심 요약

1. **Build output directory = `out`** (변경 불가, 그대로 유지)
2. **Build command = `bash cloudflare-build.sh`** (복사 포함)
3. `.vercel/output/static` → `out`으로 자동 복사
4. 이후 모든 배포는 자동

---

## 🎉 완료 후 확인

배포 성공 후 다음 기능을 테스트하세요:

- ✅ `/dashboard/admin/recipient-groups` - 수신자 그룹 목록
- ✅ `/dashboard/admin/recipient-groups/[id]` - 그룹 상세 (동적 라우트)
- ✅ 엑셀 업로드 (학부모 대량 등록)
- ✅ 학생-학부모 연결
- ✅ 치환문자 발송 (`{학부모명}`, `{학생명}`, etc.)
- ✅ `/dashboard/admin/sms/history` - 발송 이력
- ✅ 발송 이력 필터 및 엑셀 다운로드

**모든 SMS 기능이 정상 작동해야 합니다!** 🚀
