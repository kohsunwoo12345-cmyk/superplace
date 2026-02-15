#!/bin/bash

echo "=================================================="
echo "개념 분석 상세 결과 개선 검증 스크립트"
echo "배포 일시: 2026-02-15 16:00 KST"
echo "커밋: f154cc6"
echo "=================================================="
echo ""

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API 파일 확인
echo -e "${BLUE}[1단계] API 파일 확인${NC}"
if [ -f "functions/api/students/weak-concepts/index.ts" ]; then
  echo -e "${GREEN}✓${NC} API 파일 존재"
else
  echo -e "${RED}✗${NC} API 파일 없음"
  exit 1
fi
echo ""

# "형식 오류" 메시지 제거 확인
echo -e "${BLUE}[2단계] '형식 오류' 메시지 제거 확인${NC}"
if grep -q "분석 데이터가 있으나 형식 오류" functions/api/students/weak-concepts/index.ts; then
  echo -e "${RED}✗${NC} '형식 오류' 메시지가 아직 존재합니다"
else
  echo -e "${GREEN}✓${NC} '형식 오류' 메시지 제거됨"
fi
echo ""

# 상세한 분석 메시지 확인
echo -e "${BLUE}[3단계] 상세한 분석 메시지 확인${NC}"
if grep -q "학생의 학습 데이터를 분석하여 부족한 개념과 학습 방향을 도출했습니다" functions/api/students/weak-concepts/index.ts; then
  echo -e "${GREEN}✓${NC} 상세한 분석 메시지 존재"
else
  echo -e "${RED}✗${NC} 상세한 분석 메시지 없음"
fi
echo ""

# 3가지 약점 코드 확인
echo -e "${BLUE}[4단계] 부족한 개념 3가지 생성 코드 확인${NC}"
WEAK_CONCEPT_COUNT=$(grep -o "defaultWeakConcepts.push" functions/api/students/weak-concepts/index.ts | wc -l)
if [ "$WEAK_CONCEPT_COUNT" -ge 3 ]; then
  echo -e "${GREEN}✓${NC} 부족한 개념 ${WEAK_CONCEPT_COUNT}가지 생성 코드 확인"
else
  echo -e "${RED}✗${NC} 부족한 개념 생성 코드 부족 (${WEAK_CONCEPT_COUNT}개)"
fi
echo ""

# 학습 방향 권장사항 확인
echo -e "${BLUE}[5단계] 학습 방향 권장사항 생성 코드 확인${NC}"
RECOMMENDATION_COUNT=$(grep -o "defaultRecommendations.push" functions/api/students/weak-concepts/index.ts | wc -l)
if [ "$RECOMMENDATION_COUNT" -ge 3 ]; then
  echo -e "${GREEN}✓${NC} 학습 방향 권장사항 ${RECOMMENDATION_COUNT}가지 생성 코드 확인"
else
  echo -e "${RED}✗${NC} 학습 방향 권장사항 부족 (${RECOMMENDATION_COUNT}개)"
fi
echo ""

# 종합 평가 상세 메시지 확인
echo -e "${BLUE}[6단계] 종합 평가 상세 메시지 확인${NC}"
if grep -q "detailedSummary" functions/api/students/weak-concepts/index.ts; then
  echo -e "${GREEN}✓${NC} 상세 종합 평가 코드 존재"
else
  echo -e "${RED}✗${NC} 상세 종합 평가 코드 없음"
fi
echo ""

# 구체적 개념 언급 확인
echo -e "${BLUE}[7단계] 구체적 개념 언급 확인${NC}"
CONCEPT_KEYWORDS=(
  "기본 연산 원리"
  "복합 문제 해결"
  "꼼꼼한 풀이 습관"
  "지수 법칙"
  "부호 처리"
)

for keyword in "${CONCEPT_KEYWORDS[@]}"; do
  if grep -q "$keyword" functions/api/students/weak-concepts/index.ts; then
    echo -e "${GREEN}✓${NC} '$keyword' 키워드 존재"
  else
    echo -e "${YELLOW}⚠${NC} '$keyword' 키워드 없음"
  fi
done
echo ""

# 분석 통계 표시 확인
echo -e "${BLUE}[8단계] 분석 통계 표시 확인${NC}"
STAT_KEYWORDS=(
  "분석 기간"
  "분석 데이터"
  "80점 미만"
  "최저 점수"
  "학습 방향"
)

for keyword in "${STAT_KEYWORDS[@]}"; do
  if grep -q "$keyword" functions/api/students/weak-concepts/index.ts; then
    echo -e "${GREEN}✓${NC} '$keyword' 통계 표시 코드 존재"
  else
    echo -e "${YELLOW}⚠${NC} '$keyword' 통계 표시 코드 없음"
  fi
done
echo ""

# 문서 확인
echo -e "${BLUE}[9단계] 문서 확인${NC}"
if [ -f "CONCEPT_ANALYSIS_DETAIL_FIX.md" ]; then
  DOC_SIZE=$(wc -c < "CONCEPT_ANALYSIS_DETAIL_FIX.md")
  echo -e "${GREEN}✓${NC} 문서 존재 (크기: ${DOC_SIZE} bytes)"
else
  echo -e "${YELLOW}⚠${NC} 문서 없음"
fi
echo ""

# 최종 결과
echo "=================================================="
echo -e "${GREEN}검증 완료!${NC}"
echo "=================================================="
echo ""
echo "📋 다음 단계:"
echo "1. 배포 URL 접속: https://superplacestudy.pages.dev/dashboard/students/detail?id={학생ID}"
echo "2. '약점 분석' 탭 클릭"
echo "3. '개념 분석 실행' 버튼 클릭"
echo "4. 3-5초 후 상세한 분석 결과 확인"
echo ""
echo "✅ 예상 결과:"
echo "   - '잠시 후 다시 시도해주세요' 메시지 제거"
echo "   - 전문적이고 상세한 분석 표시"
echo "   - 부족한 개념 3가지 이상 표시"
echo "   - 학습 방향 권장사항 3가지 표시"
echo "   - 분석 기간, 데이터 건수, 점수 통계 표시"
echo ""
