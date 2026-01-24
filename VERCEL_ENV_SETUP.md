# 🔐 Vercel 환경 변수 설정 가이드

**작성일**: 2026-01-24  
**중요도**: 🚨 **매우 중요** - 음성 기능 작동을 위해 필수!

## 📋 개요

음성 기능(STT/TTS)이 작동하려면 **OpenAI API 키**를 Vercel 환경 변수에 설정해야 합니다.

## ⚠️ 필수 환경 변수

### `OPENAI_API_KEY`

**용도**: OpenAI Whisper (STT) 및 TTS API 호출에 사용

**형식**: `sk-proj-...` (OpenAI API 키)

## 🔧 Vercel 환경 변수 설정 방법

### 1️⃣ Vercel 대시보드 접속

1. 브라우저에서 https://vercel.com/dashboard 접속
2. GitHub 계정으로 로그인

### 2️⃣ 프로젝트 선택

1. 대시보드에서 **`superplace-study`** 프로젝트 클릭
2. 또는 직접 접속: https://vercel.com/kohsunwoo12345-cmyk/superplace-study

### 3️⃣ 환경 변수 메뉴 접속

1. 상단 탭에서 **Settings** 클릭
2. 좌측 사이드바에서 **Environment Variables** 선택

### 4️⃣ 환경 변수 추가

#### 방법 A: 웹 UI 사용
1. **Key** 입력란에 `OPENAI_API_KEY` 입력
2. **Value** 입력란에 OpenAI API 키 입력 (예: `sk-proj-...`)
3. **Environment** 선택:
   - ✅ **Production** 체크
   - ✅ **Preview** 체크
   - ✅ **Development** 체크
4. **Save** 버튼 클릭

#### 방법 B: Vercel CLI 사용
```bash
# Vercel CLI 설치 (처음 한 번만)
npm install -g vercel

# 로그인
vercel login

# 환경 변수 추가
vercel env add OPENAI_API_KEY
# 값 입력: sk-proj-...
# 환경 선택: Production, Preview, Development
```

### 5️⃣ 재배포 (Redeploy)

환경 변수를 추가한 후 **반드시 재배포**해야 적용됩니다:

#### 방법 A: Vercel 대시보드
1. **Deployments** 탭 클릭
2. 최신 배포 항목 찾기
3. 우측 **"..."** 메뉴 클릭
4. **Redeploy** 선택
5. **Redeploy** 버튼 클릭하여 확인

#### 방법 B: Git Push
```bash
# 새 커밋 푸시하면 자동으로 재배포됨
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

#### 방법 C: Vercel CLI
```bash
vercel --prod
```

## 🔍 설정 확인 방법

### 1️⃣ Vercel 대시보드에서 확인
1. Settings → Environment Variables 메뉴
2. `OPENAI_API_KEY` 항목이 표시되는지 확인
3. 값은 `sk-proj-••••••••••••` 형태로 마스킹되어 표시됨

### 2️⃣ 로그에서 확인
1. Vercel 대시보드 → Deployments 탭
2. 최신 배포 클릭 → **Runtime Logs** 탭
3. 음성 API 호출 시 로그 확인:
   ```
   ✅ OpenAI API 호출 성공
   ```
   또는 오류 발생 시:
   ```
   ❌ OpenAI API 오류: Incorrect API key provided
   ```

### 3️⃣ 실제 테스트
1. 프로덕션 사이트 접속: https://superplace-study.vercel.app
2. 관리자 계정으로 로그인
3. 음성 입력이 활성화된 봇 채팅 페이지 접속
4. 마이크 버튼 클릭 → 음성 녹음 → 텍스트 변환 확인
5. 봇 응답 후 자동 음성 재생 확인

## 🚨 문제 해결

### 문제 1: "OpenAI API 키가 설정되지 않았습니다"
**원인**: 환경 변수가 설정되지 않았거나 재배포하지 않음

**해결**:
1. Vercel 대시보드에서 환경 변수 확인
2. 없으면 위 방법대로 추가
3. **반드시 재배포** (Redeploy)

### 문제 2: "Incorrect API key provided"
**원인**: 잘못된 API 키 또는 만료된 키

**해결**:
1. OpenAI 대시보드에서 API 키 확인: https://platform.openai.com/api-keys
2. 새 API 키 생성
3. Vercel 환경 변수 업데이트
4. 재배포

### 문제 3: "You exceeded your current quota"
**원인**: OpenAI API 사용량 한도 초과

**해결**:
1. OpenAI 대시보드에서 사용량 확인: https://platform.openai.com/usage
2. 결제 방법 추가: https://platform.openai.com/account/billing
3. 크레딧 충전 또는 사용량 제한 늘리기

### 문제 4: 환경 변수가 적용되지 않음
**원인**: 재배포하지 않았거나 캐시 문제

**해결**:
1. **Hard Refresh**: Ctrl + Shift + R (Windows) / Cmd + Shift + R (Mac)
2. **시크릿 모드**로 테스트
3. Vercel CLI로 강제 재배포:
   ```bash
   vercel --prod --force
   ```

## 💰 OpenAI API 비용

### Whisper (STT) - 음성 → 텍스트
- **가격**: $0.006 / 분
- **예시**: 1분 녹음 = $0.006

### TTS - 텍스트 → 음성
- **tts-1** (표준): $0.015 / 1,000자
- **tts-1-hd** (고품질): $0.030 / 1,000자
- **예시**: 500자 응답 = $0.0075 (표준) / $0.015 (HD)

### 예상 월간 비용
**가정**: 하루 50회 대화, 평균 1분 음성 입력 + 500자 응답
- STT: 50 × 1분 × $0.006 × 30일 = **$9/월**
- TTS: 50 × 500자 × $0.015 / 1000 × 30일 = **$11.25/월**
- **총합**: 약 **$20~25/월**

## 📖 OpenAI API 키 생성 방법

### 1️⃣ OpenAI 계정 생성
1. https://platform.openai.com 접속
2. **Sign Up** 클릭
3. 이메일 또는 Google/Microsoft 계정으로 가입

### 2️⃣ 결제 방법 추가 (필수)
1. 좌측 메뉴에서 **Settings** → **Billing** 클릭
2. **Add payment method** 클릭
3. 신용카드 정보 입력
4. (선택) 크레딧 충전 (최소 $5)

### 3️⃣ API 키 생성
1. 좌측 메뉴에서 **API keys** 클릭
2. **Create new secret key** 클릭
3. 키 이름 입력 (예: `SuperPlace Voice API`)
4. 권한 설정:
   - ✅ `audio.transcribe` (Whisper)
   - ✅ `audio.speech` (TTS)
5. **Create secret key** 클릭
6. 생성된 키 복사 (한 번만 표시됨!)
   - 형식: `sk-proj-...`
7. 안전한 곳에 저장 (예: 비밀번호 관리자)

### 4️⃣ 사용량 제한 설정 (선택)
1. **Settings** → **Limits** 클릭
2. **Monthly budget** 설정 (예: $50)
3. **Email notification** 설정 (예: 80% 도달 시 알림)

## ✅ 체크리스트

설정을 완료한 후 다음 항목을 확인하세요:

- [ ] OpenAI 계정 생성 완료
- [ ] 결제 방법 추가 완료
- [ ] API 키 생성 완료
- [ ] API 키를 안전하게 저장
- [ ] Vercel 환경 변수에 `OPENAI_API_KEY` 추가
- [ ] Production, Preview, Development 환경 모두 설정
- [ ] Vercel 프로젝트 재배포 완료
- [ ] 프로덕션에서 음성 입력 테스트 성공
- [ ] 프로덕션에서 음성 출력 테스트 성공
- [ ] OpenAI 사용량 제한 설정 (선택)

## 🔗 관련 링크

- **OpenAI Platform**: https://platform.openai.com
- **OpenAI API Keys**: https://platform.openai.com/api-keys
- **OpenAI Usage**: https://platform.openai.com/usage
- **OpenAI Billing**: https://platform.openai.com/account/billing
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Environment Variables**: https://vercel.com/docs/projects/environment-variables

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. **Vercel 런타임 로그**: Deployments → 최신 배포 → Runtime Logs
2. **브라우저 콘솔**: F12 → Console 탭
3. **OpenAI API 상태**: https://status.openai.com
4. **Vercel 상태**: https://www.vercel-status.com

---

**작성자**: Claude AI  
**최종 수정**: 2026-01-24  
**버전**: 1.0  
**관련 문서**: `VOICE_FEATURE_IMPLEMENTATION.md`, `AI_BOT_MULTIMODAL_SYSTEM.md`
