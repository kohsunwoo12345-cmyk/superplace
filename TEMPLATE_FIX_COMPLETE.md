# 랜딩페이지 템플릿 적용 완전 해결 가이드

## ✅ 배포 완료
- 커밋: d015c8bb
- URL: https://superplacestudy.pages.dev
- 배포 예상 완료: 5분 후

## 🎯 수정 사항

### 1. 템플릿 HTML 자동 로드
- 프론트엔드에서 HTML 미전달 시 서버가 DB에서 자동으로 가져옴
- `templateId`로 템플릿 조회 → HTML 적용

### 2. 상세 로깅 추가
- 받은 templateHtml 길이 확인
- 변수 치환 과정 로깅
- 최종 HTML 저장 확인

### 3. 기본 템플릿 생성 API
- 완전한 HTML 템플릿 포함
- 모든 변수 ({{studentName}}, {{period}} 등) 포함
- 그라데이션 + 카드 디자인

## 🚀 5분 후 실행 순서

### Step 1: 기본 템플릿 생성 (최초 1회만)
```bash
curl -X POST https://superplacestudy.pages.dev/api/test/create-default-template
```

**예상 응답:**
```json
{
  "success": true,
  "message": "기본 템플릿이 생성되었습니다",
  "template": {
    "id": "tpl_xxxxx",
    "name": "기본 학습 리포트 템플릿",
    "htmlLength": 4500,
    "isDefault": true
  }
}
```

### Step 2: 랜딩페이지 생성
```
URL: https://superplacestudy.pages.dev/dashboard/admin/landing-pages/create
```

1. **학생 선택** (아무 학생이나)
2. **제목**: "템플릿 테스트"
3. **기간**: 2024-01-01 ~ 2024-03-31
4. **템플릿**: "기본 학습 리포트 템플릿" 자동 선택됨 (⭐ 표시)
5. **생성** 버튼 클릭

### Step 3: 생성된 페이지 확인
알림창에 나온 URL로 접속:
```
https://superplacestudy.pages.dev/lp/lp_xxxxx
```

## ✅ 정상 결과

### 페이지에 보여야 하는 것:
- 🎨 보라색 그라데이션 배경
- 📚 "학습 리포트" 제목
- 👤 학생 이름 (변수 치환됨)
- 📅 학습 기간
- 📊 4개의 통계 카드:
  - 출석률
  - 출석일
  - 숙제 완료율
  - AI 대화 횟수
- 🏫 학원명과 원장 이름

## ❌ 문제 발생 시

### A. 템플릿이 생성 페이지에 안 나옴
1. Step 1 (템플릿 생성 API) 실행했는지 확인
2. 브라우저 새로고침 (Ctrl+F5)

### B. 여전히 빈 페이지
다음 정보 제공:
1. 생성 시 브라우저 콘솔 로그 (F12)
2. 생성된 페이지 slug
3. 디버그 API 결과:
   ```
   https://superplacestudy.pages.dev/api/debug/landing-page-content?slug=생성된_slug
   ```

## 🎯 테스트 체크리스트

- [ ] Step 1: 템플릿 생성 API 실행 (curl)
- [ ] API 응답: `"success": true` 확인
- [ ] Step 2: 생성 페이지 접속
- [ ] 템플릿 선택 칸에 "기본 학습 리포트 템플릿" 보임
- [ ] 학생, 제목, 기간 입력 후 생성
- [ ] Step 3: 생성된 URL 접속
- [ ] 그라데이션 배경 + 통계 카드 보임
- [ ] 학생 이름이 정확히 표시됨

---

**중요**: 5분 후 Step 1부터 순서대로 실행해주세요!
