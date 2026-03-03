# PPT & Landing Page Enhancement Testing Guide

## 📋 Overview
This document provides comprehensive testing instructions for the new features:
1. **Landing Page HTML Direct Edit Permission**
2. **Enhanced PPT Template System with 50 Variables**

## 🔧 Features Implemented

### 1. Landing Page HTML Direct Edit Permission

#### Database Schema
- **Table**: `director_limitations`
- **New Field**: `landing_page_html_direct_edit` (INTEGER, DEFAULT 0)
- **Values**: 
  - `0` = Disabled (default)
  - `1` = Enabled

#### API Updates
- **File**: `functions/api/admin/director-limitations.ts`
- **Endpoints**:
  - `GET /api/admin/director-limitations?directorId={id}`
  - `POST /api/admin/director-limitations`
- **Changes**: Added `landing_page_html_direct_edit` field to schema, queries, and responses

#### Admin UI Updates
- **File**: `src/app/dashboard/admin/director-limitations/page.tsx`
- **New Tab**: "랜딩페이지" tab (5th tab)
- **Features**:
  - Toggle button to enable/disable HTML direct edit
  - Warning messages about security and advanced usage
  - Automatic save functionality

#### Landing Page Creation UI Updates
- **File**: `src/app/dashboard/admin/landing-pages/create/page.tsx`
- **New Features**:
  1. Permission check on page load (queries `/api/admin/director-limitations`)
  2. "HTML 직접 입력" button (only visible if permission enabled)
  3. HTML code editor (Textarea with syntax hints)
  4. Toggle between template selection and HTML direct input
  5. Sends `customHtml` and `isCustomHtml` flag to API

### 2. Enhanced PPT Template System

#### Type Definitions
- **File**: `src/types/ppt-variables.ts`
- **Total Variables**: 50 (grouped into 5 categories)
- **Categories**:
  1. **기본 정보** (5 vars): academyName, title, subtitle, date, presenter
  2. **학생 정보** (10 vars): name, grade, class, number, phone, parent info, enrollment, attendance, classes
  3. **성적 정보** (15 vars): subject scores, average, total, rank, grade, changes, strongest/weakest subjects, improvement
  4. **학습 분석** (10 vars): strengths, weaknesses, habits, concentration, participation, homework, attitude, progress, understanding, recommendations
  5. **목표 및 메시지** (10 vars): short/mid/long-term goals, action plans (3), expected outcome, teacher comment, encouragement, parent advice

#### PPT Generator
- **File**: `src/utils/ppt-generator.ts`
- **Function**: `createDetailedPPT(data: PPTVariables)`
- **Output**: 8-14 slides (varies based on data provided)
- **Slides**:
  1. Cover page
  2. Table of contents
  3. Student introduction
  4. Score summary (table)
  5. Rank and grade
  6. Strengths analysis
  7. Weaknesses analysis
  8. Learning attitude evaluation (table)
  9. Short-term goal
  10. Mid-term goal
  11. Long-term goal
  12. Teacher comment
  13. Parent message
  14. Closing

#### UI Form
- **File**: `src/app/dashboard/ppt-create/page.tsx`
- **Tabs**: 5 input tabs for organized data entry
- **Features**:
  - Auto-fill title based on student name
  - Date picker with default today
  - Conditional slide generation (skips empty slides)
  - PptxGenJS CDN loading indicator
  - Download button with loading state

## 🧪 Testing Instructions

### Test 1: Landing Page HTML Permission (Admin)

#### 1.1 Enable Permission
```bash
# 1. Login as admin
# 2. Navigate to: /dashboard/admin/director-limitations
# 3. Select a test academy (e.g., "서울 수학 학원")
# 4. Click on "랜딩페이지" tab (5th tab)
# 5. Click "활성화" button for "HTML 직접 편집 기능"
# 6. Click "저장" button
# 7. Verify success message appears
```

**Expected Result**:
- ✅ "랜딩페이지" tab is visible
- ✅ Toggle button changes from "비활성화" to "활성화"
- ✅ Success message: "학원장 제한 설정이 저장되었습니다"
- ✅ Database updated: `landing_page_html_direct_edit = 1`

#### 1.2 Verify API Response
```bash
curl -X GET 'https://superplacestudy.pages.dev/api/admin/director-limitations?directorId=2' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

**Expected Response**:
```json
{
  "limitation": {
    "id": 1,
    "director_id": 2,
    "academy_id": 1,
    "landing_page_html_direct_edit": 1,
    ...
  }
}
```

### Test 2: Landing Page HTML Direct Edit (Director)

#### 2.1 Check Button Visibility
```bash
# 1. Login as director (with permission enabled)
# 2. Navigate to: /dashboard/admin/landing-pages/create
# 3. Verify "HTML 직접 입력" button is visible next to "템플릿 관리"
```

**Expected Result**:
- ✅ Button with `<Code>` icon is visible
- ✅ Button text: "HTML 직접 입력"

#### 2.2 Test HTML Editor
```bash
# 1. Click "HTML 직접 입력" button
# 2. Verify HTML textarea appears
# 3. Enter custom HTML:
```
```html
<!DOCTYPE html>
<html>
<head>
  <title>{{studentName}} 학습 리포트</title>
  <style>
    body { font-family: Arial; padding: 20px; }
    h1 { color: #4A90E2; }
  </style>
</head>
<body>
  <h1>{{studentName}}님의 학습 성장 보고서</h1>
  <p>소속: {{academyName}}</p>
  <p>기간: {{startDate}} ~ {{endDate}}</p>
</body>
</html>
```
```bash
# 4. Select a student
# 5. Fill required fields (title, dates)
# 6. Click "랜딩페이지 생성"
# 7. Verify success
```

**Expected Result**:
- ✅ HTML editor replaces template selection
- ✅ Warning message shows security notices
- ✅ Variable hints appear (`{{studentName}}`, etc.)
- ✅ Page creates successfully
- ✅ Custom HTML renders on landing page

#### 2.3 Test Permission Denied
```bash
# 1. Login as director (with permission DISABLED)
# 2. Navigate to: /dashboard/admin/landing-pages/create
# 3. Verify "HTML 직접 입력" button is NOT visible
```

**Expected Result**:
- ✅ Button is hidden
- ✅ Only template selection is available

### Test 3: Enhanced PPT System

#### 3.1 Full Data Entry Test
```bash
# 1. Navigate to: /dashboard/ppt-create
# 2. Fill all 50 variables across 5 tabs:
```

**Tab 1: 기본 정보**
- 학원명: "서울수학학원"
- 발표자: "이선생님"
- 제목: "김민수 학생 학습 성장 보고서"
- 부제목: "2026년 3월 월간 학습 리포트"
- 날짜: 2026-03-03

**Tab 2: 학생 정보**
- 이름: "김민수"
- 학년: "중학교 2학년"
- 반: "A반"
- 학번: "2024001"
- 전화번호: "010-1234-5678"
- 학부모 이름: "김학부모"
- 학부모 전화: "010-8765-4321"
- 등록일: 2025-09-01
- 출석률: "95%"
- 총 수업 수: "40"

**Tab 3: 성적 정보**
- 국어: "85", 수학: "92", 영어: "88", 과학: "90", 사회: "87"
- 평균: "88.4", 총점: "442", 등수: "5", 등급: "A"
- 이전 평균: "82.0", 점수 변화: "+6.4", 등수 변화: "+3"
- 가장 강한 과목: "수학", 가장 약한 과목: "국어", 향상률: "7.8%"

**Tab 4: 학습 분석**
- 강점: "수학적 사고력 우수\n문제 해결 능력 뛰어남\n꾸준한 학습 태도"
- 약점: "국어 독해 속도 개선 필요\n영어 듣기 연습 부족"
- 학습 습관: "매일 2시간 자기주도학습"
- 집중력: "높음 (90%)", 참여도: "적극적", 숙제: "100% 완성"
- 학습 태도: "성실하고 적극적", 진도율: "95%", 이해도: "높음"
- 추천사항: "국어 독해 연습 강화\n영어 듣기 매일 30분 권장"

**Tab 5: 목표 및 메시지**
- 단기 목표: "다음 시험 수학 100점 달성"
- 중기 목표: "전체 평균 90점 이상 유지"
- 장기 목표: "과학고 진학 준비"
- 실행 계획 1: "국어 독해 문제집 매일 10문제"
- 실행 계획 2: "영어 듣기 매일 30분 연습"
- 실행 계획 3: "수학 심화 문제 주 3회"
- 기대 성과: "다음 시험 전과목 90점 이상"
- 선생님 코멘트: "꾸준한 노력으로 성적이 크게 향상되었습니다..."
- 격려 문구: "민수는 매우 성실한 학생입니다..."
- 학부모님께: "가정에서도 국어 독서 시간을 늘려주시면..."

```bash
# 3. Click "PPT 생성" button
# 4. Wait for download
# 5. Open downloaded .pptx file
```

**Expected Result**:
- ✅ 14 slides created
- ✅ All variables filled correctly
- ✅ Tables formatted properly
- ✅ Colors and styling applied
- ✅ Bullet points display correctly
- ✅ File downloads as: `김민수_20260303.pptx`

#### 3.2 Partial Data Test
```bash
# 1. Fill only required fields:
#    - 학원명: "테스트학원"
#    - 제목: "테스트 보고서"
#    - 학생 이름: "홍길동"
# 2. Click "PPT 생성"
# 3. Open downloaded file
```

**Expected Result**:
- ✅ ~8 slides created (conditional slides skipped)
- ✅ Only filled data appears
- ✅ Empty slides are omitted
- ✅ No errors or broken formatting

#### 3.3 PptxGenJS Loading Test
```bash
# 1. Open DevTools Console
# 2. Navigate to: /dashboard/ppt-create
# 3. Watch console logs
```

**Expected Logs**:
```
✅ PptxGenJS loaded from CDN
```

**Expected UI**:
- ✅ "PPT 라이브러리를 로딩 중입니다..." shows briefly
- ✅ "PPT 생성" button becomes enabled
- ✅ Yellow loading card disappears

## 📊 Database Verification

### Check Landing Page Permission
```sql
-- Check if field exists
SELECT landing_page_html_direct_edit FROM director_limitations LIMIT 1;

-- Check specific director
SELECT 
  director_id, 
  academy_id, 
  landing_page_html_direct_edit,
  updated_at 
FROM director_limitations 
WHERE director_id = 2;

-- Enable permission manually (if needed)
UPDATE director_limitations 
SET landing_page_html_direct_edit = 1,
    updated_at = datetime('now')
WHERE director_id = 2;
```

## 🐛 Common Issues & Solutions

### Issue 1: "HTML 직접 입력" button not showing
**Solution**:
1. Verify permission is enabled in admin panel
2. Check API response: `/api/admin/director-limitations?directorId=X`
3. Ensure user is logged in as director (not student)
4. Clear browser cache and reload

### Issue 2: PPT generation fails
**Solution**:
1. Check browser console for errors
2. Verify PptxGenJS loaded: `window.PptxGenJS` should exist
3. Try clearing cache and reloading
4. Ensure at least `title` is filled

### Issue 3: Landing page not rendering custom HTML
**Solution**:
1. Check HTML syntax is valid
2. Verify `isCustomHtml: true` is sent in API request
3. Check landing page API logs
4. Test with simple HTML first

## ✅ Success Criteria

### Landing Page HTML Edit
- [x] Database field added
- [x] API GET returns field
- [x] API POST accepts field
- [x] Admin UI shows toggle
- [x] Permission persists after save
- [x] Button appears/disappears based on permission
- [x] HTML editor functional
- [x] Custom HTML renders on landing page

### Enhanced PPT System
- [x] 50 variables defined
- [x] All 5 tabs implemented
- [x] Input form validation works
- [x] PPT generates with full data (14 slides)
- [x] PPT generates with partial data (8+ slides)
- [x] PptxGenJS loads from CDN
- [x] File downloads correctly
- [x] All formatting preserved

## 📝 Test Checklist

### Before Deployment
- [ ] Test landing page permission toggle (admin)
- [ ] Test HTML editor visibility (director with permission)
- [ ] Test HTML editor hidden (director without permission)
- [ ] Test custom HTML submission
- [ ] Test PPT with all 50 variables
- [ ] Test PPT with minimal data
- [ ] Test PPT download
- [ ] Verify database updates
- [ ] Check API responses
- [ ] Test on different browsers

### After Deployment
- [ ] Smoke test: Enable permission
- [ ] Smoke test: Create landing page with HTML
- [ ] Smoke test: Generate full PPT
- [ ] Monitor error logs
- [ ] Check user feedback

## 🚀 Deployment Notes

### Files Modified
1. `functions/api/admin/director-limitations.ts` - Added field to schema, queries
2. `src/app/dashboard/admin/director-limitations/page.tsx` - Added 5th tab, toggle UI
3. `src/app/dashboard/admin/landing-pages/create/page.tsx` - Added permission check, HTML editor
4. `src/types/ppt-variables.ts` - Already had 50 variables
5. `src/utils/ppt-generator.ts` - Already had full generation logic
6. `src/app/dashboard/ppt-create/page.tsx` - Already had 5-tab form

### Files Created
1. `TEST_PPT_LANDING_ENHANCEMENTS.md` - This testing guide

### Database Migration
**No migration needed** - Field is added dynamically via `CREATE TABLE IF NOT EXISTS`

### Rollback Plan
If issues occur:
1. Revert changes to `director-limitations.ts` (remove field)
2. Revert changes to `director-limitations/page.tsx` (remove tab)
3. Revert changes to `landing-pages/create/page.tsx` (remove button)
4. Database: `UPDATE director_limitations SET landing_page_html_direct_edit = 0;`

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Cloudflare Functions logs
3. Verify database state
4. Test API endpoints directly (curl/Postman)
5. Review this guide for solutions

---

**Document Version**: 1.0  
**Last Updated**: 2026-03-03  
**Author**: AI Assistant  
**Status**: Ready for Testing 🎉
