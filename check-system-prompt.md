# 현재 문제 상황

## 증상
- AI 채점 결과에서 `problemAnalysis`와 `weaknessTypes`가 항상 빈 배열 `[]`
- 대신 `createDefaultGradingResult()`의 기본값이 사용됨
- 점수는 75점으로 고정

## 가능한 원인
1. **AI가 JSON 형식을 정확히 반환하지 않음** - `responseText.match(/\{[\s\S]*\}/)` 실패
2. **System Prompt가 잘못 설정되어 AI가 필요한 필드를 생성하지 못함**
3. **AI 응답이 JSON이 아닌 텍스트로 반환됨**

## 해결 방법
1. System Prompt를 확인하고, 필요한 필드를 명확히 지정
2. AI 응답을 로그로 확인 (현재 디버그 테이블 생성 실패)
3. JSON 파싱 로직 개선

## 다음 단계
`homework_grading_config` 테이블의 `systemPrompt`를 확인하고
올바른 JSON 구조를 요청하는 프롬프트로 업데이트
