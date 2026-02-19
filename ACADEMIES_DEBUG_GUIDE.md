# 🔍 학원장 목록이 안 나오는 문제 해결 가이드

## 📋 현재 상황
- **URL**: https://superplacestudy.pages.dev/dashboard/admin/academies/
- **문제**: 실제 학원장들이 나와야 하는데 표시되지 않음
- **API 엔드포인트**: `/api/admin/academies`

---

## ✅ 1단계: 데이터베이스 확인

### Cloudflare D1 Console에서 실행
https://dash.cloudflare.com → Workers & Pages → D1 → DB 선택 → Console

```sql
-- 1. 학원 테이블 확인
SELECT COUNT(*) as academy_count FROM Academy;

-- 2. 학원장 사용자 확인
SELECT COUNT(*) as director_count FROM User WHERE role = 'DIRECTOR';

-- 3. 학원 + 학원장 조인 확인
SELECT 
  a.id as academy_id,
  a.name as academy_name,
  u.name as director_name,
  u.email as director_email
FROM Academy a
LEFT JOIN User u ON a.directorId = u.id
LIMIT 5;
```

### 예상 결과:
- `academy_count` > 0 (학원이 있어야 함)
- `director_count` > 0 (학원장이 있어야 함)
- 조인 결과에 실제 데이터가 나와야 함

---

## 🔍 2단계: 브라우저 개발자 도구 확인

### Console에서 실행:
```javascript
// 1. 토큰 확인
console.log('Token:', localStorage.getItem('token'));

// 2. API 직접 호출 테스트
const token = localStorage.getItem('token');
fetch('/api/admin/academies', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('✅ API Response:', data);
  console.log('📊 Academy count:', data.academies?.length);
  console.log('📋 Academies:', data.academies);
})
.catch(err => console.error('❌ API Error:', err));
```

### Network 탭 확인:
1. 페이지 새로고침
2. Network 탭에서 `academies` 요청 찾기
3. Status Code 확인:
   - **200**: 성공 → Response 탭에서 데이터 확인
   - **401**: 인증 실패 → 다시 로그인 필요
   - **500**: 서버 오류 → Response 탭에서 에러 메시지 확인

---

## 🛠️ 3단계: 일반적인 문제 해결

### ❌ 문제 1: "academies: []" (빈 배열)
**원인**: 데이터베이스에 학원 데이터가 없음

**해결**:
```sql
-- D1 Console에서 실행
-- 테스트 학원 데이터 삽입 (필요한 경우)
-- 주의: 실제 학원 데이터가 있다면 이 단계 건너뛰기!

SELECT * FROM Academy;
-- 결과가 없다면 학원 데이터가 없는 것임
```

### ❌ 문제 2: "401 Unauthorized"
**원인**: 토큰이 없거나 만료됨

**해결**:
1. `localStorage.clear()` 실행
2. 로그아웃
3. 다시 로그인 (admin@superplace.com / admin1234)
4. 페이지 재접속

### ❌ 문제 3: "500 Internal Server Error"
**원인**: 서버 에러 (DB 쿼리 실패 등)

**해결**:
1. Cloudflare Pages 로그 확인:
   - https://dash.cloudflare.com → Workers & Pages → superplacestudy → Logs
2. Console에서 에러 메시지 확인
3. Academy 또는 User 테이블 스키마 확인:
```sql
PRAGMA table_info(Academy);
PRAGMA table_info(User);
```

---

## 🔄 4단계: 배포 확인

### 최신 배포 확인:
1. https://dash.cloudflare.com → Workers & Pages → superplacestudy
2. Latest deployment가 "Success" 상태인지 확인
3. 배포 시간이 최신인지 확인 (5-10분 전)

### 캐시 클리어:
```javascript
// 브라우저에서 실행
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

---

## 📊 5단계: 실시간 디버깅

### Console에서 실시간으로 확인:
```javascript
// 페이지 로드 시 자동으로 찍히는 로그 확인
// ✅ 학원 목록 로드 완료: { success: true, academies: [...], total: X }
// 📊 학원 개수: X
// 📋 학원 목록: [...]

// 로그가 안 보이면:
console.log('Current academies state:', 
  document.querySelector('[class*="space-y-6"]')
);
```

---

## 🎯 체크리스트

- [ ] D1 Console에서 Academy 테이블에 데이터가 있는지 확인
- [ ] D1 Console에서 User 테이블에 DIRECTOR 역할이 있는지 확인
- [ ] 브라우저 Console에서 토큰 확인
- [ ] 브라우저 Console에서 API 직접 호출하여 응답 확인
- [ ] Network 탭에서 `/api/admin/academies` 요청 상태 확인
- [ ] 최신 배포가 완료되었는지 확인 (5-10분 대기)
- [ ] 브라우저 캐시 및 localStorage 클리어 후 재접속

---

## 📞 문제가 계속되면

다음 정보를 제공해주세요:

1. **D1 Console 쿼리 결과**:
   ```sql
   SELECT COUNT(*) FROM Academy;
   SELECT COUNT(*) FROM User WHERE role = 'DIRECTOR';
   ```

2. **브라우저 Console 로그**:
   - "📊 학원 개수: X" 로그
   - "✅ 학원 목록 로드 완료" 로그
   - 에러 메시지 (있다면)

3. **Network 탭 정보**:
   - `/api/admin/academies` 요청의 Status Code
   - Response 내용

---

## 🚀 정상 동작 확인

### 정상 작동 시 나타나야 할 것들:

1. **Console 로그**:
```
📡 Fetching academies from API...
📊 API Response status: 200 true
✅ 학원 목록 로드 완료: {success: true, academies: Array(X), total: X}
📊 학원 개수: X
📋 학원 목록: [Array with academy objects]
```

2. **화면 표시**:
   - 통계 카드: "전체 학원 수", "활성 학원", "전체 학생 수", "전체 선생님 수"
   - 학원 카드 목록: 각 학원의 이름, 학원장, 주소, 학생/선생님 수

3. **Network 탭**:
   - Status: 200 OK
   - Response: `{"success":true,"academies":[...],"total":X}`

---

## 📝 추가 SQL 쿼리 파일

전체 확인용 SQL 쿼리는 `CHECK_ACADEMIES_DATA.sql` 파일을 참고하세요.
