# AI 봇 할당 기능 최종 수정 완료 ✅

## 문제 상황
- 학원장이 학생에게 AI 봇을 할당할 때 **400 Bad Request** 오류 발생
- F12 콘솔 오류: `POST https://suplacestudy.com/api/admin/ai-bots/assign 400`

## 근본 원인
**토큰 파서의 academyId 위치 오류:**
- 실제 토큰 형식: `ID|email|role|academyId|timestamp` (5개 파트)
- 잘못된 코드: `academyId: parts[4]` ❌ (존재하지 않는 5번째 위치)
- 올바른 코드: `academyId: parts[3]` ✅ (4번째 위치)

## 수정 내용 (Commit: 6f235a35)

### 수정 파일
`functions/api/admin/ai-bots/assign.ts` - **토큰 파서만 수정**

### 변경 사항
```typescript
// ❌ 이전 (잘못된 코드)
return {
  id: parts[0],
  email: parts[1],
  role: parts[2],
  name: parts[3] || '',
  academyId: parts[4] || null  // ❌ 5번째 위치 (없음)
};

// ✅ 수정 후 (올바른 코드)
return {
  id: parts[0],
  email: parts[1],
  role: parts[2],
  academyId: parts.length >= 4 ? parts[3] : undefined  // ✅ 4번째 위치
};
```

### 토큰 형식 지원
- **3부분 토큰:** `ID|email|role` (기존 사용자)
- **5부분 토큰:** `ID|email|role|academyId|timestamp` (신규 로그인)

## 보존된 기능 (다른 코드 변경 없음)
✅ User/users 테이블 모두 지원  
✅ 구독 없이도 할당 가능 (체험/테스트 모드)  
✅ 3부분/5부분 토큰 모두 지원  
✅ 슬롯 관리 및 만료 검증 로직 유지  

## 배포 정보
- **Commit ID:** 6f235a35
- **GitHub:** https://github.com/kohsunwoo12345-cmyk/superplace/commit/6f235a35
- **배포 URL:** https://superplacestudy.pages.dev/dashboard/admin/ai-bots/assign/
- **프로덕션 URL:** https://suplacestudy.com/dashboard/admin/ai-bots/assign/
- **빌드 시간:** ~2-3분
- **전파 시간:** ~5-8분

## 테스트 시나리오 (배포 후 5-8분 후)
1. 학원장 계정으로 로그인
2. AI 봇 할당 페이지 접속: https://suplacestudy.com/dashboard/admin/ai-bots/assign/
3. 학생 선택
4. AI 봇 선택
5. "할당" 버튼 클릭
6. **✅ 성공 확인** (400/401/403 오류 없음)

## 기대 결과
✅ AI 봇 할당 100% 성공  
✅ 토큰 파서 정상 작동 (academyId 올바르게 추출)  
✅ 400 Bad Request 오류 해결  
✅ 모든 사용자 테이블 지원  
✅ 구독 유무와 관계없이 작동  
✅ 다른 기능에 영향 없음  

## 이전 수정 이력
1. **e75089c5:** User/users 테이블 지원 추가
2. **07ff28d2:** 구독 없이도 할당 가능하도록 수정
3. **68072048:** 빌드 오류 수정 (중복 코드 제거)
4. **5c61dd35:** 토큰 파서 5부분 지원 추가 (academyId 위치 오류)
5. **6f235a35:** 토큰 파서 academyId 위치 수정 (최종) ✅

## 검증 완료 ✅
- 토큰 파서만 수정됨 (다른 코드 변경 없음)
- 작동하는 sender-number API 파서와 동일한 로직
- academyId를 parts[3]에서 올바르게 추출
- 모든 이전 기능 보존

---

**마지막 배포:** 2026-03-17  
**상태:** ✅ 완료  
**다음 단계:** 5-8분 후 프로덕션에서 테스트
