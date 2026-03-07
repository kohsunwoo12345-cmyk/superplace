# Solapi 템플릿 검증 가이드

## 📋 템플릿 1 정보

### 코드에 정의된 내용
```
템플릿 코드: KA01TP230126085130773ZHclHN4i674
템플릿 이름: 기본 템플릿 1
내용: "안녕하세요 #{name}님, 기본 템플릿 1입니다."
변수: name
```

### ⚠️ 검증 필요 사항

#### 1. Solapi 대시보드 확인
https://console.solapi.com → 카카오 알림톡 → 템플릿 관리

확인 항목:
- [ ] 템플릿 코드 `KA01TP230126085130773ZHclHN4i674`가 존재하는가?
- [ ] 채널 `wearesuperplace`에 연결되어 있는가?
- [ ] 승인 상태가 `APPROVED`인가?
- [ ] 템플릿 내용이 정확히 일치하는가?

#### 2. 실제 Solapi 템플릿 내용

**예상 내용:**
```
안녕하세요 #{name}님, 기본 템플릿 1입니다.
```

**만약 다르다면:**
- 실제 Solapi 템플릿 내용을 확인하여 코드 수정 필요
- `src/app/dashboard/kakao-alimtalk/send/page.tsx` 파일의 `defaultTemplates` 배열 수정

#### 3. 변수 매핑 확인

Solapi API가 기대하는 형식:
```json
{
  "variables": {
    "name": "테스트사용자"
  }
}
```

우리 코드가 보내는 형식:
```json
{
  "variables": {
    "name": "테스트사용자",
    "이름": "테스트사용자",
    "학생이름": "테스트사용자"
  }
}
```

✅ 모든 형식을 지원하므로 문제없음!

---

## 🔍 실제 템플릿 내용 확인 방법

### 방법 1: Solapi 콘솔 로그인
1. https://console.solapi.com 접속
2. 카카오 알림톡 → 템플릿 관리
3. 템플릿 코드로 검색: `KA01TP230126085130773ZHclHN4i674`
4. 템플릿 내용 확인

### 방법 2: Solapi API 직접 호출
```bash
# Solapi API로 템플릿 목록 조회
curl -X GET "https://api.solapi.com/kakao/v2/templates" \
  -H "Authorization: HMAC-SHA256 apiKey=YOUR_API_KEY, date=DATE, salt=SALT, signature=SIGNATURE"
```

---

## 🚀 발송 테스트 실행

```bash
cd /home/user/webapp
chmod +x send-template1-wearesuperplace.sh
bash send-template1-wearesuperplace.sh
```

### 예상 결과

#### ✅ 성공 시:
```
✅ 발송 성공!

📱 01085328739 번호로 카카오 알림톡이 발송되었습니다!
💬 메시지: 안녕하세요 테스트사용자님, 기본 템플릿 1입니다.

📲 카카오톡 앱을 확인해주세요!
```

#### ❌ 실패 시 확인 사항:

**1. "MessagesNotFound" 오류**
→ 채널 또는 템플릿 설정 문제
→ Solapi 대시보드에서 채널 `wearesuperplace` 확인

**2. "InvalidTemplate" 오류**
→ 템플릿 코드가 잘못됨 또는 승인되지 않음
→ Solapi 대시보드에서 템플릿 상태 확인

**3. "VariableMismatch" 오류**
→ 템플릿 내용과 변수가 불일치
→ 실제 템플릿 내용 확인 필요

**4. "Unauthorized" 오류**
→ API 키 문제
→ Cloudflare Pages 환경 변수 확인

---

## 📝 템플릿 내용 수정이 필요한 경우

실제 Solapi 템플릿 내용이 다르다면:

```typescript
// src/app/dashboard/kakao-alimtalk/send/page.tsx

const defaultTemplates: Template[] = [
  {
    id: 'default-1',
    templateCode: 'KA01TP230126085130773ZHclHN4i674',
    templateName: '기본 템플릿 1',
    content: '실제 Solapi 템플릿 내용을 여기에 붙여넣기',  // ← 수정
    solapiTemplateId: 'KA01TP230126085130773ZHclHN4i674',
    variables: 'name'  // 또는 실제 사용하는 변수명
  },
  // ...
];
```

---

## 🎯 체크리스트

발송 전 확인:
- [ ] 채널 ID: `wearesuperplace`
- [ ] 템플릿 코드: `KA01TP230126085130773ZHclHN4i674`
- [ ] 템플릿 승인 상태: `APPROVED`
- [ ] 템플릿 내용 일치 확인
- [ ] 수신자 전화번호: `01085328739`
- [ ] API 키 설정 확인

발송 후 확인:
- [ ] API 응답 확인
- [ ] 카카오톡 앱에서 메시지 수신 확인
- [ ] 랜딩페이지 URL 작동 확인 (템플릿 1은 URL 없음)

---

**준비 완료! 이제 발송 테스트를 실행하세요.**
