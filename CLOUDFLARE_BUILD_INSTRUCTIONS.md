# Cloudflare Pages 빌드 설정

## ⚠️ 중요: 빌드 명령어 설정

Cloudflare Pages 대시보드에서 다음과 같이 설정해야 합니다:

### 빌드 설정

1. **Cloudflare Pages 대시보드** 접속
   - https://dash.cloudflare.com/
   - Workers & Pages → `superplacestudy` 프로젝트 선택

2. **Settings → Builds & deployments** 이동

3. **Build command** 설정:
   ```bash
   npx @cloudflare/next-on-pages
   ```
   또는
   ```bash
   npm run pages:build
   ```

4. **Build output directory** 설정:
   ```
   .vercel/output/static
   ```

5. **Root directory** (선택사항):
   ```
   /
   ```

6. **Framework preset**: 
   - `None` 또는 `Next.js` 선택 (자동 감지)

## 🚫 주의사항

### ❌ 잘못된 설정
```bash
# 이렇게 설정하면 무한 재귀 오류 발생!
npm run build  # ❌ 사용하지 마세요
```

### ✅ 올바른 설정
```bash
npx @cloudflare/next-on-pages  # ✅ 이것 사용
npm run pages:build             # ✅ 또는 이것 사용
```

## 📝 스크립트 설명

### package.json scripts:
- `npm run build` → `next build` (Next.js 표준 빌드)
- `npm run pages:build` → `npx @cloudflare/next-on-pages` (Cloudflare Pages 빌드)
- `npm run deploy` → 빌드 후 Cloudflare Pages에 배포

### 왜 분리했나요?
`@cloudflare/next-on-pages`는 내부적으로 `npm run build`를 호출합니다.
만약 `build` 스크립트가 다시 `@cloudflare/next-on-pages`를 호출하면 
**무한 재귀 오류**가 발생합니다.

## 🔧 로컬 개발

```bash
# 개발 서버
npm run dev

# Cloudflare Pages 로컬 미리보기
npm run preview

# 로컬에서 Cloudflare Pages 빌드
npm run pages:build
```

## 📦 배포 프로세스

1. **자동 배포** (GitHub 푸시 시):
   - main 브랜치에 푸시하면 자동으로 Cloudflare Pages가 빌드/배포

2. **수동 배포** (로컬에서):
   ```bash
   npm run deploy
   ```

## 🛠️ 트러블슈팅

### 오류: "vercel build must not recursively invoke itself"
→ Cloudflare Pages의 빌드 명령을 `npx @cloudflare/next-on-pages`로 변경하세요.

### 오류: "generateStaticParams() missing"
→ `next.config.ts`에서 `output: 'export'`를 제거했는지 확인하세요.

### 빌드 출력 디렉토리가 없음
→ `wrangler.toml`의 `pages_build_output_dir`이 `.vercel/output/static`인지 확인하세요.

## 📚 참고 문서

- [Cloudflare Pages - Next.js](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)
- [Next.js 공식 문서](https://nextjs.org/docs)
