# 🚨 템플릿 생성 - 최종 완전 가이드

## 현재 상황
- SQL 실행했지만 웹에서 템플릿이 안 보임
- 랜딩페이지 생성 시 템플릿 선택 불가

## 🎯 3가지 해결 방법 (쉬운 순서)

---

## ✅ 방법 1: 웹 UI에서 직접 생성 (가장 간단, 추천!)

### 1단계: 로그인
```
URL: https://superplacestudy.pages.dev/login
계정: admin@superplace.com
비밀번호: admin1234
```

### 2단계: 템플릿 관리 페이지 이동
```
URL: https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates

또는

메뉴: 관리자 → 랜딩페이지 관리 → HTML 템플릿 관리
```

### 3단계: 새 템플릿 만들기
```
버튼: "✨ 새 템플릿 만들기" 클릭
```

### 4단계: 정보 입력

**템플릿 이름:**
```
간단한 학생 리포트 v1.0
```

**설명 (선택):**
```
기본적인 학생 학습 리포트 템플릿
```

**HTML 코드:**
`MINIMAL_TEMPLATE.html` 파일 내용을 복사해서 붙여넣기

### 5단계: 생성하기
```
버튼: "생성하기" 클릭
```

### 6단계: 확인
```
✅ "템플릿이 생성되었습니다" 메시지
✅ 목록에 "간단한 학생 리포트 v1.0" 표시
```

---

## ✅ 방법 2: Cloudflare D1 Console에서 간단 SQL

### 1단계: D1 Console 접속
```
https://dash.cloudflare.com
→ Workers & Pages
→ D1
→ 데이터베이스 선택
→ Console 탭
```

### 2단계: SQL 실행
`SIMPLE_TEMPLATE_INSERT.sql` 파일 내용을 **전체** 복사해서 붙여넣기

### 3단계: Run 버튼 클릭

### 4단계: 결과 확인
```
마지막 쿼리 결과에 템플릿 정보가 표시되어야 함:
- id: template_simple_v1
- name: 간단한 테스트 템플릿
- isDefault: 1
```

### 5단계: 웹에서 확인
```
https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates
→ "간단한 테스트 템플릿" 카드 표시
```

---

## ✅ 방법 3: Wrangler CLI 사용 (고급)

### 1단계: Wrangler 설치
```bash
npm install -g wrangler
```

### 2단계: Cloudflare 로그인
```bash
wrangler login
```

### 3단계: 스크립트 실행
```bash
chmod +x upload_template.sh
./upload_template.sh
```

스크립트가 안내하는 대로:
1. D1 데이터베이스 이름 입력
2. 자동으로 템플릿 업로드
3. 완료 메시지 확인

---

## 🔍 문제 해결

### ❌ 여전히 안 보이는 경우

#### 체크 1: 브라우저 Console 확인
```
F12 → Console 탭

확인할 로그:
📋 Templates API Response: {...}
📋 Templates count: ?

예상:
- count가 0이면 → 템플릿이 DB에 없음
- 401 에러면 → 재로그인 필요
- 500 에러면 → DB 문제
```

#### 체크 2: D1에서 직접 확인
```sql
SELECT * FROM LandingPageTemplate;
```

**결과가 비어있으면:**
- 템플릿이 없음
- 방법 1 또는 방법 2로 다시 생성

**결과가 있으면:**
- 캐시 문제일 수 있음
- 해결: Ctrl+Shift+Del → 캐시 삭제 → 재로그인

#### 체크 3: 토큰 확인
```javascript
// Console에서 실행
localStorage.getItem('token')
```

**null이면:**
- 로그아웃 상태
- 재로그인 필요

**값이 있으면:**
- 토큰 형식 확인
- 파이프(|)로 구분되어야 함

---

## 📊 최종 확인 스크립트

**브라우저 Console에서 실행:**
```javascript
async function checkTemplates() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('❌ 토큰이 없습니다. 재로그인하세요.');
    return;
  }
  
  console.log('✅ 토큰 존재:', token.substring(0, 20) + '...');
  
  try {
    const res = await fetch('/api/landing/templates', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await res.json();
    
    console.log('📊 API 응답:', data);
    console.log('📋 상태:', res.status, res.ok ? '✅' : '❌');
    console.log('🔢 템플릿 개수:', data.templates?.length || 0);
    
    if (data.templates && data.templates.length > 0) {
      console.log('✅ 템플릿 목록:');
      data.templates.forEach(t => {
        console.log(`  - ${t.name} (id: ${t.id})`);
      });
    } else {
      console.warn('⚠️ 템플릿이 없습니다.');
      console.log('💡 해결: 방법 1 (웹 UI)로 템플릿 생성');
    }
  } catch (err) {
    console.error('❌ 에러:', err);
  }
}

checkTemplates();
```

---

## 🎯 예상 성공 시나리오

### 방법 1 성공 시:
```
1. 웹 UI에서 템플릿 생성
2. "생성되었습니다" 메시지
3. 목록에 즉시 표시
4. 랜딩페이지 생성 시 선택 가능
```

### 방법 2 성공 시:
```
1. D1 Console에서 SQL 실행
2. "Query succeeded" 메시지
3. 웹 페이지 새로고침 (Ctrl+F5)
4. 템플릿 목록에 표시
```

---

## 💡 팁

### 가장 빠른 방법:
```
방법 1 (웹 UI) 사용
→ 복사+붙여넣기만 하면 됨
→ 즉시 확인 가능
→ 에러 메시지 명확
```

### 확실한 방법:
```
방법 1로 생성 후
→ F12 Console에서 확인 스크립트 실행
→ 템플릿 개수 확인
→ 문제 없으면 완료!
```

---

## 📞 여전히 안 될 경우

다음 정보를 제공해주세요:

1. **Console 로그:**
   ```
   F12 → Console → checkTemplates() 실행 결과
   ```

2. **D1 쿼리 결과:**
   ```sql
   SELECT COUNT(*) FROM LandingPageTemplate;
   ```

3. **네트워크 응답:**
   ```
   F12 → Network → /api/landing/templates 클릭
   → Response 탭 내용
   ```

---

## 🎉 성공 기준

### ✅ 이렇게 보이면 성공:

**템플릿 페이지:**
```
□ "간단한 학생 리포트 v1.0" (또는 "간단한 테스트 템플릿")
  📄 기본적인 학생 학습 리포트 템플릿
  [기본 템플릿] 뱃지
  사용 횟수: 0회
  [미리보기] [복사] [수정] [삭제] 버튼들
```

**랜딩페이지 생성 페이지:**
```
6️⃣ HTML 템플릿 선택
□ 간단한 학생 리포트 v1.0 ✓ (선택됨, 보라색 테두리)
  📄 기본적인 학생 학습 리포트 템플릿
  [기본 템플릿] 뱃지
```

**Console 로그:**
```javascript
📋 Templates count: 1
✅ Default template selected: {id: "...", name: "..."}
```

---

**이제 방법 1부터 시도해보세요!** 🚀

가장 쉽고 빠른 방법입니다.
