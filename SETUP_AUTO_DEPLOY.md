# 🎯 완전 자동 배포 설정 - 단 한 번만 하면 됩니다!

## 📋 해야 할 일 (10분)

### 1단계: Vercel 토큰 발급 받기 (3분)

#### 1. Vercel 웹사이트 접속
```
https://vercel.com/account/tokens
```

#### 2. 로그인

#### 3. "Create Token" 버튼 클릭

#### 4. 토큰 정보 입력:
- **Token Name**: `GitHub Actions`
- **Scope**: `Full Account` 선택
- **Expiration**: `No Expiration` 선택

#### 5. "Create" 버튼 클릭

#### 6. ⚠️ **중요!** 토큰이 화면에 나타납니다!
```
예: vercel_abc123xyz456def789ghi012jkl345mno678pqr901stu234vwx567yza890
```
**이 토큰을 복사하세요! (다시 볼 수 없습니다)**

---

### 2단계: GitHub에 토큰 저장 (2분)

#### 1. GitHub 저장소 설정 페이지 접속
```
https://github.com/kohsunwoo12345-cmyk/superplace/settings/secrets/actions
```

#### 2. "New repository secret" 버튼 클릭 (초록색)

#### 3. Secret 정보 입력:
- **Name**: `VERCEL_TOKEN` (정확히 이렇게!)
- **Value**: 방금 복사한 Vercel 토큰 붙여넣기

#### 4. "Add secret" 버튼 클릭

---

### 3단계: Vercel 프로젝트 ID 확인 (2분)

#### 1. Vercel Dashboard 접속
```
https://vercel.com/dashboard
```

#### 2. `superplace` 또는 `superplace-study` 프로젝트 클릭

#### 3. "Settings" 탭 클릭

#### 4. 왼쪽 메뉴에서 "General" 클릭

#### 5. **Project ID** 찾기 (화면 중간 정도)
```
예: prj_abc123xyz456
```
**이것을 복사하세요!**

---

### 4단계: Vercel Org ID 확인 (1분)

같은 Settings 페이지에서:

#### **Team ID** 또는 **Org ID** 찾기
```
예: team_abc123xyz456
```
**이것도 복사하세요!**

---

### 5단계: GitHub에 Vercel 정보 저장 (2분)

다시 GitHub Secrets 페이지로:
```
https://github.com/kohsunwoo12345-cmyk/superplace/settings/secrets/actions
```

#### Secret 2개 더 추가:

1. **VERCEL_PROJECT_ID**
   - Name: `VERCEL_PROJECT_ID`
   - Value: (복사한 Project ID 붙여넣기)

2. **VERCEL_ORG_ID**
   - Name: `VERCEL_ORG_ID`
   - Value: (복사한 Team/Org ID 붙여넣기)

---

## ✅ 설정 완료 확인

GitHub Secrets 페이지에 이 3개가 있어야 합니다:
- ✅ `VERCEL_TOKEN`
- ✅ `VERCEL_PROJECT_ID`
- ✅ `VERCEL_ORG_ID`

---

## 🎉 완료!

이제부터는:

```bash
git push
```

**이것만 하면 자동으로 Production 배포됩니다!**

---

## 💡 어디서 확인하나요?

### 배포 진행 상황:
```
https://github.com/kohsunwoo12345-cmyk/superplace/actions
```

### 배포 완료 후:
```
https://superplace-study.vercel.app
```

---

## 📸 스크린샷으로 보기

### Vercel 토큰 생성 화면:
1. https://vercel.com/account/tokens
2. "Create Token" 버튼이 보입니다
3. 클릭 → 정보 입력 → Create

### GitHub Secrets 화면:
1. https://github.com/kohsunwoo12345-cmyk/superplace/settings/secrets/actions
2. "New repository secret" 버튼 (초록색)
3. Name과 Value 입력 → Add secret

### Vercel Project Settings:
1. https://vercel.com/dashboard
2. 프로젝트 클릭 → Settings → General
3. "Project ID"와 "Team ID" 섹션 찾기

---

## ❓ 막히는 부분이 있나요?

어느 단계에서 막히셨는지 알려주시면:
- 스크린샷으로 더 자세히 설명
- 단계별로 천천히 진행

**이 설정만 완료하면 진짜로 자동 배포됩니다!** 🎉
