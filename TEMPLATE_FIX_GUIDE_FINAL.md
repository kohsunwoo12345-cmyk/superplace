# 🛠️ 템플릿 오류 완벽 해결 가이드

## 📋 문제 상황
- **오류**: `D1_ERROR: FOREIGN KEY constraint failed: SQLITE_CONSTRAINT`
- **원인**: `LandingPageTemplate` 테이블의 `createdById` 필드가 `NOT NULL`이고 외래 키 제약이 있는데, 참조하는 사용자가 없음

## ✅ 해결 방법

### 방법 1: 웹 UI로 자동 수정 (권장)

1. **설치 페이지 접속**
   ```
   https://superplacestudy.pages.dev/install-templates.html
   ```

2. **테이블 수정 버튼 클릭**
   - 맨 위의 빨간색 버튼: **"🛠️ 테이블 수정 + 템플릿 설치 (FOREIGN KEY 오류 해결)"** 클릭
   - 비밀번호는 이미 입력되어 있음: `setup-templates-2026`
   - 확인 팝업에서 **확인** 클릭

3. **완료 확인**
   - "✅ 테이블 재생성 완료! 5개 템플릿 설치 완료!" 메시지 확인
   - 템플릿 관리 페이지로 이동: 
     ```
     https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates
     ```

### 방법 2: API로 직접 호출

```bash
curl -X POST https://superplacestudy.pages.dev/api/setup/fix-template-table \
  -H "Content-Type: application/json" \
  -d '{"password":"setup-templates-2026"}'
```

**예상 응답**:
```json
{
  "success": true,
  "message": "✅ 테이블 재생성 완료! 5개 템플릿 삽입됨",
  "inserted": 5,
  "total": 5
}
```

## 📦 설치되는 템플릿

수정 완료 후 자동으로 5개의 기본 템플릿이 설치됩니다:

1. **🌟 학생 성장 리포트** (기본 템플릿)
   - 변수: studentName, period, attendanceRate, homeworkRate, avgScore, teacherComment, academyName, generatedDate

2. **🎓 모던 학원 소개**
   - 변수: academyName, tagline, feature1, feature2, feature3

3. **🎉 이벤트 & 세미나**
   - 변수: eventTitle, eventDate, eventTime, description, benefit1, benefit2, benefit3

4. **🚀 무료 체험 신청**
   - 변수: subtitle, benefit1, benefit2, benefit3

5. **👥 학부모 커뮤니티**
   - 변수: communityName, tagline, introText, feature1, feature2, feature3, feature4

## 🔍 수정 내용

### 변경 전
```sql
CREATE TABLE LandingPageTemplate (
  ...
  createdById TEXT NOT NULL,  -- ❌ NOT NULL + FOREIGN KEY
  ...
);
```

### 변경 후
```sql
CREATE TABLE LandingPageTemplate (
  ...
  createdById TEXT,  -- ✅ NULL 허용, FOREIGN KEY 없음
  ...
);
```

## 📊 확인 방법

### 1. 템플릿 목록 확인
```
https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates
```
- 5개의 템플릿이 표시되어야 함
- 각 템플릿 클릭 시 미리보기, 수정, 삭제 가능

### 2. 랜딩페이지 생성 테스트
```
https://superplacestudy.pages.dev/test-landing-create.html
```
- "자동으로 가져오기" 버튼 클릭
- 정보 입력 후 "랜딩페이지 만들기" 클릭
- 생성된 URL 확인 (예: `https://superplacestudy.pages.dev/lp/test-xxx`)

## ❓ 문제 해결

### Q: 여전히 "LandingPageTemplate 테이블이 없습니다" 오류가 나요
**A**: 하드 새로고침 (Ctrl+Shift+R 또는 Cmd+Shift+R)을 해보세요. 캐시 문제일 수 있습니다.

### Q: "FOREIGN KEY constraint failed" 오류가 계속 나요
**A**: 
1. 테이블 수정 API를 다시 실행하세요 (DROP → CREATE를 다시 수행)
2. 또는 Cloudflare D1 Console에서 직접 테이블을 삭제하고 재생성하세요

### Q: 템플릿은 보이는데 랜딩페이지 생성이 안 돼요
**A**: 
1. 브라우저 콘솔(F12)에서 오류 메시지 확인
2. API 응답 확인: `/api/landing/pages` 엔드포인트 체크
3. 학원(Academy) 및 사용자(User) 데이터가 있는지 확인

## 🚀 다음 단계

1. ✅ 템플릿 확인
2. ✅ 랜딩페이지 생성 테스트
3. ✅ 실제 데이터로 랜딩페이지 생성
4. ✅ SMS/이메일로 랜딩페이지 링크 공유

---

**최종 업데이트**: 2026-02-20  
**Commit**: a17dfaf  
**배포 URL**: https://superplacestudy.pages.dev
