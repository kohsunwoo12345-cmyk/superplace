# 출석 코드 문제 해결 가이드

## 🚨 문제 상황
학생이 출석 코드를 입력하면 "관리자에게 문의해주세요" 메시지가 나타남

## ✅ 해결 방법

### 1단계: 모든 출석 코드 활성화 (즉시 실행)

배포된 사이트에서 다음 URL을 브라우저에서 열기:

```
https://genspark-ai-developer.superplacestudy.pages.dev/api/admin/activate-all-codes
```

**예상 결과:**
```json
{
  "success": true,
  "message": "모든 출석 코드가 활성화되었습니다",
  "stats": {
    "before": {
      "total": 10,
      "active": 5,
      "inactive": 5
    },
    "after": {
      "total": 10,
      "active": 10,
      "inactive": 0
    },
    "updated": 5
  },
  "codes": [
    {
      "userId": 1,
      "name": "홍길동",
      "email": "student1@example.com",
      "code": "123456",
      "isActive": 1
    }
  ]
}
```

### 2단계: 테스트

1. 학생 대시보드로 이동:
   ```
   https://genspark-ai-developer.superplacestudy.pages.dev/dashboard/students/
   ```

2. 아무 학생이나 클릭해서 출석 코드 확인

3. 출석 인증 페이지로 이동:
   ```
   https://genspark-ai-developer.superplacestudy.pages.dev/attendance-verify/
   ```

4. 확인한 코드 입력 → **"출석 처리되었습니다!"** 메시지 확인

### 3단계: 문제가 지속되는 경우

#### Option A: 브라우저 콘솔에서 직접 확인

1. 출석 인증 페이지에서 F12 눌러서 개발자 도구 열기
2. Console 탭 확인
3. 코드 입력 후 출력되는 로그 확인:
   ```
   📤 출석 인증 요청: {code: "123456"}
   ✅ 출석 인증 응답: {...}
   📊 Response status: 403
   ```

4. 응답 데이터에서 `debug` 객체 확인:
   ```json
   {
     "success": false,
     "error": "비활성화된 출석 코드입니다",
     "debug": {
       "code": "123456",
       "isActive": 0,  ← 이 값이 0이면 문제
       "userId": 1
     }
   }
   ```

#### Option B: 코드 없는 학생에게 코드 생성

코드가 아예 없는 학생의 경우:

```
https://genspark-ai-developer.superplacestudy.pages.dev/api/admin/fix-attendance-codes
```

이 API를 POST로 호출하면 코드가 없는 학생들에게 자동으로 코드 생성

### 4단계: Cloudflare D1 직접 확인 (최종 수단)

1. Cloudflare 대시보드 접속:
   ```
   https://dash.cloudflare.com
   ```

2. Workers & Pages → D1 → `superplace-db` 선택

3. Console 탭에서 SQL 실행:

   ```sql
   -- 모든 코드 확인
   SELECT 
     u.id,
     u.name,
     sac.code,
     sac.isActive
   FROM users u
   LEFT JOIN student_attendance_codes sac ON u.id = sac.userId
   WHERE u.role = 'STUDENT'
   ORDER BY u.name;
   ```

4. isActive가 0인 것이 있으면 수동으로 활성화:

   ```sql
   -- 모든 코드 활성화
   UPDATE student_attendance_codes 
   SET isActive = 1;
   ```

5. 결과 확인:

   ```sql
   SELECT COUNT(*) as total_active 
   FROM student_attendance_codes 
   WHERE isActive = 1;
   ```

## 🎯 완료 체크리스트

- [ ] `/api/admin/activate-all-codes` 실행 완료
- [ ] 응답에서 `"success": true` 확인
- [ ] `stats.after.inactive` 값이 0인지 확인
- [ ] 최소 1명의 학생으로 출석 인증 테스트
- [ ] "출석 처리되었습니다!" 메시지 확인
- [ ] 숙제 제출 화면으로 자동 전환 확인

## 📋 트러블슈팅

### 문제: API 호출 시 404 에러

**원인:** 아직 배포가 완료되지 않음

**해결:**
1. PR을 main 브랜치에 머지
2. 2-3분 대기 (자동 배포)
3. 다시 API 호출

### 문제: "Database not configured" 에러

**원인:** Cloudflare Pages의 D1 바인딩 문제

**해결:**
1. Cloudflare 대시보드 → Workers & Pages
2. superplace 프로젝트 선택
3. Settings → Functions → D1 database bindings
4. `DB` = `superplace-db` 확인

### 문제: 특정 학생만 계속 실패

**원인:** 해당 학생에게 코드가 없거나 잘못된 userId

**해결:**
```sql
-- 특정 학생 코드 확인
SELECT * FROM student_attendance_codes WHERE userId = 1;

-- 코드가 없으면 수동 생성
INSERT INTO student_attendance_codes (id, userId, code, isActive)
VALUES (
  'code-manual-' || (strftime('%s', 'now') * 1000),
  1,  -- userId
  printf('%06d', abs(random() % 1000000)),  -- 6자리 랜덤 코드
  1   -- isActive
);
```

## 📞 추가 지원

문제가 계속되면 다음 정보를 공유해주세요:

1. 브라우저 콘솔 스크린샷 (F12 → Console)
2. `/api/admin/activate-all-codes` 응답 전체
3. 문제가 되는 학생의 userId 또는 이름
4. 입력한 출석 코드

## 🔗 관련 링크

- 출석 인증: https://genspark-ai-developer.superplacestudy.pages.dev/attendance-verify/
- 학생 관리: https://genspark-ai-developer.superplacestudy.pages.dev/dashboard/students/
- Cloudflare 대시보드: https://dash.cloudflare.com
- GitHub PR: https://github.com/kohsunwoo12345-cmyk/superplace/pull/7
