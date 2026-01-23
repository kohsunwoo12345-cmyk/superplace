# ✅ Cloudflare Worker 배포 체크리스트

## 📋 배포 전 준비물

- [ ] Cloudflare 계정
- [ ] Vercel 계정
- [ ] D1 Database 생성 완료
- [ ] 텍스트 에디터 (메모장, VSCode 등)

---

## 🔢 1단계: 정보 수집하기

### ✍️ 다음 정보를 메모장에 적어두세요:

```
1. D1 Database ID: 
   _________________________________________________

2. 보안 토큰 (이미 생성됨):
   92629e6aa16f35aaae63ace77625575860327f664844c4d60871cc8897cce1f3

3. Vercel 도메인:
   https://superplace-study.vercel.app

4. Worker URL (배포 후 자동 생성됨):
   _________________________________________________
```

### 📍 Database ID 찾는 방법:

1. https://dash.cloudflare.com 접속
2. 왼쪽 **"Workers & Pages"** 클릭
3. 상단 **"D1 SQL Database"** 탭 클릭
4. 데이터베이스 이름 클릭
5. Database ID 복사 (긴 영문+숫자 조합)

---

## 🔧 2단계: 설정 파일 수정하기

### 📄 파일: `cloudflare-worker/wrangler.toml`

**10번째 줄 수정:**
```toml
변경 전: database_id = "YOUR_D1_DATABASE_ID"
변경 후: database_id = "위에서_복사한_Database_ID"
```

**14번째 줄 확인:**
```toml
API_SECRET_TOKEN = "92629e6aa16f35aaae63ace77625575860327f664844c4d60871cc8897cce1f3"
```
✅ 이미 설정되어 있음

**15번째 줄 확인:**
```toml
ALLOWED_ORIGINS = "https://superplace-study.vercel.app,http://localhost:3000"
```
✅ 도메인이 맞으면 그대로, 다르면 수정

- [ ] wrangler.toml 파일 수정 완료
- [ ] 파일 저장 완료

---

## 📤 3단계: Cloudflare Worker 배포하기

### 방법 선택:

- [ ] **방법 A: 명령어로 배포** (개발자용 - 빠름)
- [ ] **방법 B: 대시보드로 배포** (비개발자용 - 쉬움)

### 방법 A: 명령어로 배포

**터미널에서 실행:**

```bash
# 1. 디렉토리 이동
cd cloudflare-worker

# 2. 패키지 설치
npm install

# 3. Cloudflare 로그인
wrangler login

# 4. 배포
wrangler deploy
```

**배포 완료 후:**
- [ ] Worker URL 복사 (터미널에 출력됨)
- [ ] 위 메모장에 URL 기록

### 방법 B: 대시보드로 배포

1. **Cloudflare 대시보드 접속**
   - [ ] https://dash.cloudflare.com 접속
   - [ ] 로그인 완료

2. **Worker 생성**
   - [ ] 왼쪽 "Workers & Pages" 클릭
   - [ ] "Create Application" 버튼 클릭
   - [ ] "Create Worker" 선택
   - [ ] 이름 입력: `superplace-db-worker`
   - [ ] "Deploy" 클릭

3. **Settings 설정**
   - [ ] 상단 "Settings" 탭 클릭
   - [ ] "Variables" 섹션으로 스크롤
   - [ ] "Add variable" 클릭

   **추가할 변수들:**
   
   | Name | Value | 완료 |
   |------|-------|------|
   | API_SECRET_TOKEN | `92629e6aa16f35aaae63ace77625575860327f664844c4d60871cc8897cce1f3` | [ ] |
   | ALLOWED_ORIGINS | `https://superplace-study.vercel.app,http://localhost:3000` | [ ] |

4. **D1 Binding 연결**
   - [ ] "Bindings" 섹션으로 스크롤
   - [ ] "Add binding" 클릭
   - [ ] Type: "D1 Database" 선택
   - [ ] Variable name: `DB` 입력
   - [ ] D1 Database: 만든 데이터베이스 선택
   - [ ] "Save" 클릭

5. **Worker URL 확인**
   - [ ] 상단에 표시된 URL 복사
   - [ ] 위 메모장에 URL 기록

---

## ⚙️ 4단계: Vercel 환경 변수 설정하기

1. **Vercel 대시보드 접속**
   - [ ] https://vercel.com 접속
   - [ ] 로그인
   - [ ] 프로젝트 선택 (superplace-study)

2. **Settings 메뉴**
   - [ ] 상단 "Settings" 탭 클릭
   - [ ] 왼쪽 "Environment Variables" 클릭

3. **환경 변수 추가**

   **변수 1:**
   - [ ] Key: `CLOUDFLARE_WORKER_URL`
   - [ ] Value: 3단계에서 복사한 Worker URL
   - [ ] Environments: Production, Preview, Development 모두 체크
   - [ ] "Add" 클릭

   **변수 2:**
   - [ ] Key: `CLOUDFLARE_WORKER_TOKEN`
   - [ ] Value: `92629e6aa16f35aaae63ace77625575860327f664844c4d60871cc8897cce1f3`
   - [ ] Environments: Production, Preview, Development 모두 체크
   - [ ] "Add" 클릭

4. **재배포 확인**
   - [ ] "Deployments" 탭에서 재배포 시작 확인
   - [ ] 약 2-3분 대기

---

## ✅ 5단계: 작동 확인하기

### 테스트 1: Worker 상태 확인

**브라우저에서 접속:**
```
https://YOUR-WORKER-URL.workers.dev/health
```

**예상 결과:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0"
  }
}
```

- [ ] Worker 상태 확인 성공

### 테스트 2: 웹사이트 확인

1. [ ] https://superplace-study.vercel.app 접속
2. [ ] 관리자 로그인
3. [ ] 학생 추가 테스트
4. [ ] 학생 목록 확인

---

## 🎉 배포 완료!

- [ ] Cloudflare Worker 배포 완료
- [ ] Vercel 환경 변수 설정 완료
- [ ] 작동 확인 완료

### 📝 최종 확인 사항:

```
✅ Worker URL: _____________________________________
✅ 보안 토큰: 92629e6aa16f35aaae63ace77625575860327f664844c4d60871cc8897cce1f3
✅ Vercel 도메인: https://superplace-study.vercel.app
✅ Database ID: _____________________________________
```

---

## 🆘 문제 발생 시

### "Database not found" 에러
→ Database ID가 잘못됨
→ Cloudflare에서 Database ID 다시 확인

### "Unauthorized" 에러
→ 보안 토큰이 다름
→ Vercel과 Cloudflare의 토큰이 동일한지 확인

### CORS 에러
→ 도메인이 허용되지 않음
→ wrangler.toml의 ALLOWED_ORIGINS에 도메인 추가

---

**배포 완료 시간:** __________
**배포자:** __________
