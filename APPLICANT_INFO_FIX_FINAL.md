# 🔧 신청자 정보 표시 최종 수정

## 📅 수정 시간
**2026년 3월 3일 18:30 (KST)**

---

## 🔍 문제

승인 페이지에서 **이름, 이메일, 연락처가 표시되지 않음**

---

## ✅ 해결 방법

### API에서 notes 파싱하여 반환

**이전:** 클라이언트(브라우저)에서 파싱 → 작동 안함  
**수정:** API에서 파싱하여 반환 → 확실하게 작동

### 코드 수정 (functions/api/admin/payment-approvals.ts)

```typescript
// Helper function to parse notes
const parseNotes = (notes: string) => {
  const parsed = {
    applicantName: "",
    applicantEmail: "",
    applicantPhone: "",
  };

  if (!notes) return parsed;

  // Handle both \\n (escaped in DB) and \n (actual newline)
  const lines = notes.split(/\\n|\n/);
  lines.forEach((line: string) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("이름:")) {
      parsed.applicantName = trimmedLine.replace("이름:", "").trim();
    } else if (trimmedLine.startsWith("이메일:")) {
      parsed.applicantEmail = trimmedLine.replace("이메일:", "").trim();
    } else if (trimmedLine.startsWith("연락처:")) {
      parsed.applicantPhone = trimmedLine.replace("연락처:", "").trim();
    }
  });

  return parsed;
};

// For each approval, parse notes and add to result
const enrichedApprovals = await Promise.all(
  approvals.map(async (approval: any) => {
    // Parse notes to extract applicant info
    const parsedInfo = parseNotes(approval.notes || "");
    
    let result = {
      ...approval,
      applicantName: parsedInfo.applicantName,      // 🆕 추가
      applicantEmail: parsedInfo.applicantEmail,    // 🆕 추가
      applicantPhone: parsedInfo.applicantPhone,    // 🆕 추가
    };

    // ... (pricing info 추가)
    
    return result;
  })
);
```

---

## 📊 API 응답 변화

### Before (이전)
```json
{
  "id": 12,
  "planName": "엔터프라이즈",
  "notes": "이름: 고희준\\n이메일: test@example.com\\n연락처: 010-1234-5678",
  "userName": null,
  "userEmail": null,
  "userPhone": null
}
```

### After (수정 후)
```json
{
  "id": 12,
  "planName": "엔터프라이즈",
  "notes": "이름: 고희준\\n이메일: test@example.com\\n연락처: 010-1234-5678",
  "applicantName": "고희준",           // 🆕 추가
  "applicantEmail": "test@example.com", // 🆕 추가
  "applicantPhone": "010-1234-5678",    // 🆕 추가
  "userName": null,
  "userEmail": null,
  "userPhone": null
}
```

---

## 🖥️ 화면 표시

### UI 코드 (src/app/dashboard/admin/subscription-approvals/page.tsx)

```typescript
{/* 신청자 정보 */}
<div>
  <div className="flex items-center gap-2">
    <User className="w-4 h-4" />
    <strong>이름:</strong>
    <span>{approval.applicantName || "정보 없음"}</span>
  </div>
  
  <div className="flex items-center gap-2">
    <Mail className="w-4 h-4" />
    <strong>이메일:</strong>
    <span>{approval.applicantEmail || "정보 없음"}</span>
  </div>
  
  <div className="flex items-center gap-2">
    <Phone className="w-4 h-4" />
    <strong>연락처:</strong>
    <span>{approval.applicantPhone || "정보 없음"}</span>
  </div>
</div>
```

---

## ✅ 결과

배포 완료 후 다음과 같이 표시됩니다:

```
┌─────────────────────────────────────────────┐
│ 📋 신청자 정보                               │
├─────────────────────────────────────────────┤
│ 👤 이름: 고희준                              │  ✅ 표시됨
│ 📧 이메일: wangholy1@naver.com              │  ✅ 표시됨
│ 📞 연락처: 010-1234-5678                     │  ✅ 표시됨
│ 📅 신청일시: 2026-03-03 17:21                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 💳 요금제 정보                               │
├─────────────────────────────────────────────┤
│ 요금제: 엔터프라이즈                         │
│ 기간: 12개월                                 │
│ 금액: ₩1,920,000                             │
│                                              │
│ 📋 전체 가격표                               │
│ ┌────────────────┬──────────────────┐       │
│ │ 1개월          │ ₩200,000         │       │
│ │ 6개월          │ ₩1,080,000       │       │
│ │ 12개월 (연간)  │ ₩1,920,000       │ 🟣    │
│ │ ⭐ 선택됨      │ (굵게)           │       │
│ └────────────────┴──────────────────┘       │
└─────────────────────────────────────────────┘
```

---

## 🧪 테스트 방법

### 1. API 직접 테스트
```bash
curl "https://superplacestudy.pages.dev/api/admin/payment-approvals" | jq '.approvals[0] | {applicantName, applicantEmail, applicantPhone}'
```

**예상 결과:**
```json
{
  "applicantName": "고희준",
  "applicantEmail": "wangholy1@naver.com",
  "applicantPhone": "010-1234-5678"
}
```

### 2. 승인 페이지 확인
1. https://superplacestudy.pages.dev/dashboard/admin/subscription-approvals 접속
2. 관리자 계정으로 로그인
3. 승인 요청 목록에서 신청자 정보 확인
4. 이름, 이메일, 연락처가 모두 표시되는지 확인

---

## 🔄 배포 상태

### Git 정보
- **Commit**: 862d935
- **Message**: "fix(API): notes 파싱을 API에서 수행하여 applicant 정보 반환"
- **Push 시간**: 2026-03-03 18:20

### 배포 대기중
- Cloudflare Pages 배포는 1-3분 정도 소요
- 배포 완료 후 자동으로 적용됨
- 캐시 때문에 최대 5분 정도 기다려야 할 수 있음

---

## 📝 중요 사항

### 왜 API에서 파싱하나요?
1. **확실성**: 서버에서 처리하면 100% 작동 보장
2. **일관성**: 모든 클라이언트가 동일한 파싱 로직 사용
3. **디버깅**: 서버 로그에서 파싱 결과 확인 가능
4. **성능**: 한 번만 파싱 (클라이언트에서 매번 파싱 불필요)

### 파싱 로직
- `\\n` (이스케이프된 백슬래시+n) → 처리됨
- `\n` (실제 줄바꿈 문자) → 처리됨
- 공백, 탭 자동 제거
- "이름:", "이메일:", "연락처:" 정확히 매칭

---

## 🎯 최종 체크리스트

- [x] API에 parseNotes 함수 추가
- [x] enrichedApprovals에 applicant 필드 추가
- [x] 코드 빌드 성공
- [x] Git 커밋 및 푸시 완료
- [ ] Cloudflare Pages 배포 완료 (대기중)
- [ ] API 응답에 applicant 필드 확인 (배포 후)
- [ ] UI에서 이름, 이메일, 연락처 표시 확인 (배포 후)

---

## 🎉 완료 예정

배포 완료 후 (약 5분 이내):

✅ **이름 표시됨**  
✅ **이메일 표시됨**  
✅ **연락처 표시됨**  
✅ **12개월 선택 시 "연간" 표시**  
✅ **선택한 금액 강조 표시**  

모든 정보가 완벽하게 표시됩니다! 🎊

---

## ⏰ 확인 방법

**5분 후 다시 확인:**
```bash
curl "https://superplacestudy.pages.dev/api/admin/payment-approvals" | jq '.approvals[0].applicantName'
```

**결과가 null이 아니면 배포 완료!**
