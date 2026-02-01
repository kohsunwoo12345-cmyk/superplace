# 문제 해결 가이드 (Troubleshooting Guide)

## 학생 회원가입 시 "유효하지 않은 학원 코드입니다" 오류

### 증상
학생이나 선생님이 올바른 학원 코드를 입력했는데도 "유효하지 않은 학원 코드입니다"라는 오류 메시지가 표시됩니다.

### 원인
Prisma Client가 최신 데이터베이스 스키마를 반영하지 못하고 있을 수 있습니다.

### 해결 방법

#### 1. 개발 환경에서
```bash
# Prisma Client 재생성
npx prisma generate

# 개발 서버 재시작
npm run dev
```

#### 2. 프로덕션 환경에서
```bash
# 빌드 다시 실행 (Prisma Client가 자동으로 재생성됨)
npm run build

# 서버 재시작
npm start
```

#### 3. Vercel 배포 환경에서
- Vercel 대시보드에서 프로젝트로 이동
- "Deployments" 탭 선택
- 최신 배포를 선택하고 "Redeploy" 클릭
- 또는 코드를 다시 푸시하여 자동 배포 트리거

### 예방 방법
`package.json`에 다음 스크립트가 있는지 확인하세요:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

이렇게 하면:
- `npm install` 후 자동으로 Prisma Client가 생성됩니다
- 빌드할 때마다 Prisma Client가 재생성됩니다

## 데이터베이스 관련 오류

### Prisma Client 초기화 오류
```bash
# 데이터베이스 마이그레이션 적용
npx prisma db push

# Prisma Client 재생성
npx prisma generate
```

### 데이터베이스 연결 오류
`.env` 파일의 `DATABASE_URL`을 확인하세요:
```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

## 학원 코드 확인 방법

현재 데이터베이스에 등록된 학원 코드를 확인하려면:

```bash
node check-academy-codes.js
```

출력 예시:
```
=== 학원 목록 ===
총 2개의 학원이 있습니다.

1. 꾸메땅학원
   코드: WP2H3M37
   ID: cmkpydurd0004qk4qtx0bx7xg
   사용자 수: 1명
```

## 추가 도움말

문제가 계속되면:
1. 서버 로그 확인
2. 브라우저 개발자 도구의 네트워크 탭 확인
3. API 응답 메시지 확인

더 자세한 정보는 [README.md](./README.md)를 참조하세요.
