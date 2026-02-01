# 🔍 API 오류 해결 방법

**문제**: `gemini-1.5-flash` 모델 404 오류  
**해결**: `gemini-1.5-pro` 모델로 변경  
**상태**: 코드 수정 완료, 배포 대기

---

## ✅ 수정 완료

### 변경 파일:
`src/app/api/ai/chat/route.ts`

### 변경 내용:
```typescript
// 이전
model: 'gemini-1.5-flash'

// 이후  
model: 'gemini-1.5-pro'
```

---

## 🧪 로컬 테스트 (선택사항)

로컬에서 수정된 코드를 먼저 테스트하려면:

```bash
# 1. .env 파일에 새 API 키 설정
echo 'GOOGLE_GEMINI_API_KEY=새로운_API_키' >> .env

# 2. 개발 서버 실행
npm run dev

# 3. 브라우저 테스트
# http://localhost:3000/dashboard/ai-gems
```

---

## 📋 배포 준비

### 커밋 대기 중:
```bash
git status
# modified: src/app/api/ai/chat/route.ts
```

### 배포 시 수행할 작업:
1. Git 커밋
2. main 브랜치 병합
3. GitHub 푸시
4. Vercel 자동 배포 (2-3분)

---

## 🎯 변경 사항 요약

| 항목 | 내용 |
|------|------|
| 문제 | `gemini-1.5-flash` 모델 404 오류 |
| 원인 | 해당 API 키가 flash 모델 미지원 |
| 해결 | `gemini-1.5-pro` 모델로 변경 |
| 파일 | `src/app/api/ai/chat/route.ts` |
| 상태 | ✅ 코드 수정 완료, 배포 대기 |

---

## ⚠️ 참고사항

### Gemini 1.5 Pro vs Flash:
- **Pro**: 더 강력, 복잡한 작업에 적합
- **Flash**: 빠름, 간단한 작업에 적합

### API 비용:
- Pro가 Flash보다 약간 비싸지만 품질이 더 좋음
- 무료 할당량 내에서는 큰 차이 없음

---

**배포 승인을 기다리고 있습니다!**
