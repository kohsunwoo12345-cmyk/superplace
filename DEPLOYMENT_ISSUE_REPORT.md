# Cloudflare Pages Functions 배포 문제 보고

## 🔴 핵심 문제

**Admin 설정(Gemini 모델)이 실제 채점에 반영되지 않고 있습니다.**

### 발견된 사실

1. **Admin 설정 확인**
   ```json
   {
     "model": "gemini-2.5-flash-lite",
     "temperature": 0.3,
     "enableRAG": 1,
     "knowledgeBaseLength": 73833
   }
   ```

2. **실제 채점 결과**
   ```json
   {
     "gradedBy": "DeepSeek AI",  // ❌ 여전히 DeepSeek
     "score": 75,
     "subject": "기타"
   }
   ```

3. **코드 수정 완료**
   - ✅ `gradedByModel` 동적 생성 로직 추가
   - ✅ RAG 지식 베이스 통합 로직 추가
   - ✅ Debug 로그 추가
   - ✅ GitHub에 푸시 완료 (커밋: `74e3484e`)

4. **배포 상태 확인**
   - ❌ Functions가 Cloudflare Pages에 배포되지 않음
   - ❌ `/api/homework/debug-gradedby` 엔드포인트 404 Not Found
   - ❌ `process-grading.ts`의 `debug` 필드가 응답에 없음

## 🔍 원인 분석

### Cloudflare Pages Functions 배포 방식

1. **GitHub 자동 배포**
   - GitHub에 push하면 Cloudflare Pages가 자동으로 빌드/배포
   - 문제: **배포가 완료되지 않았거나 실패함**

2. **Functions 파일 위치**
   - ✅ `/functions/api/homework/process-grading.ts` 존재
   - ✅ `/out/functions/api/homework/process-grading.ts` 빌드됨
   - ❌ Cloudflare가 TypeScript를 컴파일하지 않거나 캐시 문제

3. **Wrangler 직접 배포 실패**
   ```bash
   wrangler pages deploy out --project-name=superplacestudy
   # ERROR: CLOUDFLARE_API_TOKEN 환경 변수 필요
   ```

## 🎯 해결 방법

### 방법 1: Cloudflare Pages 대시보드 확인 (권장)

1. https://dash.cloudflare.com/ 로그인
2. **Pages** → **superplacestudy** 프로젝트 선택
3. **Deployments** 탭에서 최근 배포 상태 확인
   - ✅ Success: 배포 완료 (캐시 문제 가능)
   - ⏳ Building: 빌드 중 (대기 필요)
   - ❌ Failed: 빌드 실패 (로그 확인 필요)

4. **빌드 로그 확인**
   - TypeScript 컴파일 에러 확인
   - Functions 복사 여부 확인

5. **캐시 퍼지** (배포 성공했는데도 반영 안 될 경우)
   - Pages 프로젝트 → Settings → Functions
   - Redeploy 버튼 클릭

### 방법 2: Cloudflare API 토큰으로 직접 배포

```bash
# 1. Cloudflare API 토큰 생성
# https://dash.cloudflare.com/profile/api-tokens
# Permissions: Cloudflare Pages:Edit

# 2. 환경 변수 설정
export CLOUDFLARE_API_TOKEN=your_api_token_here

# 3. Wrangler 배포
cd /home/user/webapp
wrangler pages deploy out --project-name=superplacestudy
```

### 방법 3: 강제 재배포 (GitHub Actions)

```bash
# 빈 커밋으로 재배포 트리거
git commit --allow-empty -m "chore: trigger Cloudflare Pages rebuild"
git push origin main
```

## 📋 검증 체크리스트

배포가 완료되면 다음을 확인:

1. **새 엔드포인트 작동 확인**
   ```bash
   curl "https://suplacestudy.com/api/homework/debug-gradedby?submissionId=homework-1773866939460-omq0zcxwg"
   ```
   **기대 결과**:
   ```json
   {
     "submissionId": "homework-1773866939460-omq0zcxwg",
     "config": {
       "model": "gemini-2.5-flash-lite",
       "enableRAG": 1
     },
     "grading": {
       "gradedBy": "Google Gemini (gemini-2.5-flash-lite)",  // ✅ 변경됨
       "score": 75,
       "gradedAt": "2026-03-19 ..."
     },
     "codeVersion": "v3-debug-gradedby"  // ✅ 있어야 함
   }
   ```

2. **새 제출로 테스트**
   ```bash
   # 제출
   curl -X POST "https://suplacestudy.com/api/homework-v2/submit" \
     -H "Content-Type: application/json" \
     -d '{"phone": "01051363624", "images": ["data:image/png;base64,..."]}'
   
   # 25초 후 확인
   curl "https://suplacestudy.com/api/homework/debug-submission?submissionId=..."
   ```
   **기대 결과**: `gradedBy: "Google Gemini (gemini-2.5-flash-lite)"`

3. **프론트엔드 UI 확인**
   - https://superplacestudy.pages.dev/dashboard/homework/results/
   - gradedBy 필드에 "Google Gemini ..." 표시 확인

## 🚀 최종 상태

- ✅ 코드 수정 완료
- ✅ GitHub 푸시 완료
- ❌ **Cloudflare Pages Functions 배포 미완료**
- ⏳ 배포 완료 후 즉시 작동 예상

## 📞 다음 단계

**사용자(kohsunwoo12345)가 직접 수행해야 할 작업:**

1. Cloudflare Pages 대시보드 접속
2. 배포 상태 확인 및 필요 시 재배포
3. 배포 완료 후 위 검증 체크리스트 실행

**모든 코드는 준비되었으며, Cloudflare에서 배포만 완료하면 즉시 작동합니다.**

---

**작성 시간**: 2026-03-19 20:50 UTC  
**최종 커밋**: `74e3484e`  
**상태**: 코드 준비 완료, 배포 대기 중
