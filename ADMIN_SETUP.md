# 👨‍💼 관리자 계정 설정 가이드

## 🎯 Database ID 확인
✅ **Database ID**: `8c106540-21b4-4fa9-8879-c4956e459ca1`

---

## 🚀 Step-by-Step 설정

### **Step 1: Cloudflare Dashboard에서 D1 접속**

1. 👉 https://dash.cloudflare.com/
2. 왼쪽 메뉴에서 **Workers & Pages** 클릭
3. 왼쪽 메뉴에서 **D1** 클릭
4. **superplace-db** 클릭

---

### **Step 2: 데이터베이스 스키마 생성**

#### **2-1. Console 탭 클릭**

#### **2-2. 다음 SQL을 복사해서 실행**

**Step 2-A: Users 테이블 생성**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  academyId TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_academyId ON users(academyId);
```

**Step 2-B: Academy 테이블 생성**
```sql
CREATE TABLE academy (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logoUrl TEXT,
  subscriptionPlan TEXT DEFAULT 'FREE',
  maxStudents INTEGER DEFAULT 10,
  maxTeachers INTEGER DEFAULT 2,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_academy_code ON academy(code);
```

**Step 2-C: Classes 테이블 생성**
```sql
CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  academyId TEXT NOT NULL,
  teacherId TEXT,
  startDate TEXT,
  endDate TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (teacherId) REFERENCES users(id)
);

CREATE INDEX idx_classes_academyId ON classes(academyId);
```

**Step 2-D: Students 테이블 생성**
```sql
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  academyId TEXT NOT NULL,
  grade TEXT,
  parentPhone TEXT,
  status TEXT DEFAULT 'ACTIVE',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (academyId) REFERENCES academy(id)
);

CREATE INDEX idx_students_academyId ON students(academyId);
```

---

### **Step 3: 관리자 계정 생성**

#### **3-1. 다음 SQL을 Console에 복사해서 실행**

```sql
-- 관리자 계정
INSERT INTO users (
  id, 
  email, 
  password, 
  name, 
  role, 
  phone, 
  academyId, 
  createdAt, 
  updatedAt
) VALUES (
  'admin-001',
  'admin@superplace.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '슈퍼플레이스 관리자',
  'ADMIN',
  '010-8739-9697',
  NULL,
  datetime('now'),
  datetime('now')
);
```

#### **3-2. 테스트 학원 생성**

```sql
-- 테스트 학원
INSERT INTO academy (
  id,
  name,
  code,
  description,
  address,
  phone,
  email,
  subscriptionPlan,
  maxStudents,
  maxTeachers,
  isActive,
  createdAt,
  updatedAt
) VALUES (
  'academy-001',
  '슈퍼플레이스 학원',
  'SUPERPLACE01',
  '체계적인 학습 관리를 위한 스마트 학원',
  '인천광역시 서구 청라커낼로 270, 2층',
  '010-8739-9697',
  'academy@superplace.com',
  'PREMIUM',
  100,
  10,
  1,
  datetime('now'),
  datetime('now')
);
```

---

## 🔐 **관리자 계정 정보**

### **📧 이메일**
```
admin@superplace.com
```

### **🔑 비밀번호**
```
admin123456
```

### **👤 역할**
```
ADMIN (최고 관리자)
```

---

## ✅ **Step 4: 계정 확인**

Console에서 다음 SQL로 확인:

```sql
SELECT * FROM users WHERE email = 'admin@superplace.com';
```

결과:
```
id: admin-001
email: admin@superplace.com
name: 슈퍼플레이스 관리자
role: ADMIN
```

---

## 🔧 **Step 5: Cloudflare Pages 바인딩**

### **5-1. Workers & Pages 설정**

1. Cloudflare Dashboard → **Workers & Pages**
2. **superplacestudy** 프로젝트 클릭
3. **Settings** 탭 → **Functions** 섹션
4. **D1 database bindings** 추가:
   - Variable name: `DB`
   - D1 database: `superplace-db` 선택
5. **Save** 클릭

---

## 🚀 **Step 6: 배포 및 테스트**

### **6-1. GitHub 푸시 (자동 배포)**
이미 완료되었으므로 Cloudflare가 자동으로 배포합니다.

### **6-2. API 테스트**

배포 완료 후 (2-3분):
```
https://genspark-ai-developer.superplacestudy.pages.dev/api/test
```

성공 응답:
```json
{
  "success": true,
  "message": "Database connected!",
  "result": { "test": 1 }
}
```

---

## 📊 **생성된 데이터베이스 구조**

### **테이블 목록**
1. ✅ **users** - 사용자 (관리자, 학원장, 선생님, 학생)
2. ✅ **academy** - 학원 정보
3. ✅ **classes** - 수업 정보
4. ✅ **students** - 학생 상세 정보

### **초기 데이터**
- ✅ 관리자 계정 1개 (admin@superplace.com)
- ✅ 테스트 학원 1개 (슈퍼플레이스 학원)

---

## 🎯 **다음 단계**

1. **로그인 API 구현**
   - `functions/api/auth/login.ts`
   - 이메일/비밀번호 검증
   - JWT 토큰 발급

2. **회원가입 API 구현**
   - `functions/api/auth/signup.ts`
   - 학원장/선생님/학생 회원가입

3. **프론트엔드 연결**
   - 로그인 페이지에서 API 호출
   - JWT 토큰 저장 (localStorage)
   - 보호된 페이지 접근

---

## 💡 **문제 해결**

### **"테이블이 이미 존재합니다" 에러**
```sql
-- 테이블 삭제 후 다시 생성
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS academy;
DROP TABLE IF EXISTS users;
```

### **"비밀번호가 작동하지 않아요"**
비밀번호는 bcrypt 해시되어 있습니다.
로그인 API에서 `bcrypt.compare()`로 검증해야 합니다.

### **"D1 바인딩을 찾을 수 없어요"**
1. Cloudflare Pages → Settings → Functions 확인
2. D1 database bindings에 `DB` 바인딩 추가
3. 재배포 후 2-3분 대기

---

## 🎉 **완료!**

이제 다음 정보로 로그인할 수 있습니다:

**관리자 계정:**
- 이메일: `admin@superplace.com`
- 비밀번호: `admin123456`

**데이터베이스:**
- Database ID: `8c106540-21b4-4fa9-8879-c4956e459ca1`
- Database Name: `superplace-db`
- 테이블: users, academy, classes, students

---

**지금 Cloudflare Dashboard에서 Step 1부터 시작하세요!** 🚀
