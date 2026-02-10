# 사용자 테스트 가이드 📋

## 🎯 최종 수정 사항 (2026-02-10)

**문제:** 파일 업로드 경로에서 이미지 압축이 적용되지 않아 2.3MB, 2.4MB 이미지가 그대로 전송되어 SQLITE_TOOBIG 에러 발생

**해결:** `attendance-verify/page.tsx`의 `handleFileUpload()` 함수에 압축 로직 추가 (commit b761f53)

---

## ✅ 배포 대기 중

**현재 상태:**
- Commit: `b761f53` - "fix: 파일 업로드 시에도 이미지 압축 적용"
- Branch: `main`
- 배포 시간: 약 5-7분 소요

**배포 확인 방법:**
1. Cloudflare Pages 대시보드 접속: https://dash.cloudflare.com
2. Workers & Pages → superplace 프로젝트 선택
3. "Deployments" 탭에서 최신 배포 상태 확인
4. "Success" 상태이면 배포 완료

---

## 🧪 테스트 시나리오

### 준비 단계 (필수!)

#### 방법 1: 브라우저 캐시 완전 삭제 (권장)
```
1. Chrome/Edge: Ctrl + Shift + Delete
2. "전체 기간" 선택
3. "캐시된 이미지 및 파일" 체크
4. "데이터 삭제" 클릭
```

#### 방법 2: 시크릿 모드 사용
```
Chrome: Ctrl + Shift + N
Edge: Ctrl + Shift + P
```

#### 방법 3: 강력 새로고침
```
페이지 열고: Ctrl + Shift + R (또는 Ctrl + F5)
```

---

### 테스트 1: 파일 업로드 경로 (가장 중요!)

**URL:** https://superplacestudy.pages.dev/attendance-verify

**절차:**
1. F12 → Console 탭 열기
2. "파일 선택" 버튼 클릭
3. 2-3MB 크기의 이미지 파일 선택 (여러 장 가능)
4. Console에서 다음 메시지 확인:
   ```
   🔄 압축 시도 1: 0.XX MB
   🔄 압축 시도 2: 0.XX MB
   ✅ 파일 업로드 완료, 압축 후 크기: 0.XX MB
   ```
5. "숙제 제출하기" 버튼 클릭
6. "숙제가 제출되었습니다!" 메시지 확인

**예상 결과:**
- ✅ 모든 이미지가 1MB 이하로 압축됨
- ✅ 제출 성공
- ❌ SQLITE_TOOBIG 에러 없음

**실패 시 확인 사항:**
```javascript
// Console에 이 메시지가 나오는지 확인
console.log(`✅ 파일 업로드 완료, 압축 후 크기: ${size}MB`);
```

만약 여전히 이전 로그가 보이면 ("📁 파일 업로드 완료, 크기: 2310339"):
- 캐시를 제대로 지우지 못한 것 → 시크릿 모드 사용

---

### 테스트 2: 카메라 촬영 경로 (기존 기능 확인)

**URL:** https://superplacestudy.pages.dev/homework-check

**절차:**
1. F12 → Console 탭 열기
2. "카메라 켜기" 버튼 클릭
3. 카메라 허용
4. "사진 찍기" 클릭
5. Console에서 다음 메시지 확인:
   ```
   🔧 빌드 버전: 2026-02-10-v2-iterative-compression
   🔄 압축 시도 1: 0.XX MB (품질: 40%)
   ✅ 최종 이미지: 0.XX MB
   ```
6. 여러 장 촬영 후 "숙제 제출하기"

**예상 결과:**
- ✅ 모든 이미지 640px 해상도, 1MB 이하
- ✅ 제출 성공
- ✅ 빌드 버전 로그 확인됨

---

### 테스트 3: 채점 결과 확인

**URL:** https://superplacestudy.pages.dev/dashboard/homework/results

**절차:**
1. 교사 계정으로 로그인
2. 제출된 숙제 목록에서 방금 제출한 항목 클릭
3. "제출된 숙제 사진" 섹션 확인
4. 이미지들이 정상적으로 표시되는지 확인
5. AI 채점 결과 확인

**예상 결과:**
- ✅ 이미지가 정상적으로 로드됨
- ✅ 여러 장의 이미지가 모두 표시됨
- ✅ AI 채점 결과 표시

---

## 🔍 디버깅 체크리스트

### 1. SQLITE_TOOBIG 에러가 여전히 발생하는 경우

**확인 사항:**
```javascript
// Console에서 확인
console.log(`압축 후 크기: ${(imageData.length / 1024 / 1024).toFixed(2)}MB`);
```

**예상 값:**
- Camera 경로: 0.3MB ~ 0.8MB
- File upload 경로: 0.3MB ~ 0.8MB

**1MB 초과 시:**
- 이미지가 극도로 복잡한 경우 (드물게 발생)
- 재촬영 또는 더 간단한 배경에서 촬영

### 2. 압축 로그가 보이지 않는 경우

**원인:**
- 브라우저 캐시 문제
- 이전 JavaScript 파일 실행 중

**해결:**
1. 시크릿 모드에서 테스트
2. 페이지 소스 보기 → `<script src="/_next/static/chunks/pages/...">` 확인
3. 파일명에 `31f512161820c9b8` 해시가 있어야 함
4. `dec457ac25f40c37` (이전 해시)가 보이면 캐시 문제

### 3. 이미지가 로드되지 않는 경우

**원인:**
- `homework_images` 테이블에 데이터가 저장되지 않음
- API `/api/homework/images` 호출 실패

**확인:**
```javascript
// Console에서 확인
console.log(`✅ 이미지 ${count}장 로드 완료`);
```

**D1 데이터베이스 직접 확인:**
```sql
-- Cloudflare Dashboard → D1 → Query
SELECT submissionId, COUNT(*) as count
FROM homework_images
GROUP BY submissionId
ORDER BY createdAt DESC
LIMIT 10;
```

---

## 📊 성공 기준

### ✅ 완전 성공
- [ ] 파일 업로드 시 압축 로그 확인
- [ ] 카메라 촬영 시 압축 로그 확인
- [ ] 모든 이미지 1MB 이하
- [ ] 제출 성공 메시지 확인
- [ ] SQLITE_TOOBIG 에러 없음
- [ ] 채점 결과 페이지에서 이미지 정상 표시

### ⚠️ 부분 성공
- [ ] 카메라는 작동하지만 파일 업로드 실패 → 캐시 문제
- [ ] 제출은 성공했지만 이미지 미표시 → API 문제

### ❌ 실패
- [ ] 여전히 SQLITE_TOOBIG 에러 발생
- [ ] 압축 로그가 전혀 보이지 않음
- [ ] 이미지가 여전히 2MB 이상

---

## 🚀 배포 상태 확인 방법

### Cloudflare Pages 대시보드
```
1. https://dash.cloudflare.com 접속
2. Workers & Pages 선택
3. "superplace" 프로젝트 클릭
4. "Deployments" 탭 확인
```

**최신 배포 정보:**
- Commit: b761f53
- Message: "fix: 파일 업로드 시에도 이미지 압축 적용"
- Branch: main

**Status가 "Success"이면 배포 완료**

### 프로덕션 URL
- https://superplacestudy.pages.dev

**중요:** Preview URL (genspark-ai-developer.superplacestudy.pages.dev)이 아닌 **프로덕션 URL**에서 테스트해야 합니다!

---

## 📝 테스트 결과 보고

테스트 완료 후 다음 정보를 제공해주세요:

1. **배포 상태:**
   - Cloudflare Pages에서 "Success" 확인했는지?

2. **캐시 클리어:**
   - 어떤 방법 사용했는지? (전체 삭제/시크릿 모드/강력 새로고침)

3. **Console 로그:**
   - 파일 업로드 시 압축 로그가 보이는지?
   - 빌드 버전이 `2026-02-10-v2-iterative-compression`인지?

4. **제출 결과:**
   - 제출 성공했는지?
   - SQLITE_TOOBIG 에러가 발생했는지?

5. **이미지 크기:**
   - Console에 표시된 최종 이미지 크기는 얼마인지?

6. **채점 결과:**
   - 이미지가 정상적으로 표시되는지?

---

## 🆘 문제 발생 시

문제가 계속되면 다음 정보를 제공해주세요:

1. Console 전체 로그 (스크린샷)
2. Network 탭에서 `/api/homework/submit` 요청/응답 (스크린샷)
3. 어떤 경로에서 테스트했는지? (카메라/파일 업로드)
4. 사용한 이미지 원본 크기 (MB)

---

**마지막 업데이트:** 2026-02-10
**Commit:** b761f53
**상태:** 배포 대기 중 (5-7분 소요)
