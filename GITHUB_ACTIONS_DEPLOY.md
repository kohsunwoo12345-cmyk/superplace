# GitHub Actions로 Vercel 자동 배포 설정하기

## 🎯 목적

Vercel의 Git Integration이 작동하지 않을 때, GitHub Actions를 사용하여 자동 배포를 구현합니다.

---

## 📋 방법 1: Deploy Hook 사용 (간단함, 권장)

### Step 1: Vercel Deploy Hook 생성

1. **Vercel Dashboard 접속**
   ```
   https://vercel.com/dashboard
   ```

2. **superplace 프로젝트 선택**

3. **Settings → Git → Deploy Hooks**

4. **Create Hook 클릭**
   - Name: `GitHub Actions Trigger`
   - Git Branch to Deploy: `main` (또는 `genspark_ai_developer`)
   - Click "Create Hook"

5. **URL 복사**
   ```
   예시: https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy
   ```

### Step 2: GitHub Secret 설정

1. **GitHub 저장소 접속**
   ```
   https://github.com/kohsunwoo12345-cmyk/superplace
   ```

2. **Settings → Secrets and variables → Actions**

3. **New repository secret 클릭**
   - Name: `VERCEL_DEPLOY_HOOK_URL`
   - Value: (위에서 복사한 Deploy Hook URL 붙여넣기)
   - Click "Add secret"

### Step 3: GitHub Actions 활성화 확인

1. **저장소의 Actions 탭 확인**
   ```
   https://github.com/kohsunwoo12345-cmyk/superplace/actions
   ```

2. **"Trigger Vercel Deploy Hook" workflow 확인**

3. **테스트 푸시**
   ```bash
   git commit --allow-empty -m "test: GitHub Actions 배포 테스트"
   git push origin main
   ```

4. **Actions 탭에서 워크플로우 실행 확인**
   - 녹색 체크 표시 = 성공
   - Vercel Dashboard에서 배포 시작 확인

---

## 📋 방법 2: Vercel CLI 사용 (고급, 완전 제어)

### Step 1: Vercel 프로젝트 정보 가져오기

1. **로컬에서 Vercel CLI 로그인**
   ```bash
   npx vercel login
   ```

2. **프로젝트 링크**
   ```bash
   cd /home/user/webapp
   npx vercel link
   ```

3. **프로젝트 ID 확인**
   ```bash
   cat .vercel/project.json
   ```
   - `projectId` 값 복사
   - `orgId` 값 복사

### Step 2: Vercel Token 생성

1. **Vercel Dashboard → Account Settings**
   ```
   https://vercel.com/account/tokens
   ```

2. **Create Token**
   - Token Name: `GitHub Actions`
   - Scope: `Full Account`
   - Expiration: `No Expiration` (권장)
   - Click "Create"

3. **Token 복사** (한 번만 표시됨!)

### Step 3: GitHub Secrets 설정

1. **GitHub → Settings → Secrets → Actions**

2. **다음 3개 Secret 추가:**
   ```
   Name: VERCEL_TOKEN
   Value: (위에서 복사한 Vercel Token)
   
   Name: VERCEL_ORG_ID
   Value: (프로젝트의 orgId)
   
   Name: VERCEL_PROJECT_ID
   Value: (프로젝트의 projectId)
   ```

### Step 4: 배포 테스트

```bash
git commit --allow-empty -m "test: Vercel CLI 배포 테스트"
git push origin main
```

---

## 🔍 문제 해결

### GitHub Actions가 실행되지 않는 경우

1. **Actions 활성화 확인**
   ```
   GitHub → Settings → Actions → General
   → Allow all actions and reusable workflows
   ```

2. **Workflow 파일 위치 확인**
   ```bash
   ls -la .github/workflows/
   # vercel-deploy-hook.yml 파일이 있어야 함
   ```

3. **Workflow 파일 문법 확인**
   - GitHub → Actions 탭에서 에러 메시지 확인

### Deploy Hook이 작동하지 않는 경우

1. **URL 확인**
   - Secret에 저장된 URL이 정확한지 확인
   - `https://api.vercel.com/v1/integrations/deploy/...` 형식

2. **Hook 유효성 확인**
   ```bash
   curl -X POST "YOUR_DEPLOY_HOOK_URL"
   # 성공 시 Vercel에서 배포 시작됨
   ```

3. **Vercel Dashboard 확인**
   - Deploy Hook이 여전히 존재하는지 확인
   - 삭제되었다면 재생성

---

## 📊 배포 플로우

### Deploy Hook 방식:
```
1. 코드 푸시 (git push origin main)
   ↓
2. GitHub Actions 트리거
   ↓
3. Deploy Hook URL로 POST 요청
   ↓
4. Vercel이 배포 시작
   ↓
5. 2-3분 후 배포 완료
```

### Vercel CLI 방식:
```
1. 코드 푸시 (git push origin main)
   ↓
2. GitHub Actions 트리거
   ↓
3. Vercel CLI로 빌드
   ↓
4. 빌드된 파일을 Vercel에 업로드
   ↓
5. 배포 완료
```

---

## ✅ 확인 사항

### GitHub Actions 성공 확인:
```
□ Actions 탭에서 워크플로우가 녹색 체크 표시
□ 로그에서 "Vercel 배포가 트리거되었습니다!" 메시지 확인
□ Vercel Dashboard에서 새 배포 확인
```

### Vercel 배포 성공 확인:
```
□ Deployments 탭에서 최신 배포가 "Ready" 상태
□ 커밋 ID가 최신 커밋과 일치
□ 사이트에서 변경사항 반영됨
```

---

## 🎬 다음 단계

1. **Deploy Hook 생성** (Vercel Dashboard)
2. **GitHub Secret 설정** (VERCEL_DEPLOY_HOOK_URL)
3. **테스트 푸시** (git push)
4. **Actions 탭 확인** (녹색 체크)
5. **Vercel 배포 확인** (Deployments)
6. **사이트 접속** (캐시 삭제 후)

---

## 📝 참고

- **Deploy Hook**: 가장 간단하고 빠른 방법
- **Vercel CLI**: 더 많은 제어가 필요한 경우
- **두 가지 모두 사용 가능**: 백업으로 둘 다 설정 권장

---

**작성일**: 2026-02-02
**버전**: 1.0
