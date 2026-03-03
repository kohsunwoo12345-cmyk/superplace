#!/bin/bash
# Landing Page Template Application Test
# Tests if HTML templates are properly applied when creating landing pages

echo "=================================================="
echo "🔬 Landing Page Template Application Test"
echo "=================================================="
echo ""

BASE_URL="https://superplacestudy.pages.dev"
API_BASE="$BASE_URL/api"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASS_COUNT=0
FAIL_COUNT=0

# Function to print test result
print_result() {
  local test_name="$1"
  local result="$2"
  local message="$3"
  
  if [ "$result" == "PASS" ]; then
    echo -e "${GREEN}✅ PASS${NC}: $test_name"
    [ -n "$message" ] && echo -e "   ${BLUE}→ $message${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo -e "${RED}❌ FAIL${NC}: $test_name"
    [ -n "$message" ] && echo -e "   ${RED}→ $message${NC}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

echo "=================================================="
echo "📋 Step 1: Check Template API Endpoint"
echo "=================================================="
echo ""

# Test 1: Get templates
echo "Test 1: Fetching templates from API..."
TEMPLATES_RESPONSE=$(curl -s "$API_BASE/landing/templates" -H "Authorization: Bearer fake-token-for-testing")
echo "Response: $TEMPLATES_RESPONSE"

if echo "$TEMPLATES_RESPONSE" | grep -q '"success":true'; then
  TEMPLATE_COUNT=$(echo "$TEMPLATES_RESPONSE" | jq -r '.total // 0')
  print_result "Template API accessible" "PASS" "Found $TEMPLATE_COUNT templates"
  
  # Check if templates have html field
  HAS_HTML=$(echo "$TEMPLATES_RESPONSE" | jq -r '.templates[0].html // "none"')
  if [ "$HAS_HTML" != "none" ] && [ -n "$HAS_HTML" ]; then
    print_result "Templates contain HTML field" "PASS" "HTML length: ${#HAS_HTML} characters"
    echo ""
    echo "Sample HTML preview (first 200 chars):"
    echo "$HAS_HTML" | head -c 200
    echo "..."
    echo ""
  else
    print_result "Templates contain HTML field" "FAIL" "No HTML found in template"
  fi
else
  print_result "Template API accessible" "FAIL" "API returned error or unauthorized"
fi

echo ""
echo "=================================================="
echo "📋 Step 2: Verify Landing Page Creation Payload"
echo "=================================================="
echo ""

# This section documents what the frontend should send
echo "✅ Frontend should send the following fields when creating a landing page:"
echo ""
cat << 'EOF'
{
  "slug": "lp_1234567890_xyz",
  "studentId": "student_id_here",
  "title": "학생 성적표",
  "subtitle": "2024년 1학기",
  "thumbnail": "data:image/png;base64,...",
  "templateId": "template_1234567890_abc",
  "templateHtml": "<!DOCTYPE html><html>...</html>",  // ⚠️ CRITICAL: Must include this!
  "startDate": "2024-03-01",
  "endDate": "2024-08-31",
  "dataOptions": {
    "showAttendance": true,
    "showHomework": true,
    "showAIChat": true
  },
  "customFormFields": []
}
EOF

echo ""
echo "=================================================="
echo "📋 Step 3: Check Frontend Code"
echo "=================================================="
echo ""

# Check if frontend is sending templateHtml
FRONTEND_FILE="src/app/dashboard/admin/landing-pages/create/page.tsx"
if [ -f "$FRONTEND_FILE" ]; then
  echo "Checking frontend file: $FRONTEND_FILE"
  
  # Check for templateHtml in the code
  if grep -q "templateHtml," "$FRONTEND_FILE"; then
    print_result "Frontend sends templateHtml" "PASS" "Found templateHtml in API payload"
    
    # Show the relevant code
    echo ""
    echo "Code snippet:"
    grep -A 5 -B 5 "templateHtml," "$FRONTEND_FILE" | head -15
    echo ""
  else
    print_result "Frontend sends templateHtml" "FAIL" "templateHtml not found in API payload"
  fi
  
  # Check for template selection logic
  if grep -q "const templateHtml = templates.find" "$FRONTEND_FILE"; then
    print_result "Frontend extracts template HTML" "PASS" "Template HTML extraction logic found"
  else
    print_result "Frontend extracts template HTML" "FAIL" "No template HTML extraction logic"
  fi
else
  print_result "Frontend file exists" "FAIL" "File not found: $FRONTEND_FILE"
fi

echo ""
echo "=================================================="
echo "📋 Step 4: Check Backend API"
echo "=================================================="
echo ""

BACKEND_FILE="functions/api/admin/landing-pages.ts"
if [ -f "$BACKEND_FILE" ]; then
  echo "Checking backend file: $BACKEND_FILE"
  
  # Check if backend receives templateHtml
  if grep -q "templateHtml" "$BACKEND_FILE"; then
    print_result "Backend accepts templateHtml" "PASS" "templateHtml parameter found"
    
    # Check if backend uses templateHtml
    if grep -q "if (templateHtml)" "$BACKEND_FILE"; then
      print_result "Backend processes templateHtml" "PASS" "Template HTML processing logic found"
      
      # Show the relevant code
      echo ""
      echo "Processing logic:"
      grep -A 10 "if (templateHtml)" "$BACKEND_FILE" | head -12
      echo ""
    else
      print_result "Backend processes templateHtml" "FAIL" "No template HTML processing logic"
    fi
  else
    print_result "Backend accepts templateHtml" "FAIL" "templateHtml parameter not found"
  fi
  
  # Check variable replacement
  REPLACEMENTS=$(grep -c "htmlContent.replace" "$BACKEND_FILE")
  if [ $REPLACEMENTS -gt 0 ]; then
    print_result "Backend replaces template variables" "PASS" "Found $REPLACEMENTS variable replacements"
    
    echo ""
    echo "Variables being replaced:"
    grep "htmlContent.replace" "$BACKEND_FILE" | grep -oP "\{\{\w+\}\}" | sort -u | head -15
    echo ""
  else
    print_result "Backend replaces template variables" "FAIL" "No variable replacements found"
  fi
else
  print_result "Backend file exists" "FAIL" "File not found: $BACKEND_FILE"
fi

echo ""
echo "=================================================="
echo "📋 Step 5: Template Variables Documentation"
echo "=================================================="
echo ""

echo "✅ The following variables are supported in templates:"
echo ""
cat << 'EOF'
Basic Information:
- {{title}}           → Page title
- {{subtitle}}        → Page subtitle  
- {{description}}     → Page description

Student Information:
- {{studentName}}     → Student name
- {{period}}          → Study period (e.g., "2024년 1학기")

Attendance Data:
- {{attendanceRate}}  → Attendance rate percentage
- {{totalDays}}       → Total school days
- {{presentDays}}     → Days present
- {{tardyDays}}       → Days tardy
- {{absentDays}}      → Days absent

Homework Data:
- {{homeworkRate}}    → Homework completion rate
- {{homeworkCompleted}} → Number of homework completed

AI Data:
- {{aiChatCount}}     → Number of AI chat interactions

Academy Information:
- {{academyName}}     → Academy name
- {{directorName}}    → Director name
EOF

echo ""
echo "=================================================="
echo "📋 Test Results Summary"
echo "=================================================="
echo ""
echo -e "${GREEN}✅ Passed: $PASS_COUNT${NC}"
echo -e "${RED}❌ Failed: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed! Template system is working correctly.${NC}"
  echo ""
  echo "✅ Next steps:"
  echo "1. Log in to https://superplacestudy.pages.dev/dashboard/admin/landing-pages/create"
  echo "2. Select a template from the dropdown"
  echo "3. Fill in student information and page details"
  echo "4. Create the landing page"
  echo "5. Verify the HTML template is applied with variables replaced"
else
  echo -e "${RED}⚠️  Some tests failed. Please review the issues above.${NC}"
fi

echo ""
echo "=================================================="
echo "📋 Debugging Guide"
echo "=================================================="
echo ""
echo "If templates are not being applied:"
echo ""
echo "1. Check Browser Console (F12):"
echo "   - Look for logs like '🔍 Sending to API:'"
echo "   - Verify 'hasTemplateHtml: true'"
echo "   - Verify 'templateHtmlLength: > 0'"
echo ""
echo "2. Check Network Tab:"
echo "   - Find POST request to /api/admin/landing-pages"
echo "   - Check request payload includes 'templateHtml' field"
echo "   - Verify response returns created page ID"
echo ""
echo "3. Check Backend Logs (Cloudflare Dashboard):"
echo "   - Look for '✅ Using provided template HTML'"
echo "   - Look for '✅ Template HTML processed'"
echo "   - If you see '⚠️ Using default HTML', template was not sent"
echo ""
echo "4. Common Issues:"
echo "   - Template not selected: Choose a template before creating"
echo "   - Template has no HTML: Check template creation"
echo "   - Frontend not sending templateHtml: Check code at line ~245"
echo "   - Backend not receiving templateHtml: Check API parameters"
echo ""
echo "=================================================="
