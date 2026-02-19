# 🚀 프로덕션 배포 설정 가이드

## 문제 상황
현재 프로덕션이 아닌 **미리보기 브랜치**로 계속 배포되고 있음

## ✅ 해결 방법

### 1단계: Cloudflare Pages 프로덕션 브랜치 변경

1. **Cloudflare Dashboard** 접속: https://dash.cloudflare.com
2. **Workers & Pages** 클릭
3. **superplacestudy** (또는 프로젝트 이름) 선택
4. **Settings** 탭 클릭
5. **Builds & deployments** 섹션으로 스크롤
6. **Production branch** 찾기
7. 현재 값을 **`main`**으로 변경
8. **Save** 클릭

### 2단계: 템플릿 자동 설치 API 사용

프로덕션 배포 후 **딱 한 번만** 실행:

#### 방법 A: curl 명령어 (터미널)
```bash
curl -X POST https://superplacestudy.pages.dev/api/setup/templates \
  -H "Content-Type: application/json" \
  -d '{"password":"setup-templates-2026"}'
```

#### 방법 B: Postman / Insomnia
- **Method**: POST
- **URL**: `https://superplacestudy.pages.dev/api/setup/templates`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "password": "setup-templates-2026"
}
```

#### 방법 C: 브라우저 콘솔
```javascript
fetch('https://superplacestudy.pages.dev/api/setup/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'setup-templates-2026' })
})
.then(r => r.json())
.then(console.log);
```

### 3단계: 확인

템플릿 페이지 접속하여 5개 템플릿이 보이는지 확인:
```
https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates
```

---

## 🔒 보안 중요!

**첫 실행 후 반드시 비밀번호 변경!**

`functions/api/setup/templates.ts` 파일에서:
```typescript
if (password !== "setup-templates-2026") {  // ← 이 부분을 변경
```

원하는 강력한 비밀번호로 변경 후 재배포하세요.

---

## 📋 예상 응답

### 성공 시:
```json
{
  "success": true,
  "message": "템플릿 5개 삽입 완료",
  "inserted": 5,
  "total": 5
}
```

### 이미 존재하는 경우:
```json
{
  "success": true,
  "message": "템플릿이 이미 5개 존재합니다.",
  "existing": 5
}
```

### 실패 시:
```json
{
  "success": false,
  "error": "오류 메시지"
}
```

---

## 🎯 전체 프로세스

1. ✅ Production branch를 `main`으로 변경
2. ✅ main 브랜치로 push (자동 배포 트리거)
3. ✅ 배포 완료 대기 (5-10분)
4. ✅ `/api/setup/templates` API 한 번 호출
5. ✅ 템플릿 페이지에서 5개 템플릿 확인
6. ✅ 비밀번호 변경 후 재배포

---

## 🔧 문제 해결

### Q: "Invalid password" 오류
**A**: 비밀번호가 틀렸거나 JSON 형식이 잘못됨. Body를 정확히 복사했는지 확인

### Q: "no such table" 오류
**A**: 스키마가 적용되지 않음. Cloudflare Dashboard에서 D1 Console로 이동하여 `cloudflare-worker/schema.sql` 내용 실행

### Q: 템플릿이 여전히 안 보임
**A**: 
1. 브라우저 캐시 삭제 (Ctrl+Shift+R)
2. `/debug-templates.html` 페이지에서 확인
3. Cloudflare Pages 배포 로그 확인

---

## 💡 자동화 (선택사항)

GitHub Actions로 자동화하려면 `.github/workflows/deploy.yml` 추가:

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - name: Setup templates (first time only)
        run: |
          curl -X POST https://superplacestudy.pages.dev/api/setup/templates \
            -H "Content-Type: application/json" \
            -d '{"password":"${{ secrets.TEMPLATE_SETUP_PASSWORD }}"}'
        continue-on-error: true
```

이렇게 하면 main 브랜치에 push할 때마다 자동으로 배포 및 템플릿 확인이 됩니다.
