# 🔐 API 키 보안 가이드

**작성일**: 2026-01-22  
**중요도**: 🚨 매우 높음

---

## ⚠️ 긴급 보안 사고 대응 완료

### 발생 사항
- **문제**: Google Gemini API 키가 코드 및 문서에 하드코딩되어 GitHub에 노출됨
- **영향**: API 키 유출로 인한 무단 사용 가능성
- **조치**: 즉시 API 키 제거 및 환경 변수로 전환 완료

### 수행한 보안 조치
1. ✅ 모든 하드코딩된 API 키 제거
2. ✅ `process.env.GOOGLE_GEMINI_API_KEY` 환경 변수로 교체
3. ✅ 문서 파일에서 실제 API 키 제거 (예시로 변경)
4. ✅ `.gitignore`에 추가 보안 항목 추가
5. ✅ 테스트 파일 보안 강화

---

## 🔑 API 키 안전하게 사용하기

### ✅ DO (해야 할 것)

1. **환경 변수 사용**
   ```javascript
   // ✅ 올바른 방법
   const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
   ```

2. **.env 파일에 저장**
   ```bash
   # .env 파일
   GOOGLE_GEMINI_API_KEY=YOUR_API_KEY_HERE
   GEMINI_API_KEY=YOUR_API_KEY_HERE
   ```

3. **.gitignore에 추가 확인**
   ```gitignore
   .env
   .env*.local
   .env.development
   .env.production
   **/*.key
   **/*.secret
   ```

4. **Vercel 환경 변수 설정**
   - Vercel Dashboard → Settings → Environment Variables
   - Production, Preview, Development 모두 설정

### ❌ DON'T (하지 말아야 할 것)

1. **코드에 직접 작성 금지**
   ```javascript
   // ❌ 절대 이렇게 하지 마세요!
   const API_KEY = 'AIzaSy...';
   ```

2. **문서에 실제 키 작성 금지**
   ```markdown
   ❌ API Key: AIzaSyAAu9N0kySmg_AAQZ6huNqIuc-aCykYSaw
   ✅ API Key: YOUR_GOOGLE_GEMINI_API_KEY_HERE
   ```

3. **Git에 커밋 금지**
   - `.env` 파일은 절대 커밋하지 마세요
   - `.env.example` 파일만 커밋하세요

---

## 🚨 API 키 유출 시 대응 절차

### 1단계: 즉시 조치 (5분 이내)
1. **기존 API 키 폐기**
   - Google AI Studio (https://aistudio.google.com/app/apikey)
   - 노출된 API 키 즉시 삭제

2. **새 API 키 발급**
   - 새로운 API 키 생성
   - 안전하게 저장

### 2단계: 코드 정리 (10분 이내)
1. **하드코딩된 키 제거**
   ```bash
   grep -r "AIza" . --include="*.js" --include="*.ts"
   ```

2. **환경 변수로 교체**
   - 모든 API 키를 `process.env`로 변경

3. **문서 수정**
   - 실제 키를 예시 문자열로 변경

### 3단계: Git 히스토리 정리 (선택사항)
```bash
# 주의: 협업 시 팀원과 협의 필요
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/file" \
  --prune-empty --tag-name-filter cat -- --all
```

### 4단계: 재배포
1. Vercel 환경 변수 업데이트
2. 새 API 키로 재배포
3. 로그 확인

---

## 📋 현재 프로젝트 API 키 사용 현황

### ✅ 안전하게 처리된 파일
- `src/app/api/ai/chat/route.ts` - ✅ 환경 변수 사용
- `test-gemini-direct.js` - ✅ 환경 변수 사용
- `test-final-gemini.js` - ✅ 환경 변수로 수정 완료
- `test-simple-model.js` - ✅ 환경 변수로 수정 완료

### 📄 문서 파일
- `DEPLOYMENT_GUIDE.md` - ✅ 예시 문자열로 변경
- `VERCEL_QUICK_START.md` - ✅ 예시 문자열로 변경
- `VERCEL_ENV_FIX.md` - ✅ 예시 문자열로 변경
- `VERCEL_ENV_SETUP.md` - ✅ 예시 문자열로 변경
- `AI_CHATBOT_TEST_REPORT.md` - ✅ 예시 문자열로 변경

---

## 🔧 로컬 개발 환경 설정

### .env 파일 생성
```bash
# /home/user/webapp/.env
GOOGLE_GEMINI_API_KEY=YOUR_NEW_API_KEY_HERE
GEMINI_API_KEY=YOUR_NEW_API_KEY_HERE
```

### 테스트 실행
```bash
# API 키 환경 변수 설정
export GOOGLE_GEMINI_API_KEY=YOUR_NEW_API_KEY_HERE

# 테스트 실행
node test-final-gemini.js
node test-simple-model.js
```

---

## 🌐 Vercel 프로덕션 환경 설정

### 환경 변수 추가
1. Vercel Dashboard: https://vercel.com/kohsunwoo12345-cmyk/superplace/settings/environment-variables
2. 추가할 변수:
   - Name: `GOOGLE_GEMINI_API_KEY`
   - Value: `YOUR_NEW_API_KEY_HERE`
   - Environment: Production, Preview, Development

### 재배포
1. Deployments 탭
2. 최신 배포 → ••• → Redeploy
3. ✅ "Use existing Build Cache" 체크 해제
4. Redeploy 클릭

---

## 📚 참고 자료

### Google Gemini API
- API 키 관리: https://aistudio.google.com/app/apikey
- 공식 문서: https://ai.google.dev/docs

### Best Practices
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)

---

## ✅ 체크리스트

배포 전 반드시 확인하세요:

- [ ] 코드에 하드코딩된 API 키 없음
- [ ] `.env` 파일이 `.gitignore`에 포함됨
- [ ] 문서에 실제 API 키 없음 (예시만 표시)
- [ ] Vercel 환경 변수 설정 완료
- [ ] 로컬 테스트 성공
- [ ] Git 히스토리에 API 키 없음

---

## 🆘 도움이 필요하신가요?

문제가 발생하면:
1. 이 문서를 먼저 확인하세요
2. `.env` 파일이 올바른 위치에 있는지 확인
3. Vercel 환경 변수가 모든 환경에 설정되었는지 확인

---

**중요**: 이 문서는 보안 사고 대응 및 예방을 위한 가이드입니다.  
**항상 API 키를 안전하게 보관하세요!** 🔐
