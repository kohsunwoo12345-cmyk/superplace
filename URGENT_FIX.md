# 🚨 긴급 수정 사항

## 문제 1: 랜딩페이지 구독 체크 없음
**파일**: `functions/api/admin/landing-pages.ts`
**문제**: GET/POST 모두 구독 체크 로직 없음
**해결**: POST 요청 시 구독 체크 추가 필요

## 문제 2: 학생 추가 여전히 실패
**원인 추정**:
1. academyId가 잘못됨
2. DIRECTOR가 없음
3. 구독이 실제로 할당되지 않음
4. 컬럼명 불일치

**확인 필요**:
- users/create.ts의 실제 에러 메시지
- 학원장 구독 상태
