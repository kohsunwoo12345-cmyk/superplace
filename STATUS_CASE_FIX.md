# 🔧 status 필드 대소문자 불일치 문제 해결

## 문제 발견
**학생에게 봇을 할당했는데 AI 챗봇에 나타나지 않는 문제!**

### 원인
```javascript
// ❌ 저장 시 (functions/api/admin/ai-bots/assign.ts:529)
status: "active"  // 소문자

// ❌ 조회 시 (functions/api/user/ai-bots.js:51)
WHERE a.status = 'ACTIVE'  // 대문자

// 결과: 대소문자 불일치로 조회 안 됨!
```

## 해결 방법
### 수정된 쿼리 (ai-bots.js)
```javascript
✅ 수정 후:
WHERE a.userId = ?
  AND (LOWER(a.status) = 'active' OR a.status = 'ACTIVE')
  AND date(a.endDate) >= date('now')

// LOWER(a.status) = 'active': 소문자 변환 후 비교
// OR a.status = 'ACTIVE': 대문자도 지원 (하위 호환성)
```

## 배포 정보
- **커밋**: `955cbeee`
- **파일**: `functions/api/user/ai-bots.js`
- **배포 시간**: 2026-03-17
- **적용 예상**: 3-5분 후

## 테스트 시나리오

### 1️⃣ 학원장 봇 할당
1. 학원장 계정 로그인
2. `/dashboard/admin/ai-bots/assign/` 접속
3. "개별 사용자에게 할당" 선택
4. 학생 선택 + AI 봇 선택
5. "할당" 버튼 클릭
6. ✅ 성공 메시지 확인

### 2️⃣ 학생 봇 확인
1. 학생 계정 로그인 (`student_1773655529913@temp.superplace.local`)
2. `https://suplacestudy.com/ai-chat/` 접속
3. **하드 리프레시**: `Ctrl+Shift+R` / `Cmd+Shift+R`
4. F12 콘솔 확인:

```
✅ 예상 로그:
🎓 학생 모드: userId=student-xxx - 개별 할당 봇만 조회
✅ 개별 학생 할당 봇: 1개 (또는 할당된 개수)

API 응답:
{
  "success": true,
  "bots": [
    {
      "id": "bot-xxx",
      "name": "고3 수능 단어 암기 스피드체커",
      ...
    }
  ],
  "count": 1
}
```

5. **봇 목록 확인**:
   - ✅ 학원장이 할당한 봇이 왼쪽 사이드바에 표시됨
   - ✅ 할당되지 않은 봇은 표시 안 됨

## 데이터베이스 확인 (Cloudflare D1)
```sql
-- 학생에게 할당된 봇 확인
SELECT 
  id, botId, botName, userId, userName, 
  status, startDate, endDate, dailyUsageLimit
FROM ai_bot_assignments 
WHERE userId = 'student-1773655529913-mreqe9a5qf'
ORDER BY createdAt DESC;

-- 결과 예시:
-- status = 'active' (소문자)
-- endDate = '2027-03-17' (미래 날짜)
```

## 영향 범위
| 구분 | 변경 전 | 변경 후 |
|------|---------|---------|
| **할당 API** | status = 'active' 저장 | (변경 없음) |
| **조회 API** | WHERE status = 'ACTIVE' | WHERE (LOWER(status) = 'active' OR status = 'ACTIVE') |
| **학생 봇 표시** | ❌ 조회 안 됨 | ✅ 정상 조회 |

## 관련 파일
- `functions/api/admin/ai-bots/assign.ts`: 봇 할당 API (status = 'active' 저장)
- `functions/api/user/ai-bots.js`: 봇 조회 API (대소문자 구분 없이 조회)

## 핵심 요약
| 항목 | 내용 |
|------|------|
| **문제** | status 필드 대소문자 불일치 (저장: active, 조회: ACTIVE) |
| **원인** | assign.ts는 소문자, ai-bots.js는 대문자로 조회 |
| **해결** | LOWER(status) = 'active' OR status = 'ACTIVE' 조건 추가 |
| **결과** | 학생이 할당받은 봇을 정상적으로 볼 수 있음 |

---
**배포 완료 후 3-5분 대기, 학생 계정으로 테스트 필수!** 🚀
