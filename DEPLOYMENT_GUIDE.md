# 🚀 Cloudflare Pages 배포 가이드

## 📌 `.vercel` 경로에 대한 설명

**질문**: Vercel을 전혀 사용하지 않는데 왜 `.vercel/output/static` 경로를 사용하나요?

**답변**: 
- `@cloudflare/next-on-pages`는 Cloudflare의 **공식** Next.js 어댑터입니다
- 이 도구는 역사적인 이유로 Vercel의 빌드 출력 형식을 재사용합니다
- `.vercel` 경로는 단순히 **빌드 출력 디렉토리 이름**일 뿐, Vercel 플랫폼과는 **전혀 관계없습니다**
- Cloudflare Pages에서 Next.js를 사용하는 **표준 방법**입니다

비유하자면: "USB 케이블"을 "Universal Serial Bus 케이블"이라고 부르지만, 실제로는 버스가 아닌 것처럼,  
`.vercel` 디렉토리도 단순히 빌드 출력 형식의 이름일 뿐입니다.

---

## ⚙️ Cloudflare Pages 대시보드 설정

### 필수 설정 변경

1. https://dash.cloudflare.com/ 접속
2. **Workers & Pages** → 프로젝트 선택 (superplacestudy 또는 superplace)
3. **Settings** → **Builds & deployments**
4. **Edit configuration** 클릭

### Build command 설정

```bash
npx @cloudflare/next-on-pages
```

또는

```bash
npm run pages:build
```

### Build output directory 설정

```
.vercel/output/static
```

### Root directory

```
/
```

(비워두거나 `/`로 설정)

### Framework preset

```
None
```

---

## 🔧 빌드 프로세스 설명

### 1. `npm run build` (로컬 개발용)
```bash
npm run build
→ next build
→ .next/ 디렉토리 생성 (표준 Next.js 빌드)
```

**용도**: 
- 로컬 개발 서버 (`npm run dev`)
- 표준 Node.js 환경에서 실행

### 2. `npx @cloudflare/next-on-pages` (Cloudflare 배포용)
```bash
npx @cloudflare/next-on-pages
→ next build 실행 (내부적으로)
→ Next.js 출력을 Cloudflare Workers 형식으로 변환
→ .vercel/output/static/ 디렉토리 생성
```

**용도**:
- Cloudflare Pages 배포
- Cloudflare Workers 런타임에서 실행
- Edge 컴퓨팅 최적화

### 3. 왜 두 개의 빌드 명령어가 있나요?

| 명령어 | 환경 | 출력 | 용도 |
|--------|------|------|------|
| `npm run build` | Node.js | `.next/` | 로컬 개발, 일반 서버 |
| `npx @cloudflare/next-on-pages` | Cloudflare Workers | `.vercel/output/static/` | Cloudflare Pages 배포 |

---

## 📦 로컬 테스트

### 표준 Next.js 개발 서버
```bash
npm run dev
# → http://localhost:3000
```

### Cloudflare Pages 로컬 미리보기
```bash
npm run preview
# → Cloudflare Workers 환경 시뮬레이션
# → http://localhost:8788
```

---

## 🚀 배포 방법

### 자동 배포 (권장)
```bash
git add .
git commit -m "..."
git push origin main
```
→ Cloudflare Pages가 자동으로 감지하여 빌드/배포

### 수동 배포 (로컬에서)
```bash
npm run deploy
```

---

## 🔍 트러블슈팅

### ❌ 오류: "Output directory '.vercel/output/static' not found"

**원인**: Cloudflare Pages가 `npm run build` 실행 (잘못됨)

**해결**: 대시보드에서 Build command를 `npx @cloudflare/next-on-pages`로 변경

---

### ❌ 오류: "vercel build must not recursively invoke itself"

**원인**: `build` 스크립트가 `@cloudflare/next-on-pages`를 호출하고,  
`@cloudflare/next-on-pages`가 다시 `npm run build`를 호출하여 무한 루프

**해결**: 
```json
// package.json
{
  "scripts": {
    "build": "next build",  // ✅ 단순히 next build만 실행
    "pages:build": "npx @cloudflare/next-on-pages"  // ✅ Cloudflare용 별도 명령어
  }
}
```

---

### ❌ 오류: "Cannot resolve '@prisma/client'"

**원인**: Cloudflare Functions에서 Prisma import 시도

**해결**: 이미 적용됨 (functions/_lib/auth.ts 사용)

---

## ✅ 체크리스트

배포 전 확인사항:

- [ ] Cloudflare 대시보드에서 Build command = `npx @cloudflare/next-on-pages`
- [ ] Build output directory = `.vercel/output/static`
- [ ] `package.json`의 `build` 스크립트 = `next build` (단순)
- [ ] `functions/` 디렉토리의 API들이 Prisma 대신 D1 사용
- [ ] Git에 커밋 및 푸시 완료

---

## 📚 참고 자료

- [Cloudflare Pages - Deploy a Next.js site](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [@cloudflare/next-on-pages GitHub](https://github.com/cloudflare/next-on-pages)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-nextjs-site/)

---

## 💡 요약

1. `.vercel` 경로는 Cloudflare의 공식 Next.js 어댑터가 사용하는 **표준 빌드 출력 형식**입니다
2. Vercel 플랫폼과는 **전혀 관계없습니다**
3. Cloudflare Pages 대시보드에서 Build command만 `npx @cloudflare/next-on-pages`로 설정하면 됩니다
4. 이후 모든 배포는 자동으로 진행됩니다

**지금 대시보드에서 설정 변경 → 재배포 → 완료!** 🎉
