# 🚀 배포 모니터링 가이드

## 📡 실시간 배포 상태 확인

### Cloudflare Pages 대시보드
1. 접속: https://dash.cloudflare.com
2. 왼쪽 메뉴: **Workers & Pages** 클릭
3. 프로젝트 선택: **superplace** 클릭
4. 탭: **Deployments** 선택

---

## 🔍 배포 상태 의미

### ✅ Success (성공)
```
상태: Ready to test
의미: 배포 완료, 프로덕션 URL에 반영됨
다음 단계: 사용자 테스트 시작
```

### 🔄 Building (빌드 중)
```
상태: In progress
의미: Next.js 빌드 및 Cloudflare Pages 배포 진행 중
소요 시간: 약 3-5분
다음 단계: 대기
```

### ⚠️ Queued (대기 중)
```
상태: Waiting to build
의미: 빌드 대기열에 추가됨
소요 시간: 1-2분
다음 단계: 대기
```

### ❌ Failed (실패)
```
상태: Build failed
의미: 빌드 또는 배포 중 에러 발생
다음 단계: 에러 로그 확인
```

---

## 📋 배포 정보 확인

### 최신 배포 (Expected)
```yaml
Commit: b761f53
Message: "fix: 파일 업로드 시에도 이미지 압축 적용"
Branch: main
Author: Your Name
Files Changed: 1 (src/app/attendance-verify/page.tsx)
```

### 배포 세부 정보
```
- 빌드 시작 시간: (Cloudflare에서 확인)
- 빌드 소요 시간: 약 3-5분
- 배포 URL: https://superplacestudy.pages.dev
- Preview URL: https://[commit-hash].superplacestudy.pages.dev
```

---

## 🕐 타임라인 예측

```
00:00 - Git push 완료
00:30 - Cloudflare Pages Webhook 트리거
01:00 - 빌드 시작 (Queued → Building)
03:00 - Next.js 빌드 완료
04:00 - Static files 업로드
05:00 - 배포 완료 (Building → Success)
05:30 - 프로덕션 URL 업데이트
06:00 - 전 세계 CDN 전파 완료
```

**총 소요 시간:** 약 5-7분

---

## ✅ 배포 검증 체크리스트

### 1단계: Cloudflare Pages 확인
- [ ] Deployments 페이지에서 최신 배포 확인
- [ ] Commit 해시 `b761f53` 확인
- [ ] 상태가 "Success" 확인
- [ ] 빌드 시간 확인 (약 3-5분)

### 2단계: Deployment Details 확인
```
Details 클릭 → Logs 탭
- Build logs 확인
- "✓ Compiled successfully" 메시지 확인
- "Deployment completed successfully" 확인
```

### 3단계: 파일 해시 변경 확인
```
Production URL 접속: https://superplacestudy.pages.dev/attendance-verify
페이지 소스 보기: Ctrl + U
검색: "attendance-verify"

기대되는 스크립트:
/_next/static/chunks/pages/attendance-verify-[NEW_HASH].js

이전 해시와 다르면 → 새 빌드 반영됨 ✅
```

### 4단계: Runtime 확인
```
F12 → Console 탭
페이지 새로고침
에러 없는지 확인
```

---

## 🔧 배포 문제 해결

### 문제 1: 빌드가 시작되지 않음
**증상:** Push 후 10분이 지나도 Deployments에 새 항목 없음

**원인:**
- GitHub Webhook 설정 문제
- Cloudflare Pages 연동 문제

**해결:**
1. Cloudflare Pages → Settings → Builds & deployments
2. "Retry deployment" 클릭
3. 또는 빈 commit으로 재트리거:
   ```bash
   git commit --allow-empty -m "chore: trigger deployment"
   git push origin main
   ```

### 문제 2: 빌드 실패 (Failed)
**증상:** Status가 "Failed"

**원인:**
- TypeScript 컴파일 에러
- 환경 변수 누락
- 의존성 문제

**해결:**
1. Deployment Details → Logs 탭 확인
2. 에러 메시지 확인:
   ```
   Error: [X] Failed to compile
   ```
3. 로컬에서 빌드 테스트:
   ```bash
   npm run build
   ```

### 문제 3: 배포는 성공했지만 코드 미반영
**증상:** Success 상태지만 여전히 이전 코드 실행

**원인:**
- CDN 캐시 지연 (드물게 발생)
- 브라우저 캐시

**해결:**
1. 5-10분 대기 (CDN 전파)
2. 브라우저 시크릿 모드 테스트
3. Cloudflare Purge Cache:
   ```
   Cloudflare Dashboard → Caching → Purge Everything
   ```

---

## 🎯 테스트 준비

배포가 "Success" 상태가 되면:

### 1. URL 확인
```
Production: https://superplacestudy.pages.dev/attendance-verify
Preview: https://[commit].superplacestudy.pages.dev/attendance-verify

⚠️ 주의: Production URL로 테스트!
```

### 2. 캐시 클리어
```
방법 A: Ctrl + Shift + Delete
방법 B: 시크릿 모드 (권장)
방법 C: Ctrl + Shift + R
```

### 3. Console 열기
```
F12 → Console 탭
또는 Ctrl + Shift + J
```

### 4. 테스트 시작
```
파일 선택 → 2-3MB 이미지 업로드
Console 로그 확인:
  🔄 압축 시도 1: 0.XXM B
  ✅ 파일 업로드 완료, 압축 후 크기: 0.XXMB
```

---

## 📊 배포 히스토리

### 최근 배포 목록

| Commit | Message | Status | Time |
|--------|---------|--------|------|
| b761f53 | fix: 파일 업로드 시에도 이미지 압축 적용 | ⏳ Pending | 5-7분 |
| 913ab0b | chore: Remove Vercel workflow | ✅ Success | - |
| f9f7e8d | feat: 숙제 시스템 완성 (#7) | ✅ Success | - |

---

## 🔔 알림 설정 (선택 사항)

### Cloudflare Pages Webhook
```
Settings → Notifications
→ Add webhook
→ Slack/Discord webhook URL 입력
→ "Deployment successful" 알림 활성화
```

---

## 📞 지원

### 배포 관련 질문
- Cloudflare Status: https://www.cloudflarestatus.com
- Cloudflare Community: https://community.cloudflare.com
- GitHub Issues: [Your repo]/issues

### 긴급 문제
```
1. 에러 로그 캡처 (Cloudflare Deployment Logs)
2. 브라우저 Console 로그 캡처
3. GitHub Issue 생성
4. 개발자에게 보고
```

---

## ✅ 최종 체크리스트

배포 완료 후 확인:

- [ ] Cloudflare Pages Status: Success
- [ ] Commit 해시 일치: b761f53
- [ ] Build logs: No errors
- [ ] Production URL 접속 가능
- [ ] 브라우저 Console: No errors
- [ ] 파일 해시 변경됨
- [ ] 테스트 준비 완료

---

**현재 시간:** 2026-02-10
**예상 완료 시간:** +5-7분
**다음 단계:** 사용자 테스트

**배포 모니터링 URL:**  
https://dash.cloudflare.com → Workers & Pages → superplace → Deployments
