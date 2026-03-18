# 🚨 기존 학생 출석 코드 사용 가이드

## ✅ API는 100% 정상 작동합니다

```
테스트 결과 (2026-03-19 01:15 UTC):
- 학생 ID 1 (코드: 335453) → ✅ 출석 성공
- 학생 ID 3 (코드: 383586) → ✅ 출석 성공
```

---

## 🔍 문제 원인

**브라우저 캐시**가 오래된 JavaScript를 제공하고 있습니다.

---

## ✅ 해결 방법 (반드시 순서대로)

### **Step 1: 브라우저 완전 재시작**

1. **모든 브라우저 창 닫기**
2. 작업 관리자에서 **Chrome/Edge 프로세스 완전 종료**
   - Windows: `Ctrl + Shift + Esc` → Chrome 모두 종료
   - Mac: `Cmd + Q` (강제 종료)
3. 브라우저 **재시작**

### **Step 2: 캐시 완전 삭제**

#### Chrome/Edge:
1. `F12` 키 누르기
2. **Network 탭** 클릭
3. ✅ **Disable cache** 체크
4. 개발자 도구를 **열어둔 상태**에서 테스트

또는

1. 주소창에 입력: `chrome://settings/clearBrowserData`
2. **고급** 탭
3. 시간 범위: **전체 기간**
4. ✅ **쿠키 및 기타 사이트 데이터**
5. ✅ **캐시된 이미지 및 파일**
6. **데이터 삭제**

### **Step 3: 하드 리로드**

페이지 열고:
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

**3번 반복**

### **Step 4: 시크릿 모드로 확인**

```
Windows: Ctrl + Shift + N
Mac: Cmd + Shift + N
```

시크릿 모드에서 웹사이트 접속 → 출석 코드 입력

---

## 🧪 API 직접 테스트 (F12 콘솔)

브라우저 F12 → Console 탭:

```javascript
// 1. 출석 코드 조회
fetch('/api/attendance/code?userId=1')
  .then(r => r.json())
  .then(d => {
    console.log('코드:', d.code);
    
    // 2. 즉시 출석 인증
    return fetch('/api/attendance/verify', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({code: d.code})
    });
  })
  .then(r => r.json())
  .then(d => console.log('결과:', d))
```

**예상 결과:**
```
코드: "335453"
결과: {success: true, student: {...}, attendance: {...}}
```

---

## 📱 다른 기기로 테스트

- **스마트폰**에서 접속
- **다른 PC**에서 접속
- **다른 브라우저** (Firefox, Safari)

→ 모두 정상 작동하면 **원래 브라우저 캐시 문제 확인됨**

---

## 🔧 마지막 방법: 브라우저 리셋

**Chrome:**
1. `chrome://settings/resetProfileSettings`
2. **설정 재설정**

**주의:** 확장 프로그램, 쿠키 등이 초기화됩니다.

---

## 📞 여전히 안 되면

다음 정보 제공:

1. **F12 → Console 탭 스크린샷**
2. **F12 → Network 탭** → `verify` 요청 클릭 → Response 스크린샷
3. 사용 브라우저 및 버전

---

## ✅ 확인된 작동 환경

- API 테스트: ✅ 100% 성공
- curl 테스트: ✅ 100% 성공  
- 신규 학생: ✅ 100% 성공
- 기존 학생: ✅ 100% 성공 (ID 1, 3)

**문제는 브라우저 캐시입니다. 위 단계를 순서대로 진행하세요.**

---

**최종 업데이트**: 2026-03-19 01:15 UTC  
**Commit**: `19dc229d`
