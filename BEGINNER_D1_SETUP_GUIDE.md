# 🎓 비개발자를 위한 D1 데이터베이스 설정 가이드

## 📋 목차
1. [시작하기 전에](#시작하기-전에)
2. [1단계: Cloudflare 대시보드 접속](#1단계-cloudflare-대시보드-접속)
3. [2단계: 프로젝트 찾기](#2단계-프로젝트-찾기)
4. [3단계: D1 데이터베이스 연결하기](#3단계-d1-데이터베이스-연결하기)
5. [4단계: 설정 확인](#4단계-설정-확인)
6. [5단계: 로그인 테스트](#5단계-로그인-테스트)
7. [문제 해결](#문제-해결)

---

## 시작하기 전에

### ✅ 준비물
- Cloudflare 계정 (이미 있으시죠?)
- 웹 브라우저 (Chrome, Safari, Edge 등)
- 프로젝트 이름: **superplacestudy**
- 데이터베이스 ID: **8c106540-21b4-4fa9-8879-c4956e459ca1**

### 🎯 목표
두 개의 웹사이트가 **같은 데이터베이스**를 사용하도록 설정하기:
- **웹사이트 1**: https://superplace-academy.pages.dev (기존)
- **웹사이트 2**: https://genspark-ai-developer.superplacestudy.pages.dev (새로운)

**결과**: 두 웹사이트에서 **같은 아이디**로 로그인 가능! 🎉

---

## 1단계: Cloudflare 대시보드 접속

### 1-1. 브라우저에서 접속하기
```
https://dash.cloudflare.com/
```

![Cloudflare 로그인](https://via.placeholder.com/800x400.png?text=Cloudflare+Login+Page)

### 1-2. 로그인하기
- 이메일과 비밀번호를 입력하세요
- 2단계 인증이 있다면 코드를 입력하세요

---

## 2단계: 프로젝트 찾기

### 2-1. 왼쪽 메뉴에서 "Workers & Pages" 클릭
![Workers & Pages 메뉴](https://via.placeholder.com/300x500.png?text=Left+Menu+-+Workers+%26+Pages)

### 2-2. 프로젝트 목록에서 "superplacestudy" 찾기
- 검색창에 "superplacestudy"를 입력하거나
- 목록에서 직접 찾아서 클릭하세요

![프로젝트 선택](https://via.placeholder.com/800x400.png?text=Select+superplacestudy+Project)

---

## 3단계: D1 데이터베이스 연결하기

### 3-1. Settings 탭으로 이동
![Settings Tab](https://via.placeholder.com/800x200.png?text=Click+Settings+Tab)

프로젝트 페이지 상단에 여러 탭이 보입니다:
- Deployments
- **Settings** ← 이것을 클릭하세요!
- Functions
- 등...

### 3-2. Functions 섹션 찾기
Settings 페이지를 아래로 스크롤하면 여러 섹션이 나옵니다:
- Environment variables
- Build configuration
- **Functions** ← 여기를 찾으세요!

![Functions Section](https://via.placeholder.com/800x400.png?text=Find+Functions+Section)

### 3-3. D1 database bindings 찾기
Functions 섹션 안에서 **"D1 database bindings"**를 찾으세요

![D1 Bindings](https://via.placeholder.com/800x300.png?text=D1+Database+Bindings+Section)

### 3-4. Add binding 버튼 클릭
**"Add binding"** 버튼을 클릭하세요
(또는 "Add" 버튼일 수도 있습니다)

![Add Binding Button](https://via.placeholder.com/400x200.png?text=Click+Add+Binding)

### 3-5. 정보 입력하기
팝업창이 나타나면 다음 정보를 입력하세요:

#### 📝 입력 필드 1: Variable name (변수 이름)
```
DB
```
⚠️ **중요**: 반드시 대문자로 `DB`를 입력하세요! (소문자 `db` ❌)

#### 📝 입력 필드 2: D1 database (데이터베이스 선택)
드롭다운 메뉴에서 데이터베이스를 선택하세요.

**데이터베이스 ID가 이것인지 확인하세요**:
```
8c106540-21b4-4fa9-8879-c4956e459ca1
```

**이름은 이럴 수 있습니다**:
- `superplace-db`
- `superplace-academy-db`
- 또는 다른 이름

![Fill Binding Info](https://via.placeholder.com/600x400.png?text=Variable+name:+DB%0AD1+database:+Select+from+dropdown)

### 3-6. Save 버튼 클릭
모든 정보를 입력했으면 **"Save"** 버튼을 클릭하세요!

![Save Button](https://via.placeholder.com/300x100.png?text=Click+Save)

### 3-7. 자동 배포 시작
Save 버튼을 누르면 자동으로 새로운 배포가 시작됩니다! 🚀

![Auto Deploy](https://via.placeholder.com/800x200.png?text=Automatic+Deployment+Started)

---

## 4단계: 설정 확인

### 4-1. 배포 상태 확인
- 상단 메뉴에서 **"Deployments"** 탭을 클릭하세요
- 가장 최근 배포 상태를 확인하세요

![Check Deployment](https://via.placeholder.com/800x400.png?text=Check+Latest+Deployment+Status)

### 4-2. 배포 완료 대기
⏱️ **소요 시간**: 약 1-2분

배포 상태가 다음과 같이 바뀌는지 확인하세요:
- 🟡 "Building..." → 빌드 중
- 🟢 "Success" → 완료!

### 4-3. D1 바인딩 확인
다시 **Settings → Functions → D1 database bindings**로 가서 다음을 확인하세요:

```
✅ Variable name: DB
✅ D1 database: [선택한 데이터베이스 이름]
✅ Database ID: 8c106540-21b4-4fa9-8879-c4956e459ca1
```

![Confirm Binding](https://via.placeholder.com/800x300.png?text=Confirm+D1+Binding+Added)

---

## 5단계: 로그인 테스트

### 5-1. 로그인 페이지 접속
브라우저 새 탭에서 다음 주소로 접속하세요:
```
https://genspark-ai-developer.superplacestudy.pages.dev/login
```

### 5-2. 기존 계정으로 로그인
**superplace-academy.pages.dev**에서 사용하던 **아이디와 비밀번호**를 입력하세요

![Login Test](https://via.placeholder.com/600x400.png?text=Login+with+Your+Account)

### 5-3. 로그인 성공 확인
✅ **성공 시**: 자동으로 `/dashboard`로 이동합니다
❌ **실패 시**: [문제 해결](#문제-해결) 섹션을 참고하세요

---

## 문제 해결

### ❌ 문제 1: "로그인 처리 중 오류가 발생했습니다"

#### 원인
D1 바인딩이 제대로 설정되지 않았을 수 있습니다.

#### 해결 방법
1. **Settings → Functions → D1 database bindings** 다시 확인
2. Variable name이 **정확히 `DB`**인지 확인 (대문자!)
3. 데이터베이스 ID가 **8c106540-21b4-4fa9-8879-c4956e459ca1**인지 확인
4. 잘못 설정했다면:
   - 기존 바인딩 옆의 "Delete" 버튼 클릭
   - 다시 "Add binding" 버튼을 눌러 올바르게 설정
   - Save 클릭
   - 1-2분 대기

### ❌ 문제 2: "아이디 또는 비밀번호가 올바르지 않습니다"

#### 원인
계정 정보가 틀렸거나 데이터베이스가 다를 수 있습니다.

#### 해결 방법
1. **superplace-academy.pages.dev**에서 로그인 테스트
   - 같은 아이디/비밀번호로 로그인되는지 확인
2. 로그인 정보를 다시 확인하세요
3. 데이터베이스 ID를 다시 한 번 확인하세요

### ❌ 문제 3: 배포가 실패했습니다

#### 원인
빌드 오류나 설정 문제일 수 있습니다.

#### 해결 방법
1. **Deployments** 탭에서 실패한 배포를 클릭
2. 로그(Logs)를 확인하세요
3. 빨간색 오류 메시지가 있는지 확인
4. 다음 정보를 개발자에게 전달:
   - 오류 메시지 전체
   - 스크린샷
   - 시도한 단계

### ❌ 문제 4: D1 database 목록이 비어있습니다

#### 원인
D1 데이터베이스가 생성되지 않았거나 권한이 없을 수 있습니다.

#### 해결 방법
1. 왼쪽 메뉴에서 **"D1"** 클릭
2. 데이터베이스 목록 확인
3. ID가 **8c106540-21b4-4fa9-8879-c4956e459ca1**인 데이터베이스가 있는지 확인
4. 없다면:
   - Cloudflare 계정에 권한이 있는지 확인
   - 다른 계정으로 로그인했는지 확인
   - 개발자에게 문의

---

## 📱 요약 체크리스트

설정을 완료했는지 확인하세요:

- [ ] Cloudflare Dashboard에 로그인했습니다
- [ ] Workers & Pages → superplacestudy 프로젝트를 찾았습니다
- [ ] Settings → Functions → D1 database bindings로 이동했습니다
- [ ] Add binding을 클릭했습니다
- [ ] Variable name에 `DB`를 입력했습니다 (대문자!)
- [ ] D1 database에서 올바른 데이터베이스를 선택했습니다
- [ ] Database ID가 `8c106540-21b4-4fa9-8879-c4956e459ca1`인지 확인했습니다
- [ ] Save 버튼을 클릭했습니다
- [ ] 배포가 완료될 때까지 1-2분 기다렸습니다
- [ ] https://genspark-ai-developer.superplacestudy.pages.dev/login에서 로그인 테스트를 했습니다
- [ ] 기존 계정으로 로그인이 성공했습니다! ✅

---

## 🎉 완료!

축하합니다! 이제 두 웹사이트에서 **같은 계정**으로 로그인할 수 있습니다! 🚀

### 결과 확인
- **웹사이트 1**: https://superplace-academy.pages.dev → 로그인 가능 ✅
- **웹사이트 2**: https://genspark-ai-developer.superplacestudy.pages.dev → 로그인 가능 ✅

### 다음 단계
이제 두 사이트가 **실시간으로 동기화**됩니다:
- 새로운 학생 추가 → 양쪽에서 보임
- 출석 체크 → 양쪽에서 반영
- 설정 변경 → 양쪽에서 동일

---

## 📞 도움이 필요하신가요?

### 스크린샷 찍는 방법
문제가 생기면 **스크린샷**을 찍어서 개발자에게 보내주세요:

**Windows**: `Win` + `Shift` + `S`
**Mac**: `Cmd` + `Shift` + `4`

### 포함할 정보
- 어떤 단계에서 문제가 생겼나요?
- 어떤 오류 메시지가 나타났나요?
- 스크린샷 (가능하면)
- 브라우저 F12를 눌러 나오는 Console 탭의 빨간 메시지

---

**작성일**: 2026-02-03
**버전**: 1.0
**대상**: 비개발자
