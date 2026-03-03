# 요금제 시스템 빠른 참조 가이드

## 📌 핵심 정보

### DB 컬럼 매핑
```
pricing_plans 테이블 ────┐
                        ├─> max_students
                        ├─> max_homework_checks
                        ├─> max_ai_analysis
                        ├─> max_similar_problems
                        └─> max_landing_pages

user_subscriptions 테이블
  현재 사용량:          최대 한도:
  - current_students    - max_students
  - current_homework_checks  - max_homework_checks
  - current_ai_analysis      - max_ai_analysis
  - current_similar_problems - max_similar_problems
  - current_landing_pages    - max_landing_pages
```

### API 엔드포인트
- **요금제 목록**: `GET /api/admin/pricing-plans`
- **요금제 승인**: `POST /api/admin/subscription-approvals`
- **한도 체크**: `POST /api/subscription/check-limit`
- **학원 상세**: `GET /api/admin/academies?id={academyId}`

### 무제한 표시
- DB 값: `-1`
- 체크 로직: `if (max_students === -1) return true;`

## 🚀 빠른 테스트

```bash
# 요금제 목록 확인
curl https://superplacestudy.pages.dev/api/admin/pricing-plans | jq

# 테스트 스크립트 실행
cd /home/user/webapp
./test-subscription-approval-flow.sh
```

## 📝 문제 해결

### 학생 추가가 안될 때
1. user_subscriptions 테이블에 구독이 있는지 확인
2. status='active'인지 확인
3. max_students 값 확인 (-1이면 무제한)
4. current_students < max_students 확인

### 구독 정보가 안 보일 때
1. 요금제 승인이 되었는지 확인
2. subscription_requests.status='approved' 확인
3. user_subscriptions 테이블에 데이터 있는지 확인
4. 브라우저 캐시 삭제 후 재접속

## 📚 상세 문서
전체 문서: `SUBSCRIPTION_APPROVAL_COMPLETE.md`
