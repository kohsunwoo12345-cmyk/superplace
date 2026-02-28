# ⚠️ 긴급: Cloudflare Pages Dashboard 설정 필수 변경

## 🔴 현재 상태: 배포 실패

모든 페이지에서 CSS 404 오류와 "Application error" 발생 중

### 원인
Cloudflare Pages 대시보드의 **Build output directory** 설정이 여전히 `out`으로 되어 있음

### 즉시 해야 할 작업

#### 1. Cloudflare Pages Dashboard 접속
```
https://dash.cloudflare.com/
→ Pages
→ superplacestudy
→ Settings
→ Builds & deployments
```

#### 2. Build Configuration 변경

**현재 (잘못된 설정):**
```
Framework preset: Next.js (Static HTML Export)
Build command: bash cloudflare-build.sh
Build output directory: out
```

**변경 후 (올바른 설정):**
```
Framework preset: None
Build command: bash cloudflare-build.sh
Build output directory: .vercel/output/static
```

⚠️ **중요**: `Build output directory`를 **반드시** `.vercel/output/static`으로 변경해야 합니다!

#### 3. 저장 후 재배포

"Save" 버튼 클릭 → "Retry deployment" 클릭

---

## 📊 설정 체크리스트

- [ ] **Build output directory**: `out` → `.vercel/output/static` ✅ **이것이 핵심!**
- [ ] **Framework preset**: `Next.js (Static HTML Export)` → `None`
- [ ] **Build command**: `bash cloudflare-build.sh` (변경 없음)
- [ ] **Node version**: `20` 이상

---

## 🔍 확인 방법

### 설정 변경이 올바르게 적용되었는지 확인:

1. **Build Log 확인**
   ```
   ✅ Build completed successfully!
   📁 Build output directory: .vercel/output/static/
   ✅ .vercel/output/static directory created successfully
   ```

2. **배포 후 테스트**
   ```bash
   # 메인 페이지 (200 OK가 나와야 함)
   curl -I https://superplacestudy.pages.dev/
   
   # CSS 파일 (200 OK가 나와야 함)
   curl -I https://superplacestudy.pages.dev/_next/static/css/...
   ```

---

## 💡 왜 이 문제가 발생했나?

### 이전 설정 (실패):
```
next.config.ts: output: 'export'
→ 빌드 출력: out/
→ Cloudflare Pages: out/ 디렉토리 찾음 ✅
→ 하지만: API Routes 작동 안 함 ❌
```

### 현재 설정 (수정 필요):
```
next.config.ts: @cloudflare/next-on-pages 사용
→ 빌드 출력: .vercel/output/static/
→ Cloudflare Pages: 여전히 out/ 찾음 ❌
→ 결과: 모든 파일 404 오류 ❌
```

### 수정 후 (정상):
```
next.config.ts: @cloudflare/next-on-pages 사용
→ 빌드 출력: .vercel/output/static/
→ Cloudflare Pages: .vercel/output/static/ 찾음 ✅
→ 결과: 모든 페이지 + API Routes 정상 작동 ✅
```

---

## 📝 관련 커밋

| 커밋 | 설명 | 상태 |
|------|------|------|
| `910bb59` | next.config.ts 수정 (output: 'export' 제거) | ✅ 완료 |
| `9fe9e73` | 문서 추가 | ✅ 완료 |
| `d3b92d7` | cloudflare-build.sh 수정 | ✅ 완료 |
| - | **Cloudflare Dashboard 설정 변경** | ⚠️ **대기 중** |

---

## 🎯 다음 단계

1. ✅ 코드 수정 완료 (커밋 `d3b92d7`)
2. ⚠️ **Cloudflare Dashboard에서 출력 디렉토리 변경** ← **지금 해야 함**
3. ⏳ 재배포 대기 (약 2-3분)
4. ✅ 정상 작동 확인

---

## 🆘 문제 해결이 안 될 경우

### 대안 1: 수동으로 wrangler.toml 우선순위 강제
```bash
# Cloudflare Dashboard에서 Build command를 다음으로 변경:
npm run pages:build && echo "Output: .vercel/output/static"
```

### 대안 2: package.json에 pages:deploy 스크립트 사용
```bash
# Local에서 직접 배포:
npm run deploy
```

---

**⚡ 핵심 요약**: Cloudflare Pages Dashboard → Settings → **Build output directory를 `.vercel/output/static`으로 변경** → Save & Retry deployment
