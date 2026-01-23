# 🚀 빠른 시작 가이드 (5분 안에 배포)

## 🎯 지금 바로 할 일 3가지

### 1️⃣ Database ID 확인하기 (1분)

**Cloudflare 대시보드에서:**
```
1. https://dash.cloudflare.com 접속
2. Workers & Pages → D1 SQL Database 클릭
3. 데이터베이스 클릭 → Database ID 복사
```

**복사한 ID를 여기에 붙여넣기:**
```
Database ID: _________________________________________
```

---

### 2️⃣ 설정 파일 수정하기 (1분)

**파일:** `cloudflare-worker/wrangler.toml`

**10번째 줄 수정:**
```toml
database_id = "복사한_Database_ID_여기에"
```

**저장!**

---

### 3️⃣ 배포하기 (3분)

#### 💻 개발자라면:

```bash
cd cloudflare-worker
npm install
wrangler login
wrangler deploy
```

#### 🖱️ 비개발자라면:

**Cloudflare 대시보드에서:**
1. Workers & Pages → Create Worker
2. 이름: `superplace-db-worker`
3. Settings → Bindings → D1 Database 연결
4. Settings → Variables 추가:
   ```
   API_SECRET_TOKEN = 92629e6aa16f35aaae63ace77625575860327f664844c4d60871cc8897cce1f3
   ALLOWED_ORIGINS = https://superplace-study.vercel.app,http://localhost:3000
   ```

---

## ⚙️ Vercel 설정 (필수!)

**Vercel 대시보드에서:**

1. 프로젝트 선택 → Settings → Environment Variables

2. 다음 2개 추가:

```
CLOUDFLARE_WORKER_URL = https://superplace-db-worker.YOUR-ACCOUNT.workers.dev
CLOUDFLARE_WORKER_TOKEN = 92629e6aa16f35aaae63ace77625575860327f664844c4d60871cc8897cce1f3
```

3. 재배포 대기 (2-3분)

---

## ✅ 확인하기

**브라우저에서:**
```
https://superplace-db-worker.YOUR-ACCOUNT.workers.dev/health
```

**성공하면 이렇게 나옴:**
```json
{
  "success": true,
  "data": {
    "status": "healthy"
  }
}
```

---

## 🎉 완료!

이제 모든 웹사이트가 하나의 DB를 공유합니다!

---

## 📞 도움이 필요하면

- **상세 가이드**: `DEPLOY_GUIDE_FOR_NON_DEVELOPERS.md` 참조
- **체크리스트**: `DEPLOYMENT_CHECKLIST.md` 참조
