# 🚀 랜딩페이지 템플릿 설치 가이드

## ⚠️ 문제 상황
템플릿 페이지 접속 시 "LandingPageTemplate 테이블이 아직 생성되지 않았습니다" 오류 발생

## ✅ 해결 방법

### 1단계: D1 데이터베이스 확인
먼저 D1 데이터베이스 이름을 확인합니다:
```bash
npx wrangler d1 list
```

### 2단계: 스키마 적용 (테이블이 없는 경우)
```bash
npx wrangler d1 execute superplace-study-db --file=cloudflare-worker/schema.sql
```

### 3단계: 템플릿 데이터 삽입
```bash
npx wrangler d1 execute superplace-study-db --file=insert_templates.sql
```

### 4단계: 확인
```bash
npx wrangler d1 execute superplace-study-db --command="SELECT id, name, isDefault FROM LandingPageTemplate"
```

## 📋 포함된 템플릿

설치 후 다음 5가지 템플릿을 사용할 수 있습니다:

1. **🌟 학생 성장 리포트** (기본 템플릿)
   - 학생의 학습 성과와 성장을 보여주는 프리미엄 템플릿
   - 변수: studentName, period, attendanceRate, homeworkRate, avgScore 등

2. **🎓 모던 학원 소개**
   - 세련되고 전문적인 학원 소개 페이지
   - 변수: academyName, tagline, feature1, feature2, feature3

3. **🎉 이벤트 & 세미나**
   - 특별 이벤트와 세미나 안내 페이지
   - 변수: eventTitle, eventDate, eventTime, description 등

4. **🚀 무료 체험 신청**
   - 무료 체험 수업 신청을 위한 전환 최적화 페이지
   - 변수: subtitle, benefit1, benefit2, benefit3

5. **👥 학부모 커뮤니티**
   - 학부모 소통과 참여를 위한 커뮤니티 페이지
   - 변수: communityName, tagline, introText, feature1-4

## 🔧 문제 해결

### 테이블이 이미 있는지 확인
```bash
npx wrangler d1 execute superplace-study-db --command="SELECT name FROM sqlite_master WHERE type='table' AND name='LandingPageTemplate'"
```

### 템플릿 개수 확인
```bash
npx wrangler d1 execute superplace-study-db --command="SELECT COUNT(*) as count FROM LandingPageTemplate"
```

### 템플릿 전체 삭제 (재설치 필요 시)
```bash
npx wrangler d1 execute superplace-study-db --command="DELETE FROM LandingPageTemplate"
```

## 📖 사용 방법

1. 관리자로 로그인
2. 랜딩페이지 관리 > 템플릿 메뉴 접속
3. 원하는 템플릿 선택
4. "사용하기" 버튼 클릭
5. 빌더에서 변수 값 입력 및 편집
6. 저장하여 랜딩페이지 생성

## 🎨 커스터마이징

각 템플릿은 완전히 커스터마이징 가능합니다:
- HTML 코드 직접 편집
- 변수 추가/제거
- CSS 스타일 수정
- 새로운 섹션 추가

## 💡 팁

- 기본 템플릿(isDefault=1)은 자동으로 선택됩니다
- 템플릿 복사 기능으로 빠르게 변형 가능
- 사용 횟수가 자동으로 집계됩니다
- 변수는 {{variableName}} 형식으로 사용합니다
