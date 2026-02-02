# 🚀 완전 자동 배포 가이드

## 현재 상황

- ✅ GitHub Actions가 이미 자동 배포 중
- ✅ Deploy Hook으로 Vercel 빌드 트리거
- ⏳ **하지만**: Preview 배포만 되고 Production으로 자동 승격 안 됨

## 해결 방법 (한 번만 설정)

### 옵션 1: Vercel Production Branch 설정 (권장) ⭐

**이렇게 하면 앞으로 push만 해도 자동으로 Production 배포됩니다!**

1. **Vercel Dashboard 접속**:
   ```
   https://vercel.com/dashboard
   ```

2. **superplace 프로젝트 선택**

3. **Settings** 탭 클릭

4. **Git** 메뉴 클릭

5. **Production Branch** 확인:
   - 현재: `genspark_ai_developer` (또는 다른 브랜치)
   - **변경**: `main` 또는 `genspark_ai_developer` 중 원하는 브랜치

6. **Save** 클릭

7. **완료!** 🎉

이제부터 해당 브랜치에 push하면 **자동으로 Production 배포**됩니다!

---

### 옵션 2: Deploy Hook 설정 변경

현재 Deploy Hook이 Preview만 생성하도록 설정되어 있을 수 있습니다.

1. **Vercel Dashboard** → **Settings** → **Git** → **Deploy Hooks**

2. 기존 Hook 확인:
   - Branch: `genspark_ai_developer`
   - 삭제 후 재생성

3. **Create Hook** 클릭:
   - Hook Name: `Auto Deploy`
   - Git Branch: `main` 또는 `genspark_ai_developer`
   - **Save**

4. **GitHub Secrets 업데이트**:
   ```
   https://github.com/kohsunwoo12345-cmyk/superplace/settings/secrets/actions
   ```
   - `VERCEL_DEPLOY_HOOK_URL`을 새 Hook URL로 업데이트

---

### 옵션 3: Vercel GitHub Integration 사용 (가장 간단)

**가장 권장하는 방법입니다!**

1. **Vercel Dashboard** → **Settings** → **Git**

2. **Git Integration** 섹션:
   - 현재 연결 상태 확인
   - "Disconnect" 후 "Connect" 재시도 (필요시)

3. **GitHub 저장소 선택**:
   - `kohsunwoo12345-cmyk/superplace`

4. **Production Branch 설정**:
   - `main` 선택

5. **완료!**

이제 `main` 브랜치에 push하면 **자동으로 Production 배포**됩니다!

---

## 설정 후 사용 방법

### 완전 자동 배포 (Production Branch 설정 후)

```bash
# 코드 수정 후
cd /home/user/webapp

# 커밋 & 푸시만 하면 끝!
git add .
git commit -m "작업 내용"
git push origin main

# 또는 스크립트 사용
./deploy.sh "작업 내용"
```

**결과**:
1. ✅ GitHub에 push
2. ✅ GitHub Actions 자동 실행
3. ✅ Vercel Deploy Hook 트리거
4. ✅ **자동으로 Production 배포** 🎉

**수동 작업 필요 없음!**

---

### 현재 방법 (Production Branch 미설정)

```bash
# 1. 코드 수정 & 배포
./deploy.sh "작업 내용"

# 2. Vercel Dashboard에서 수동 승격
# https://vercel.com/dashboard → Promote to Production
```

---

## 확인 방법

### Production Branch 설정 확인

1. Vercel Dashboard → Settings → Git
2. **Production Branch** 항목 확인
3. `main` 또는 `genspark_ai_developer`가 설정되어 있는지 확인

### 자동 배포 테스트

```bash
# 1. 간단한 변경사항 만들기
echo "# Test" >> README.md

# 2. 커밋 & 푸시
git add README.md
git commit -m "test: 자동 배포 테스트"
git push origin main

# 3. Vercel Dashboard 확인
# https://vercel.com/dashboard
# → Deployments 탭에서 새 배포가 "Production"으로 표시되는지 확인
```

---

## 🎯 권장 워크플로우

### 1단계: Production Branch 설정 (한 번만) ⭐
```
Vercel Dashboard → Settings → Git → Production Branch = main
```

### 2단계: 앞으로 배포
```bash
./deploy.sh "작업 내용"
# 또는
git add . && git commit -m "작업 내용" && git push origin main
```

### 3단계: 자동 배포 완료! 🎉
- GitHub Actions 자동 실행
- Vercel 자동 빌드
- **Production 자동 배포**
- 수동 작업 불필요!

---

## 💡 요약

### 현재 상태
- ✅ GitHub Actions 작동 중
- ✅ Vercel 빌드 자동화
- ⚠️ Preview만 생성, Production 수동 승격 필요

### 해결책
**Vercel Production Branch를 `main`으로 설정**

### 설정 후
- 🚀 `git push origin main` = 자동 Production 배포
- 🎉 수동 작업 불필요
- ⏱️ 배포 시간: 2-3분

---

## 📞 문제 해결

### "여전히 Preview만 생성됨"
→ Production Branch 설정 재확인

### "배포가 시작되지 않음"
→ GitHub Actions 로그 확인
→ Deploy Hook URL 재확인

### "권한 오류"
→ GitHub Integration 재연결
→ Vercel 프로젝트 권한 확인

---

**Production Branch 설정만 하면 완전 자동 배포 완성!** 🎉
