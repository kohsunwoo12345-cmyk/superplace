# 🔍 실제 테스트 필요

## ✅ 데이터베이스 검증 완료

모든 데이터가 정상입니다:
- productId와 ai_bots.id 일치 ✅
- botName 존재 ✅
- isActive = 1 ✅
- 만료 안 됨 ✅

## 🎯 다음 단계: 프론트엔드 확인

### 학원장 계정으로 테스트

1. **학원장 로그인** (꾸메땅학원 또는 검단꾸메땅학원)
2. **/dashboard/admin/ai-bots/assign/ 접속**
3. **F12 콘솔 열기**
4. **페이지 새로고침**

### 확인해야 할 로그

```javascript
// 1. 구독 목록 로드 로그
✅ Academy subscriptions loaded: { subscriptions: [...] }
📊 Subscription count: N
📊 Subscription details: [...]

// 2. 봇 추가 로그
✅ Added X bots from subscriptions to bot list

// 3. 봇 목록 로드 로그
✅ Bots loaded: { bots: [...], count: N }
```

### "AI 봇" 드롭다운 확인

다음 봇들이 나타나야 합니다:
- 고3 수능 단어 암기 스피드체커
- 꾸메땅학원 마전 중학교 2학년 단어암기 스피드체커
- 꾸메땅학원 당하중학교 2학년 단어 암기 스피드 체커

## 🔧 만약 봇이 안 보인다면

### Case 1: API 호출 실패

**Network 탭 확인**:
```
GET /api/user/academy-bot-subscriptions?academyId=academy-1771479246368-5viyubmqk
Status: 200
Response: { success: true, subscriptions: [...] }
```

**해결**: API 응답 전체 복사해서 제공

### Case 2: subscriptions는 있는데 봇 목록에 추가 안 됨

**콘솔 로그 확인**:
```javascript
✅ Academy subscriptions loaded: { subscriptions: [...] }
❌ Added 0 bots from subscriptions to bot list  // ← 문제!
```

**원인**: 
- `sub.botId`가 없거나
- 이미 `botIds`에 있어서 중복으로 판단

**해결**: 
```javascript
// page.tsx 299번 라인 조건 확인
if (sub.botId && !botIds.has(sub.botId)) {
  // 여기서 false가 되는 이유 확인 필요
}
```

### Case 3: 봇 API 호출 자체가 실패

**Network 탭 확인**:
```
GET /api/user/ai-bots?academyId=academy-1771479246368-5viyubmqk
Status: 200
Response: { success: true, bots: [...] }
```

**확인**: bots 배열에 위 봇들이 있는가?

## 📋 보고 양식

다음 정보를 제공해주세요:

### 1. 콘솔 로그
```
(F12 콘솔의 모든 로그 복사)
```

### 2. Network 탭 - academy-bot-subscriptions
```json
{
  "success": true,
  "subscriptions": [...]
}
```

### 3. Network 탭 - ai-bots
```json
{
  "success": true,
  "bots": [...]
}
```

### 4. 실제 화면 상태
- [ ] "AI 봇" 드롭다운에 봇이 몇 개 보이는가?
- [ ] 어떤 봇 이름들이 보이는가?
- [ ] "할당된 봇이 없습니다" 메시지가 보이는가?

---

**중요**: 배포 후 3-5분 대기 후 테스트해주세요!
