# 문자 발송 시스템 업데이트 (2026-02-22)

## 🚀 배포 정보
- **커밋**: `9df92eb`
- **배포 URL**: https://superplacestudy.pages.dev
- **배포 시간**: 약 2-3분 소요

## ✅ 구현 사항

### 1. 수신자 DB 엑셀 파일 업로드 개선
**문제**: 엑셀 파일 업로드가 제대로 작동하지 않음

**해결책**:
- ✅ CSV, 탭 구분 파일 모두 지원
- ✅ UTF-8 및 EUC-KR 인코딩 자동 감지
- ✅ 더 나은 에러 메시지 표시
- ✅ 상세한 로깅으로 디버깅 개선

**API**: `POST /api/recipients/upload-excel`

**파일 형식**:
```
이름, 전화번호, 이메일(선택), 학년(선택), 반(선택)
홍길동, 01012345678, hong@example.com, 중1, A반
김철수, 01098765432, kim@example.com, 중2, B반
```

**지원 형식**:
- Excel CSV (UTF-8)
- Excel CSV (EUC-KR, 한글 윈도우)
- 탭으로 구분된 텍스트
- 일반 CSV

**기능**:
- 첫 번째 줄은 헤더로 자동 건너뜀
- 전화번호 자동 정리 (하이픈 제거)
- 최소 10자리 전화번호 검증
- 빈 줄 자동 건너뜀

### 2. 카카오톡 메시지 실시간 미리보기
**요청**: 카카오톡 메시지를 실제 카카오톡 미리보기가 옆에 나오도록 구현

**구현**:
- ✅ 우측 사이드바에 실시간 카카오톡 미리보기 추가
- ✅ 실제 카카오톡 UI와 유사한 디자인
- ✅ 제목과 내용을 입력하면 즉시 반영
- ✅ 현재 시간 표시
- ✅ 카카오톡 선택 시에만 표시

**위치**: `/dashboard/message-send` 페이지 우측

**UI 구성**:
```
┌─────────────────────────┐
│ 💬 카카오톡 미리보기    │
├─────────────────────────┤
│  ┌──────────────────┐   │
│  │ [제목]           │   │
│  │ [메시지 내용]    │   │
│  │         12:34 오후│   │
│  └──────────────────┘   │
│                         │
│ 💬 실제 발송 화면과    │
│    유사하게 표시됩니다 │
└─────────────────────────┘
```

### 3. URL 통합
**요청**: `https://superplacestudy.pages.dev/dashboard/admin/sms/send/` → `https://superplacestudy.pages.dev/dashboard/message-send`

**변경된 파일**:
1. ✅ `src/app/dashboard/admin/sms/page.tsx` - 3곳
2. ✅ `src/app/dashboard/admin/sms/send/page.tsx` - 1곳
3. ✅ `src/components/layouts/ModernLayout.tsx` - 1곳
4. ✅ `src/components/dashboard/Sidebar.tsx` - 이전에 이미 변경됨

**결과**: 이제 모든 문자 발송 링크가 `/dashboard/message-send`로 통합됨

## 📝 사용 방법

### 엑셀 파일 업로드
1. 문자 발송 페이지 접속: https://superplacestudy.pages.dev/dashboard/message-send
2. "수신자 선택" → "📄 엑셀 파일 업로드" 탭
3. 파일 선택 버튼 클릭
4. CSV 또는 엑셀에서 저장한 CSV 파일 선택
5. 자동으로 수신자 정보 로드

### 카카오톡 미리보기
1. 문자 발송 페이지 접속
2. "카카오톡" 옵션 선택
3. 제목과 내용 입력
4. 우측에 실시간 미리보기 확인
5. 미리보기를 보면서 내용 수정 가능

## 🔧 기술 세부사항

### 엑셀 업로드 API
**파일**: `functions/api/recipients/upload-excel.ts`

**처리 과정**:
1. FormData로 파일 수신
2. UTF-8 또는 EUC-KR로 디코딩
3. 줄 단위로 파싱 (쉼표 또는 탭 구분)
4. 각 줄에서 데이터 추출:
   - studentName (필수)
   - parentPhone (필수, 10자리 이상)
   - email (선택)
   - grade (선택)
   - class (선택)
5. 유효성 검증 후 JSON 반환

**응답 형식**:
```json
{
  "success": true,
  "recipients": [
    {
      "studentName": "홍길동",
      "parentPhone": "01012345678",
      "email": "hong@example.com",
      "grade": "중1",
      "class": "A반"
    }
  ],
  "count": 1,
  "message": "1명의 수신자 정보를 불러왔습니다."
}
```

### 카카오톡 미리보기 UI
**파일**: `src/app/dashboard/message-send/page.tsx`

**스타일**:
- 그라데이션 배경 (파란색 → 밝은 파란색)
- 둥근 모서리 말풍선 (border-radius: 1rem)
- 그림자 효과 (shadow-md)
- 실시간 업데이트 (React state)

**표시 조건**:
```typescript
{messageType === "KAKAO" && (
  <Card className="sticky top-6">
    {/* 미리보기 UI */}
  </Card>
)}
```

## 🧪 테스트 시나리오

### 1. 엑셀 업로드 테스트
- [ ] CSV 파일 업로드 (UTF-8)
- [ ] CSV 파일 업로드 (EUC-KR, 한글 윈도우 엑셀)
- [ ] 탭으로 구분된 파일 업로드
- [ ] 빈 줄이 포함된 파일 업로드
- [ ] 잘못된 형식 파일 업로드 (에러 메시지 확인)
- [ ] 전화번호 형식 확인 (하이픈 자동 제거)

### 2. 카카오톡 미리보기 테스트
- [ ] SMS 선택 시 미리보기 숨김 확인
- [ ] 카카오톡 선택 시 미리보기 표시 확인
- [ ] 제목 입력 시 실시간 반영 확인
- [ ] 내용 입력 시 실시간 반영 확인
- [ ] 긴 메시지 줄바꿈 확인
- [ ] 시간 표시 확인

### 3. URL 통합 테스트
- [ ] 사이드바 "문자 발송" 클릭 → `/dashboard/message-send` 이동 확인
- [ ] 대시보드 카드 클릭 → `/dashboard/message-send` 이동 확인
- [ ] ModernLayout 문자 발송 링크 확인
- [ ] 구 URL 접속 시 리다이렉트 확인 (선택사항)

## 📊 변경된 파일 목록

```
functions/api/recipients/upload-excel.ts          (새 파일, 176줄)
src/app/dashboard/admin/sms/page.tsx              (3개 URL 변경)
src/app/dashboard/admin/sms/send/page.tsx         (1개 URL 변경)
src/app/dashboard/message-send/page.tsx           (미리보기 추가, 39줄 추가)
src/components/layouts/ModernLayout.tsx           (1개 URL 변경)
```

## 🐛 알려진 이슈 및 해결 방법

### 엑셀 업로드 문제
**증상**: "유효한 수신자 정보를 찾을 수 없습니다" 에러

**해결 방법**:
1. 첫 번째 줄에 헤더가 있는지 확인 (예: 이름, 전화번호, 이메일)
2. 데이터가 두 번째 줄부터 시작하는지 확인
3. 전화번호가 최소 10자리인지 확인
4. 파일을 UTF-8 또는 EUC-KR로 저장했는지 확인

### 미리보기가 보이지 않음
**증상**: 카카오톡 미리보기가 표시되지 않음

**해결 방법**:
1. 브라우저 캐시 클리어 (`Ctrl+Shift+R`)
2. "카카오톡" 라디오 버튼이 선택되었는지 확인
3. 배포가 완료될 때까지 2-3분 대기

## 🎯 다음 단계

### 추가 개선 사항 (향후)
- [ ] Excel 바이너리 파일 직접 파싱 (xlsx 라이브러리)
- [ ] 업로드된 수신자 편집 기능
- [ ] 수신자 그룹 저장 기능
- [ ] 미리보기에서 변수 치환 시뮬레이션
- [ ] SMS 미리보기 추가

## 📞 지원

문제가 발생하면:
1. 브라우저 개발자 도구 콘솔 확인
2. 네트워크 탭에서 API 응답 확인
3. 파일 형식 재확인

---

**업데이트 일시**: 2026-02-22
**커밋 해시**: 9df92eb
**배포 상태**: ✅ 완료 (2-3분 후 반영)
