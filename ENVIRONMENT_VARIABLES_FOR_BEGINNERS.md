# 🔑 Cloudflare D1 연결 환경변수 설명 (초보자용)

## 🎯 환경변수란?

**환경변수**는 프로그램이 외부 서비스와 연결할 때 필요한 **비밀번호와 주소 모음**입니다.
- 마치 **은행 계좌번호**, **비밀번호**, **은행 지점 주소** 같은 것
- 코드에 직접 쓰면 위험하니까 **안전한 곳(Vercel)**에 따로 보관
- 프로그램이 실행될 때 자동으로 불러와서 사용

---

## 📋 필요한 환경변수 4개 (초보자 설명)

### 1️⃣ CLOUDFLARE_ACCOUNT_ID
**이게 뭔가요?**
- Cloudflare 계정의 **고유 번호** (주민등록번호 같은 것)
- 내가 누구인지 알려주는 ID

**비유하면?**
- 🏦 은행 고객 번호
- 📱 휴대폰 가입자 번호
- 🏠 우편번호 (내 계정의 위치)

**어디서 찾나요?**
1. https://dash.cloudflare.com 접속
2. 아무 사이트나 클릭
3. 주소창을 보면:
   ```
   https://dash.cloudflare.com/abc123def456/...
                              ↑ 이 부분이 Account ID
   ```
4. 또는 홈 화면 오른쪽에 표시됨

**예시**:
```
CLOUDFLARE_ACCOUNT_ID=1a2b3c4d5e6f7g8h9i0j
```

**길이**: 약 32자 (영문자+숫자)

---

### 2️⃣ CLOUDFLARE_D1_DATABASE_ID
**이게 뭔가요?**
- 데이터베이스(회원 정보 저장소)의 **고유 번호**
- 여러 개의 데이터베이스 중 어떤 것을 사용할지 지정

**비유하면?**
- 🏦 은행 계좌번호 (여러 계좌 중 하나)
- 📦 택배 송장번호 (어떤 상자를 열지)
- 📁 파일 저장 위치

**어디서 찾나요?**
이미 알고 계십니다:
```
8c106540-21b4-4fa9-8879-c4956e459ca1
```

**확인 방법** (참고용):
1. https://dash.cloudflare.com 접속
2. 좌측 **"Workers & Pages"** 클릭
3. **"D1"** 탭 클릭
4. 데이터베이스 클릭하면 ID 표시됨

**예시**:
```
CLOUDFLARE_D1_DATABASE_ID=8c106540-21b4-4fa9-8879-c4956e459ca1
```

**형식**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (UUID 형식)

---

### 3️⃣ CLOUDFLARE_API_KEY
**이게 뭔가요?**
- Cloudflare 계정의 **마스터 비밀번호**
- 모든 것에 접근할 수 있는 **만능 열쇠**

**비유하면?**
- 🔑 집 마스터키 (모든 방문 열기)
- 💳 신용카드 비밀번호
- 🔐 금고 비밀번호

**⚠️ 매우 중요!**
- 절대 다른 사람에게 알려주면 안 됨
- GitHub이나 블로그에 올리면 안 됨
- 이 키로 계정의 모든 것을 조작 가능

**어디서 찾나요?**
1. https://dash.cloudflare.com 접속
2. 우측 상단 **프로필 아이콘** 클릭
3. **"My Profile"** 선택
4. 좌측 **"API Tokens"** 클릭
5. 페이지 아래로 스크롤
6. **"API Keys"** 섹션 찾기
7. **"Global API Key"** 옆의 **"View"** 클릭
8. 비밀번호 입력
9. 키 복사 (한 줄짜리 긴 텍스트)

**예시**:
```
CLOUDFLARE_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s
```

**길이**: 약 37자 (영문자+숫자)

---

### 4️⃣ CLOUDFLARE_EMAIL
**이게 뭔가요?**
- Cloudflare 계정에 **로그인할 때 쓰는 이메일 주소**
- Global API Key와 함께 사용해서 "나야, 나!" 하고 인증

**비유하면?**
- 📧 로그인 아이디
- 👤 사용자 이름
- 🎫 회원 카드 번호

**어디서 찾나요?**
Cloudflare에 로그인할 때 쓰는 이메일:
```
your-email@example.com
```

**예시**:
```
CLOUDFLARE_EMAIL=hong@gmail.com
```

---

## 🎨 전체 비유로 이해하기

### 상황: 은행에서 돈 찾기

1. **CLOUDFLARE_ACCOUNT_ID** = 고객 번호
   - "저는 123번 고객입니다"

2. **CLOUDFLARE_D1_DATABASE_ID** = 계좌번호
   - "456-789-012 계좌에서 찾겠습니다"

3. **CLOUDFLARE_API_KEY** = 비밀번호
   - "비밀번호는 ****입니다"

4. **CLOUDFLARE_EMAIL** = 이름/신분증
   - "제 이름은 홍길동입니다"

**은행원**: "고객님, 확인했습니다. 어떤 업무 도와드릴까요?"

---

## 📝 Vercel에 설정하는 방법 (단계별)

### 1단계: Vercel 프로젝트 접속
1. https://vercel.com 접속
2. 로그인
3. **"superplace"** 프로젝트 클릭

### 2단계: 설정 페이지로 이동
1. 상단 메뉴 **"Settings"** 클릭
2. 좌측 메뉴 **"Environment Variables"** 클릭

### 3단계: 변수 추가 (4번 반복)

#### 첫 번째 변수
```
Name:  CLOUDFLARE_ACCOUNT_ID
Value: (위에서 복사한 Account ID)
```
- ✅ Production 체크
- ✅ Preview 체크
- ✅ Development 체크
- **"Save"** 클릭

#### 두 번째 변수
```
Name:  CLOUDFLARE_D1_DATABASE_ID
Value: 8c106540-21b4-4fa9-8879-c4956e459ca1
```
- ✅ Production 체크
- ✅ Preview 체크
- ✅ Development 체크
- **"Save"** 클릭

#### 세 번째 변수
```
Name:  CLOUDFLARE_API_KEY
Value: (위에서 복사한 Global API Key)
```
- ✅ Production 체크
- ✅ Preview 체크
- ✅ Development 체크
- **"Save"** 클릭

#### 네 번째 변수
```
Name:  CLOUDFLARE_EMAIL
Value: your-email@example.com
```
- ✅ Production 체크
- ✅ Preview 체크
- ✅ Development 체크
- **"Save"** 클릭

### 4단계: 재배포
1. 상단 메뉴 **"Deployments"** 클릭
2. 가장 위 (최신) 배포 클릭
3. 오른쪽 위 점 3개 (⋮) 클릭
4. **"Redeploy"** 선택
5. ❌ **"Use existing Build Cache"** 체크 해제
6. **"Redeploy"** 버튼 클릭
7. 2-3분 대기

---

## ✅ 완료 확인

### 배포 완료 후:
1. https://superplace-study.vercel.app/dashboard/admin/users 접속
2. 관리자 로그인:
   ```
   이메일: admin@superplace.com
   비밀번호: admin123!@#
   ```
3. 사용자 목록이 자동으로 나타남!

### 성공 신호:
- 페이지가 정상적으로 로드됨
- 회원가입한 사용자들이 보임
- 학생, 학원장, 선생님이 구분되어 표시됨

---

## ❌ 자주 하는 실수

### 1. 복사할 때 공백 포함
❌ 잘못된 예:
```
CLOUDFLARE_API_KEY= a1b2c3d4...
                  ↑ 앞에 공백
```

✅ 올바른 예:
```
CLOUDFLARE_API_KEY=a1b2c3d4...
```

### 2. 따옴표 추가
❌ 잘못된 예:
```
CLOUDFLARE_EMAIL="hong@gmail.com"
                ↑ 따옴표 불필요
```

✅ 올바른 예:
```
CLOUDFLARE_EMAIL=hong@gmail.com
```

### 3. 환경 체크 안 함
❌ Production만 체크
✅ Production, Preview, Development 모두 체크

### 4. 재배포 안 함
❌ 환경 변수만 추가하고 끝
✅ 반드시 재배포해야 적용됨!

---

## 🔒 보안 주의사항

### 절대 하지 말아야 할 것:

1. ❌ **GitHub에 올리기**
   - 코드에 직접 쓰면 안 됨
   - `.env` 파일도 GitHub에 올리면 안 됨

2. ❌ **카카오톡/메신저로 전송**
   - 다른 사람에게 공유하면 안 됨
   - 스크린샷도 조심

3. ❌ **블로그/커뮤니티 게시**
   - 질문할 때 키 값은 가리기

4. ❌ **개발자 도구/콘솔에 출력**
   - 디버깅할 때도 키 값은 숨기기

### 안전하게 보관하는 방법:

1. ✅ Vercel 환경 변수에만 저장
2. ✅ 비밀번호 관리 프로그램 사용 (1Password, LastPass 등)
3. ✅ 주기적으로 키 갱신
4. ✅ 사용하지 않으면 비활성화

---

## 📞 도움이 필요하신가요?

### 잘 안 될 때 확인할 것:

1. ✅ 4개 변수가 모두 설정되었나?
2. ✅ 오타는 없나?
3. ✅ 공백이나 따옴표는 없나?
4. ✅ 모든 환경(Production/Preview/Development)에 체크했나?
5. ✅ 재배포했나?
6. ✅ 재배포 완료까지 기다렸나? (2-3분)

### 여전히 안 되면:
- Vercel 로그 확인
- 브라우저 콘솔 확인 (F12 누르기)
- 에러 메시지 캡처해서 알려주기

---

## 💡 요약 (한 장으로 정리)

```
┌─────────────────────────────────────────────────┐
│ Vercel 환경 변수 설정 (4개)                    │
├─────────────────────────────────────────────────┤
│                                                 │
│ 1. CLOUDFLARE_ACCOUNT_ID                        │
│    = 계정 고유번호 (32자 정도)                  │
│    📍 Dashboard URL에서 확인                    │
│                                                 │
│ 2. CLOUDFLARE_D1_DATABASE_ID                    │
│    = 8c106540-21b4-4fa9-8879-c4956e459ca1      │
│    📦 데이터베이스 번호                         │
│                                                 │
│ 3. CLOUDFLARE_API_KEY                           │
│    = 비밀번호 (37자 정도)                       │
│    🔑 My Profile → API Keys에서 View           │
│    ⚠️  절대 공유 금지!                         │
│                                                 │
│ 4. CLOUDFLARE_EMAIL                             │
│    = 로그인 이메일                              │
│    📧 your-email@example.com                   │
│                                                 │
├─────────────────────────────────────────────────┤
│ 💾 저장 후 ➜ 🔄 재배포 ➜ ⏰ 2-3분 대기       │
└─────────────────────────────────────────────────┘
```

---

**최종 업데이트**: 2026-01-30
**대상**: 비개발자 초보자
**난이도**: ⭐ (매우 쉬움)
