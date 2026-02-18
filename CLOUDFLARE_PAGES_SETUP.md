# 🚀 Cloudflare Pages 배포 설정 가이드

## ⚠️ **중요: 지금 바로 설정을 변경해야 합니다!**

현재 Cloudflare Pages가 **잘못된 빌드 명령어**를 사용하고 있어 배포가 실패합니다.

---

## 📋 문제 상황

**현재 상태:**
```
Build command: npm run build (❌ 잘못됨)
Output directory: .vercel/output/static
```

**증상:**
- Next.js 빌드는 성공하지만 `.next` 디렉토리 생성
- Cloudflare는 `.vercel/output/static` 디렉토리를 찾지 못함
- 배포 실패: "Output directory not found"

---

## ✅ 해결 방법

### 1. Cloudflare Pages 대시보드 접속

1. https://dash.cloudflare.com/ 열기
2. **Workers & Pages** 클릭
3. **superplacestudy** (또는 superplace) 프로젝트 선택

### 2. 빌드 설정 변경

1. 왼쪽 메뉴에서 **Settings** 클릭
2. **Builds & deployments** 섹션 찾기
3. **Edit configuration** 버튼 클릭

### 3. 다음과 같이 설정

**Build command** (필수 변경):
```bash
npx @cloudflare/next-on-pages
```

**Build output directory** (확인):
```
.vercel/output/static
```

**Root directory** (비워두거나):
```
/
```

**Framework preset**:
```
None
```

### 4. 저장 및 재배포

1. **Save** 버튼 클릭
2. **Deployments** 탭으로 이동
3. **Retry deployment** 클릭하거나 새로운 커밋 푸시

---

## 🔍 왜 이렇게 해야 하나요?

### 빌드 명령어 비교

| 명령어 | 출력 디렉토리 | 용도 |
|--------|--------------|------|
| `npm run build` | `.next/` | Next.js 표준 빌드 ❌ |
| `npx @cloudflare/next-on-pages` | `.vercel/output/static` | Cloudflare Pages 빌드 ✅ |

### `@cloudflare/next-on-pages`의 역할

이 도구는:
1. 내부적으로 `next build`를 실행
2. Next.js 출력을 Cloudflare Pages 형식으로 변환
3. `.vercel/output/static` 디렉토리에 배포 가능한 파일 생성
4. Functions와 Pages를 통합

---

## 📦 package.json 스크립트 구조

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",                    // ← 표준 Next.js 빌드
    "pages:build": "npx @cloudflare/next-on-pages", // ← Cloudflare 빌드
    "preview": "npm run pages:build && wrangler pages dev .vercel/output/static",
    "deploy": "npm run pages:build && wrangler pages deploy .vercel/output/static --project-name=superplacestudy"
  }
}
```

### 왜 분리되어 있나요?

- `build`: 로컬 개발 및 일반 Next.js 빌드용
- `pages:build`: Cloudflare Pages 전용 빌드
- `@cloudflare/next-on-pages`는 내부에서 `npm run build`를 호출
- 만약 `build` 스크립트가 `@cloudflare/next-on-pages`를 호출하면 **무한 재귀 오류** 발생

---

## 🧪 로컬 테스트

변경 후 로컬에서 테스트하려면:

```bash
# Cloudflare Pages 빌드 테스트
npm run pages:build

# 출력 확인
ls -la .vercel/output/static

# 로컬 미리보기
npm run preview
```

---

## ✅ 변경 후 확인사항

배포가 성공하면 다음을 확인하세요:

1. ✅ Build log에서 `@cloudflare/next-on-pages` 실행 확인
2. ✅ `.vercel/output/static` 디렉토리 생성 확인
3. ✅ Functions 빌드 성공 확인
4. ✅ Deployment 성공 메시지 확인

---

## 🚨 주의사항

### ❌ 하지 말아야 할 것

```bash
# Cloudflare Pages 대시보드에서:
npm run build  # ❌ 잘못됨 - .next/ 생성
next build     # ❌ 잘못됨 - .next/ 생성
```

### ✅ 올바른 설정

```bash
# Cloudflare Pages 대시보드에서:
npx @cloudflare/next-on-pages  # ✅ 정확함 - .vercel/output/static 생성
npm run pages:build             # ✅ 정확함 (위와 동일)
```

---

## 📚 추가 참고자료

- [Cloudflare Next.js Guide](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [@cloudflare/next-on-pages GitHub](https://github.com/cloudflare/next-on-pages)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## 💡 요약

1. **Cloudflare Pages 대시보드 → Settings → Builds & deployments**
2. **Build command를 `npx @cloudflare/next-on-pages`로 변경**
3. **Save 후 재배포**
4. **2-3분 후 배포 성공 확인**

이 변경만 하면 모든 SMS 기능(수신자 그룹, 엑셀 업로드, 발송 이력, 치환문자)이 정상 작동합니다! 🎉
