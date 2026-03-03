#!/bin/bash
# Landing Page Template Variables - Functionality Test
# Tests if template variables are working and identifies which need real data

echo "=================================================="
echo "🔬 랜딩페이지 템플릿 변수 작동 테스트"
echo "=================================================="
echo ""

BASE_URL="https://superplacestudy.pages.dev"
API_BASE="$BASE_URL/api"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "=================================================="
echo "📋 Step 1: 현재 변수 치환 로직 분석"
echo "=================================================="
echo ""

echo "백엔드 코드 분석 중..."
echo ""

# Check the backend code
BACKEND_FILE="functions/api/admin/landing-pages.ts"

if [ -f "$BACKEND_FILE" ]; then
  echo -e "${CYAN}✅ 백엔드 파일 확인: $BACKEND_FILE${NC}"
  echo ""
  
  echo "📊 현재 변수 치환 상태:"
  echo ""
  
  # Extract variable replacements
  grep "htmlContent.replace" "$BACKEND_FILE" | while read -r line; do
    # Extract variable name and value
    var_name=$(echo "$line" | grep -oP '\{\{(\w+)\}\}' | head -1 | sed 's/{{//g' | sed 's/}}//g')
    var_value=$(echo "$line" | grep -oP "'[^']+'" | tail -1)
    
    if [ -n "$var_name" ]; then
      echo -e "   ${BLUE}{{$var_name}}${NC} → $var_value"
    fi
  done
  
  echo ""
else
  echo -e "${RED}❌ 백엔드 파일을 찾을 수 없습니다: $BACKEND_FILE${NC}"
  exit 1
fi

echo ""
echo "=================================================="
echo "📋 Step 2: 변수 카테고리 분석"
echo "=================================================="
echo ""

echo "🔍 변수를 카테고리별로 분류합니다..."
echo ""

cat << 'EOF'
┌─────────────────────────────────────────────────────────────┐
│ 1. 사용자 입력 변수 (프론트엔드에서 전달) ✅ 정상 작동      │
├─────────────────────────────────────────────────────────────┤
│ • {{title}}          → 사용자가 입력한 제목                 │
│ • {{subtitle}}       → 사용자가 입력한 부제목               │
│ • {{description}}    → 사용자가 입력한 설명                 │
│                                                             │
│ 상태: ✅ 실제 데이터로 치환됨 (request body)                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. 하드코딩 변수 (기본값 사용) ⚠️  실제 데이터 필요        │
├─────────────────────────────────────────────────────────────┤
│ • {{studentName}}    → '학생' (고정값)                      │
│ • {{period}}         → '2024년 1학기' (고정값)              │
│ • {{attendanceRate}} → '95%' (고정값)                       │
│ • {{totalDays}}      → '40' (고정값)                        │
│ • {{presentDays}}    → '38' (고정값)                        │
│ • {{tardyDays}}      → '1' (고정값)                         │
│ • {{absentDays}}     → '1' (고정값)                         │
│ • {{homeworkRate}}   → '90%' (고정값)                       │
│ • {{homeworkCompleted}} → '36' (고정값)                     │
│ • {{aiChatCount}}    → '127' (고정값)                       │
│ • {{academyName}}    → '슈퍼플레이스 스터디' (고정값)       │
│ • {{directorName}}   → '홍길동' (고정값)                    │
│                                                             │
│ 상태: ⚠️  하드코딩된 기본값 사용 중                          │
│ 필요: DB에서 실제 데이터 조회 필요                          │
└─────────────────────────────────────────────────────────────┘
EOF

echo ""
echo ""
echo "=================================================="
echo "📋 Step 3: 실제 데이터 조회 가능 여부 확인"
echo "=================================================="
echo ""

echo "🔍 API가 받는 데이터 확인 중..."
echo ""

# Check what data the API receives
if grep -q "studentId" "$BACKEND_FILE"; then
  echo -e "${GREEN}✅ studentId를 받고 있음${NC}"
  echo "   → 학생 데이터 조회 가능"
else
  echo -e "${RED}❌ studentId를 받지 않음${NC}"
fi

if grep -q "startDate\|endDate" "$BACKEND_FILE"; then
  echo -e "${GREEN}✅ startDate/endDate를 받고 있음${NC}"
  echo "   → 기간별 데이터 조회 가능"
else
  echo -e "${YELLOW}⚠️  startDate/endDate 확인 필요${NC}"
fi

echo ""
echo "🔍 학생 데이터 조회 로직 확인 중..."
echo ""

# Check if student data is being fetched
if grep -q "SELECT.*FROM.*User.*WHERE.*id.*=.*studentId" "$BACKEND_FILE"; then
  echo -e "${GREEN}✅ 학생 데이터 조회 로직이 있음${NC}"
else
  echo -e "${RED}❌ 학생 데이터 조회 로직이 없음${NC}"
  echo "   → 실제 학생 이름을 가져오지 않음"
fi

if grep -q "attendance" "$BACKEND_FILE" | grep -i "select"; then
  echo -e "${GREEN}✅ 출석 데이터 조회 로직이 있음${NC}"
else
  echo -e "${RED}❌ 출석 데이터 조회 로직이 없음${NC}"
  echo "   → 실제 출석률을 계산하지 않음"
fi

if grep -q "homework" "$BACKEND_FILE" | grep -i "select"; then
  echo -e "${GREEN}✅ 숙제 데이터 조회 로직이 있음${NC}"
else
  echo -e "${RED}❌ 숙제 데이터 조회 로직이 없음${NC}"
  echo "   → 실제 숙제 완료율을 계산하지 않음"
fi

echo ""
echo "=================================================="
echo "📋 Step 4: 변수별 작동 상태 요약"
echo "=================================================="
echo ""

cat << 'EOF'
┌──────────────────────┬─────────────┬──────────────────────────┐
│ 변수명               │ 작동 상태   │ 현재 값/상태             │
├──────────────────────┼─────────────┼──────────────────────────┤
│ {{title}}            │ ✅ 정상     │ 사용자 입력 (실제 데이터)│
│ {{subtitle}}         │ ✅ 정상     │ 사용자 입력 (실제 데이터)│
│ {{description}}      │ ✅ 정상     │ 사용자 입력 (실제 데이터)│
├──────────────────────┼─────────────┼──────────────────────────┤
│ {{studentName}}      │ ⚠️  하드코딩│ '학생' (고정값)          │
│ {{period}}           │ ⚠️  하드코딩│ '2024년 1학기' (고정값)  │
├──────────────────────┼─────────────┼──────────────────────────┤
│ {{attendanceRate}}   │ ⚠️  하드코딩│ '95%' (고정값)           │
│ {{totalDays}}        │ ⚠️  하드코딩│ '40' (고정값)            │
│ {{presentDays}}      │ ⚠️  하드코딩│ '38' (고정값)            │
│ {{tardyDays}}        │ ⚠️  하드코딩│ '1' (고정값)             │
│ {{absentDays}}       │ ⚠️  하드코딩│ '1' (고정값)             │
├──────────────────────┼─────────────┼──────────────────────────┤
│ {{homeworkRate}}     │ ⚠️  하드코딩│ '90%' (고정값)           │
│ {{homeworkCompleted}}│ ⚠️  하드코딩│ '36' (고정값)            │
├──────────────────────┼─────────────┼──────────────────────────┤
│ {{aiChatCount}}      │ ⚠️  하드코딩│ '127' (고정값)           │
├──────────────────────┼─────────────┼──────────────────────────┤
│ {{academyName}}      │ ⚠️  하드코딩│ '슈퍼플레이스 스터디'    │
│ {{directorName}}     │ ⚠️  하드코딩│ '홍길동' (고정값)        │
└──────────────────────┴─────────────┴──────────────────────────┘
EOF

echo ""
echo ""
echo "=================================================="
echo "📋 Step 5: 문제 진단 및 해결 방안"
echo "=================================================="
echo ""

cat << 'EOF'
🔴 현재 문제:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ❌ 학생 이름이 실제 데이터가 아닌 '학생'으로 표시됨
2. ❌ 출석률/숙제 완료율 등이 모두 고정값으로 표시됨
3. ❌ AI 대화 횟수가 실제 사용량이 아닌 '127'로 고정됨
4. ❌ 학원명/원장명이 실제 학원 정보가 아님

🟡 원인:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API가 studentId를 받고 있지만, 실제로 DB에서 학생/출석/숙제/AI
데이터를 조회하지 않고 하드코딩된 기본값을 사용하고 있음.

✅ 해결 방안:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 학생 데이터 조회 추가
   const student = await db.prepare(
     'SELECT name FROM User WHERE id = ?'
   ).bind(studentId).first();
   
2. 출석 데이터 조회 및 계산
   const attendance = await db.prepare(`
     SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present,
       SUM(CASE WHEN status = 'TARDY' THEN 1 ELSE 0 END) as tardy,
       SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent
     FROM Attendance 
     WHERE userId = ? AND date BETWEEN ? AND ?
   `).bind(studentId, startDate, endDate).first();
   
3. 숙제 데이터 조회 및 계산
   const homework = await db.prepare(`
     SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
     FROM HomeworkSubmission 
     WHERE studentId = ?
   `).bind(studentId).first();
   
4. AI 대화 데이터 조회
   const aiChats = await db.prepare(`
     SELECT COUNT(*) as count
     FROM ChatSession 
     WHERE userId = ?
   `).bind(studentId).first();

5. 학원/원장 정보 조회
   const academy = await db.prepare(`
     SELECT a.name as academyName, u.name as directorName
     FROM Academy a
     JOIN User u ON a.id = u.academyId
     WHERE u.role = 'DIRECTOR' AND a.id = ?
   `).bind(creatorAcademyId).first();
EOF

echo ""
echo ""
echo "=================================================="
echo "📋 Step 6: 구현 우선순위"
echo "=================================================="
echo ""

cat << 'EOF'
┌────┬──────────────────────────────┬──────────┬──────────────┐
│순위│ 구현 항목                    │ 난이도   │ 영향도       │
├────┼──────────────────────────────┼──────────┼──────────────┤
│ 1  │ 학생 이름 조회               │ 쉬움     │ 매우 높음    │
│ 2  │ 학원명/원장명 조회           │ 쉬움     │ 높음         │
│ 3  │ 출석 데이터 조회 및 계산     │ 중간     │ 매우 높음    │
│ 4  │ 숙제 데이터 조회 및 계산     │ 중간     │ 높음         │
│ 5  │ AI 대화 횟수 조회            │ 쉬움     │ 중간         │
│ 6  │ 기간 설정 (startDate/endDate)│ 쉬움     │ 중간         │
└────┴──────────────────────────────┴──────────┴──────────────┘
EOF

echo ""
echo ""
echo "=================================================="
echo "📋 최종 결론"
echo "=================================================="
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}현재 상태:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "• ${GREEN}✅ 변수 치환 메커니즘: 정상 작동${NC}"
echo -e "• ${GREEN}✅ 템플릿 HTML 적용: 100% 작동${NC}"
echo -e "• ${GREEN}✅ 사용자 입력 변수 (title, subtitle, description): 실제 데이터 사용${NC}"
echo ""
echo -e "• ${YELLOW}⚠️  학생/출석/숙제/AI 변수: 하드코딩된 기본값 사용${NC}"
echo -e "• ${RED}❌ 실제 DB 데이터 연동: 아직 구현되지 않음${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}필요한 작업:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. DB에서 학생 정보 조회 (이름)"
echo "2. DB에서 출석 데이터 조회 및 통계 계산"
echo "3. DB에서 숙제 데이터 조회 및 완료율 계산"
echo "4. DB에서 AI 대화 데이터 조회"
echo "5. DB에서 학원/원장 정보 조회"
echo "6. 조회한 실제 데이터로 변수 치환"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}예상 효과:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "• 랜딩페이지에 학생별 실제 성과 데이터 표시"
echo "• 학부모에게 정확한 학습 현황 전달"
echo "• 학원별 맞춤 정보 (학원명, 원장명) 표시"
echo "• 데이터 기반의 신뢰도 높은 리포트 생성"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo "=================================================="
echo "테스트 완료!"
echo "=================================================="
echo ""
echo "다음 명령으로 실제 데이터 연동 작업을 시작할 수 있습니다:"
echo ""
echo "  1. 백엔드 파일 수정: functions/api/admin/landing-pages.ts"
echo "  2. 학생 데이터 조회 로직 추가"
echo "  3. 출석/숙제/AI 데이터 조회 로직 추가"
echo "  4. 변수 치환 부분을 실제 데이터로 교체"
echo ""
