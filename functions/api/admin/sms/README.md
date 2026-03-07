# Cloudflare Functions API

SMS 시스템의 백엔드 API는 Cloudflare Functions로 구현되어 있습니다.

## 📁 구조

```
functions/api/admin/sms/
├── senders.js          # GET - 승인된 발신번호 목록
├── stats.js            # GET - SMS 통계
├── balance.js          # GET - 포인트 잔액
├── history.js          # GET - 발송 이력
├── send.js             # POST - SMS 발송 (SOLAPI)
├── templates.js        # GET/POST - 템플릿 관리
└── registration/
    ├── index.js        # GET/POST - 내 등록 신청
    ├── all.js          # GET - 전체 신청 (관리자)
    └── [id]/
        ├── approve.js  # POST - 승인
        └── reject.js   # POST - 거부
```

## 🔑 환경 변수

Cloudflare Pages 설정에서 추가해야 합니다:

- `SOLAPI_API_KEY` - SOLAPI API 키
- `SOLAPI_API_SECRET` - SOLAPI API 시크릿

## 📝 참고

Cloudflare Functions는 자동으로 `/api` 경로로 라우팅됩니다.
예: `functions/api/admin/sms/senders.js` → `/api/admin/sms/senders`

## ⚠️ TODO

나머지 API 엔드포인트를 Cloudflare Functions로 마이그레이션해야 합니다:
- send.js (SMS 발송)
- balance.js (포인트 잔액)
- history.js (발송 이력)
- templates.js (템플릿)
- registration/* (발신번호 등록 관련)
