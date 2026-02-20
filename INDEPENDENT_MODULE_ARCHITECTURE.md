# 🏗️ 독립 모듈 시스템 아키텍처 설계

## 📋 핵심 원칙

### 1. 독립성 (Independence)
각 기능 모듈은 **완전히 독립적**으로 작동해야 합니다.
- ✅ 한 모듈의 오류가 다른 모듈에 영향을 주지 않음
- ✅ 각 모듈은 자체 데이터 소스를 가짐
- ✅ 공유 데이터는 읽기 전용으로만 사용

### 2. 느슨한 결합 (Loose Coupling)
모듈 간 연결은 최소화하고, 연결 시에는 인터페이스를 통해서만 통신합니다.
- ✅ 직접 호출 대신 이벤트 기반 통신
- ✅ 데이터 의존성 최소화
- ✅ Fallback 메커니즘 필수

### 3. 장애 격리 (Fault Isolation)
한 모듈의 실패가 전체 시스템에 영향을 주지 않도록 합니다.
- ✅ Try-catch로 모든 모듈 감싸기
- ✅ 에러 발생 시 기본값 반환
- ✅ 사용자에게 부분 기능 제공

---

## 🎯 모듈 분류

### 🟢 독립 모듈 (완전 독립 가능)
다른 모듈에 의존하지 않고 독립적으로 작동합니다.

| 모듈 | 기능 | 데이터 소스 |
|-----|-----|----------|
| **AI 챗봇** | AI 대화 기능 | 자체 대화 기록 테이블 |
| **숙제 채점** | 숙제 자동 채점 | 자체 채점 결과 테이블 |
| **출석 관리** | 출석 체크 | 자체 출석 기록 테이블 |
| **문자 발송** | SMS 발송 | 자체 발송 기록 테이블 |
| **알림 관리** | 알림 전송 | 자체 알림 테이블 |

### 🟡 반독립 모듈 (읽기 전용 의존)
기본 데이터는 읽기만 하고, 자체 기능 데이터를 별도 관리합니다.

| 모듈 | 기능 | 필요한 읽기 데이터 | 자체 데이터 |
|-----|-----|-----------------|----------|
| **학생 리포트** | 성적 리포트 생성 | 학생 기본 정보 (읽기) | 리포트 생성 기록 |
| **숙제 관리** | 숙제 배정/제출 | 학생/반 정보 (읽기) | 숙제 데이터 |
| **AI 분석** | 학습 분석 | 학생 기록 (읽기) | 분석 결과 |

### 🔴 핵심 모듈 (공유 데이터 제공)
다른 모듈에게 데이터를 제공하지만, 절대 다른 모듈에 의존하지 않습니다.

| 모듈 | 기능 | 제공 데이터 |
|-----|-----|----------|
| **학생 관리** | 학생 CRUD | 학생 기본 정보 |
| **반 관리** | 반 CRUD | 반 정보 |
| **교사 관리** | 교사 CRUD | 교사 정보 |
| **학원 관리** | 학원 CRUD | 학원 정보 |

---

## 🔧 구현 전략

### 1. Try-Catch 블록으로 모든 모듈 감싸기

#### ❌ Bad (한 곳 에러 시 전체 중단)
```typescript
// 학생 대시보드
const studentData = await fetchStudent(id);  // 에러 발생 시 전체 중단
const homeworks = await fetchHomeworks(id);
const attendance = await fetchAttendance(id);
```

#### ✅ Good (독립적 에러 처리)
```typescript
// 학생 대시보드
let studentData = null;
let homeworks = [];
let attendance = [];

try {
  studentData = await fetchStudent(id);
} catch (error) {
  console.error('학생 정보 로드 실패:', error);
  studentData = { id, name: '불러오기 실패', error: true };
}

try {
  homeworks = await fetchHomeworks(id);
} catch (error) {
  console.error('숙제 로드 실패:', error);
  homeworks = [];  // 빈 배열 반환
}

try {
  attendance = await fetchAttendance(id);
} catch (error) {
  console.error('출석 로드 실패:', error);
  attendance = [];  // 빈 배열 반환
}

// 부분적으로라도 UI 표시
return {
  student: studentData,
  homeworks: homeworks,
  attendance: attendance,
  hasError: !studentData || studentData.error
};
```

---

### 2. Fallback 메커니즘

#### API 레벨 Fallback
```typescript
export async function onRequestGet(context) {
  try {
    // 메인 로직
    const data = await fetchData();
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    // 에러 발생해도 200 OK + 빈 데이터 반환
    return Response.json({ 
      success: true, 
      data: [],
      error: error.message,
      fallback: true 
    });
  }
}
```

#### 프론트엔드 레벨 Fallback
```typescript
const fetchData = async () => {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    
    if (data.error) {
      console.warn('API returned error:', data.error);
      // 에러여도 빈 데이터로 계속 진행
      return data.data || [];
    }
    
    return data.data;
  } catch (error) {
    console.error('Fetch failed:', error);
    // 완전 실패해도 빈 배열 반환
    return [];
  }
};
```

---

### 3. 데이터 읽기 전용 패턴

다른 모듈의 데이터를 사용할 때는 **읽기 전용**으로만 사용합니다.

#### ✅ Good (읽기 전용)
```typescript
// AI 챗봇에서 학생 정보 사용
async function getChatContext(studentId) {
  try {
    // 학생 정보는 읽기만 함
    const student = await fetchStudent(studentId);
    return {
      studentName: student?.name || '학생',
      grade: student?.grade || '미지정'
    };
  } catch (error) {
    // 학생 정보 못 가져와도 계속 작동
    return {
      studentName: '학생',
      grade: '미지정'
    };
  }
}
```

#### ❌ Bad (직접 수정)
```typescript
// AI 챗봇에서 학생 정보 수정 (금지!)
async function updateStudentFromChat(studentId, data) {
  await updateStudent(studentId, data);  // ❌ 다른 모듈 데이터 수정
}
```

---

### 4. 이벤트 기반 통신 (추천)

모듈 간 직접 호출 대신 이벤트를 통해 통신합니다.

```typescript
// 이벤트 발행자 (AI 채점)
async function gradeHomework(homeworkId) {
  const result = await gradeWithAI(homeworkId);
  
  // 이벤트 발행 (다른 모듈이 듣고 있을 수 있음)
  emitEvent('homework.graded', {
    homeworkId,
    score: result.score,
    timestamp: new Date()
  });
  
  return result;
}

// 이벤트 구독자 (알림 모듈)
onEvent('homework.graded', async (data) => {
  try {
    // 선택적으로 알림 발송 (실패해도 채점 기능에 영향 없음)
    await sendNotification({
      type: 'homework_graded',
      data: data
    });
  } catch (error) {
    console.error('알림 발송 실패:', error);
    // 에러는 로그만 남기고 무시
  }
});
```

---

## 📊 테이블 설계 원칙

### 독립 테이블 구조

각 모듈은 자체 테이블을 가집니다:

```sql
-- 🟢 AI 챗봇 모듈 (완전 독립)
CREATE TABLE ai_chat_sessions (
  id INTEGER PRIMARY KEY,
  student_id INTEGER,  -- 외래키 아님! 단순 참조
  messages TEXT,
  created_at TEXT
);

-- 🟢 숙제 채점 모듈 (완전 독립)
CREATE TABLE homework_grades (
  id INTEGER PRIMARY KEY,
  homework_id INTEGER,  -- 외래키 아님!
  student_id INTEGER,   -- 외래키 아님!
  score INTEGER,
  feedback TEXT,
  created_at TEXT
);

-- 🟢 출석 모듈 (완전 독립)
CREATE TABLE attendance_records (
  id INTEGER PRIMARY KEY,
  student_id INTEGER,  -- 외래키 아님!
  class_id INTEGER,    -- 외래키 아님!
  status TEXT,
  date TEXT
);
```

### 외래키 제약 조건 사용 안 함

```sql
-- ❌ Bad (강한 결합)
CREATE TABLE homework_grades (
  id INTEGER PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),  -- 강한 결합!
  ...
);

-- ✅ Good (느슨한 결합)
CREATE TABLE homework_grades (
  id INTEGER PRIMARY KEY,
  student_id INTEGER,  -- 단순 ID 저장, 외래키 아님
  ...
);
```

이유:
- 학생이 삭제되어도 채점 기록은 유지
- 채점 모듈이 학생 모듈 오류에 영향받지 않음
- 독립적으로 백업/복원 가능

---

## 🎯 적용 예시

### 학생 대시보드 (독립 모듈 조합)

```typescript
export default function StudentDashboard({ studentId }) {
  const [student, setStudent] = useState(null);
  const [homeworks, setHomeworks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [aiChats, setAiChats] = useState([]);
  
  useEffect(() => {
    loadAllData();
  }, [studentId]);
  
  const loadAllData = async () => {
    // 각 모듈 독립적으로 로드
    await Promise.allSettled([
      loadStudent(),
      loadHomeworks(),
      loadAttendance(),
      loadAiChats()
    ]);
  };
  
  const loadStudent = async () => {
    try {
      const data = await fetch(`/api/students/${studentId}`).then(r => r.json());
      setStudent(data.student);
    } catch (error) {
      console.error('학생 정보 로드 실패:', error);
      setStudent({ id: studentId, name: '불러오기 실패', error: true });
    }
  };
  
  const loadHomeworks = async () => {
    try {
      const data = await fetch(`/api/homeworks?studentId=${studentId}`).then(r => r.json());
      setHomeworks(data.homeworks || []);
    } catch (error) {
      console.error('숙제 로드 실패:', error);
      setHomeworks([]);  // 빈 배열로 계속 진행
    }
  };
  
  const loadAttendance = async () => {
    try {
      const data = await fetch(`/api/attendance?studentId=${studentId}`).then(r => r.json());
      setAttendance(data.records || []);
    } catch (error) {
      console.error('출석 로드 실패:', error);
      setAttendance([]);  // 빈 배열로 계속 진행
    }
  };
  
  const loadAiChats = async () => {
    try {
      const data = await fetch(`/api/ai-chats?studentId=${studentId}`).then(r => r.json());
      setAiChats(data.chats || []);
    } catch (error) {
      console.error('AI 챗 로드 실패:', error);
      setAiChats([]);  // 빈 배열로 계속 진행
    }
  };
  
  return (
    <div>
      {/* 학생 정보 블록 - 독립적 */}
      <StudentInfoBlock student={student} />
      
      {/* 숙제 블록 - 독립적 */}
      <HomeworkBlock homeworks={homeworks} />
      
      {/* 출석 블록 - 독립적 */}
      <AttendanceBlock attendance={attendance} />
      
      {/* AI 챗 블록 - 독립적 */}
      <AiChatBlock chats={aiChats} />
    </div>
  );
}
```

---

## ✅ 체크리스트

### 모듈 독립성 확인

- [ ] 각 모듈은 자체 데이터 테이블을 가지는가?
- [ ] 외래키 제약 조건을 사용하지 않는가?
- [ ] Try-catch로 모든 API 호출을 감싸는가?
- [ ] 에러 발생 시 빈 배열/기본값을 반환하는가?
- [ ] 다른 모듈 데이터는 읽기만 하는가?
- [ ] 한 모듈 실패 시 다른 모듈이 계속 작동하는가?

---

## 🚀 이점

### 1. 안정성
- 한 기능의 오류가 전체 시스템에 영향을 주지 않음
- 부분 장애 시에도 다른 기능은 정상 작동

### 2. 유지보수성
- 각 모듈을 독립적으로 수정 가능
- 버그 수정 시 다른 부분 걱정 없음

### 3. 확장성
- 새 기능 추가 시 기존 기능에 영향 없음
- 모듈을 쉽게 추가/제거 가능

### 4. 테스트 용이성
- 각 모듈을 독립적으로 테스트 가능
- 통합 테스트 불필요

---

## 📝 결론

**핵심 원칙**: "한 모듈의 실패가 다른 모듈에 영향을 주지 않도록!"

1. **완전 독립**: AI 챗봇, 채점, 출석, 문자 등
2. **읽기 전용 의존**: 학생 정보는 읽기만
3. **Fallback 필수**: 에러 시 빈 데이터로 계속
4. **Try-Catch 필수**: 모든 모듈에 에러 처리
5. **외래키 금지**: 테이블 간 강한 결합 방지

이 구조를 따르면 학원 관리 API가 실패해도 다른 기능들은 정상 작동합니다! ✨
