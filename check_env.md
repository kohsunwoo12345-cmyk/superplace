# Cloudflare Pages 환경 변수 설정 체크리스트

## 1. 환경 변수 설정 위치 확인
- Cloudflare 대시보드 → Workers & Pages
- 프로젝트 선택 (superplace 또는 genspark-ai-developer)
- **Settings** 탭 → **Environment variables** 섹션

## 2. 환경 구분
Cloudflare Pages는 두 가지 환경을 구분합니다:
- **Production**: 메인 브랜치 (main)
- **Preview**: 다른 브랜치들 (genspark_ai_developer 포함)

## 3. 설정 방법
### 방법 A: 각 환경별 개별 설정
1. Production 환경에 변수 추가
2. Preview 환경에 변수 추가 (별도로!)

### 방법 B: 모든 환경에 한번에 적용
1. 변수 추가 시 "Apply to all environments" 체크

## 4. 변수 이름 확인
- 정확한 이름: `GOOGLE_GEMINI_API_KEY`
- 대소문자 구분됨
- 언더스코어(_) 위치 확인

## 5. 변수 타입
- Type: **Text** (암호화됨)
- Value: API 키 전체 문자열

## 6. 배포 필요
⚠️ 환경 변수 설정 후 **반드시 새로운 배포가 필요합니다**
- 단순 설정만으로는 적용되지 않음
- 새 커밋을 푸시하거나
- Cloudflare 대시보드에서 "Retry deployment" 클릭

## 7. 현재 브랜치 확인
- genspark_ai_developer 브랜치 = Preview 환경
- 따라서 **Preview 환경에 변수 설정 필요**

## 8. 디버깅 API
현재 테스트 API: https://genspark-ai-developer.superplacestudy.pages.dev/api/test-env
- hasKey: true여야 정상
- keyLength: 39 (일반적인 Gemini API 키 길이)
- keyPrefix: 첫 10자 표시
