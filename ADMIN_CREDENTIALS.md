# 🔐 관리자 계정 정보

## SUPER_ADMIN 계정

### 기본 관리자 계정
```
📧 이메일: admin@superplace.com
🔑 비밀번호: admin123!@#
👤 이름: System Administrator
🎯 역할: SUPER_ADMIN
```

### 로그인 URL
- 로컬: `http://localhost:3000/auth/signin`
- 프로덕션: `https://your-domain.vercel.app/auth/signin`

---

## 새 관리자 계정 생성 방법

### 방법 1: 스크립트 사용
```bash
cd /home/user/webapp
node create-admin.js
```

### 방법 2: 수동 생성
1. 일반 계정으로 회원가입
2. 데이터베이스에서 `role`을 `SUPER_ADMIN`으로 변경
3. `approved`를 `true`로 설정

---

## 관리자 권한

### SUPER_ADMIN이 할 수 있는 작업:
- ✅ 모든 사용자 조회 및 관리
- ✅ 사용자 포인트 지급/회수
- ✅ AI 봇 권한 부여/회수
- ✅ 비밀번호 변경
- ✅ Impersonation (다른 사용자로 로그인)
- ✅ 모든 학원 조회
- ✅ 전체 통계 확인
- ✅ 시스템 설정

---

## 보안 주의사항

⚠️ **프로덕션 환경에서는 반드시 비밀번호를 변경하세요!**

1. 관리자로 로그인
2. 설정 → 비밀번호 변경
3. 강력한 비밀번호 설정 (최소 8자, 대소문자, 숫자, 특수문자 포함)

---

## 데이터베이스 스키마 동기화

관리자 계정 생성 전에 데이터베이스를 동기화하세요:

```bash
# Prisma 스키마를 데이터베이스에 적용
npx prisma db push

# 또는 데이터 손실 허용
npx prisma db push --accept-data-loss
```

---

## 문제 해결

### "points 컬럼이 존재하지 않음" 오류
```bash
npx prisma db push --accept-data-loss
```

### 관리자 계정이 로그인되지 않음
- 이메일 확인: `admin@superplace.com`
- 비밀번호 확인: `admin123!@#`
- `approved`가 `true`인지 확인
- `role`이 `SUPER_ADMIN`인지 확인

---

**최종 업데이트**: 2025-01-19
