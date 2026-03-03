// PPT 생성을 위한 변수 타입 정의
export interface PPTVariables {
  // ========== 기본 정보 (5개) ==========
  academyName: string;          // 학원명
  title: string;                // 제목
  subtitle: string;             // 부제목
  date: string;                 // 날짜
  presenter: string;            // 발표자

  // ========== 학생 기본 정보 (10개) ==========
  studentName: string;          // 학생 이름
  studentGrade: string;         // 학년
  studentClass: string;         // 반
  studentNumber: string;        // 학번
  studentPhone: string;         // 전화번호
  parentName: string;           // 학부모 이름
  parentPhone: string;          // 학부모 전화
  enrollmentDate: string;       // 등록일
  attendanceRate: string;       // 출석률
  totalClasses: string;         // 총 수업 수

  // ========== 성적 정보 (15개) ==========
  koreanScore: string;          // 국어 점수
  mathScore: string;            // 수학 점수
  englishScore: string;         // 영어 점수
  scienceScore: string;         // 과학 점수
  socialScore: string;          // 사회 점수
  averageScore: string;         // 평균 점수
  totalScore: string;           // 총점
  rank: string;                 // 등수
  grade: string;                // 등급
  previousAverage: string;      // 이전 평균
  scoreChange: string;          // 점수 변화
  rankChange: string;           // 등수 변화
  strongestSubject: string;     // 가장 강한 과목
  weakestSubject: string;       // 가장 약한 과목
  improvementRate: string;      // 향상률

  // ========== 학습 분석 (10개) ==========
  strengths: string;            // 강점 (여러 개, 줄바꿈으로 구분)
  weaknesses: string;           // 약점 (여러 개, 줄바꿈으로 구분)
  studyHabits: string;          // 학습 습관
  concentration: string;        // 집중력
  participation: string;        // 참여도
  homework: string;             // 숙제 완성도
  attitude: string;             // 학습 태도
  progressRate: string;         // 진도율
  understandingLevel: string;   // 이해도
  recommendations: string;      // 추천사항

  // ========== 목표 및 계획 (7개) ==========
  shortTermGoal: string;        // 단기 목표 (1개월)
  midTermGoal: string;          // 중기 목표 (3개월)
  longTermGoal: string;         // 장기 목표 (6개월)
  actionPlan1: string;          // 실행 계획 1
  actionPlan2: string;          // 실행 계획 2
  actionPlan3: string;          // 실행 계획 3
  expectedOutcome: string;      // 기대 성과

  // ========== 학부모 메시지 (3개) ==========
  teacherComment: string;       // 선생님 의견
  encouragement: string;        // 격려 문구
  parentAdvice: string;         // 학부모님께 드리는 말씀
}

// 기본값 제공
export const DEFAULT_PPT_VARIABLES: PPTVariables = {
  // 기본 정보
  academyName: "",
  title: "",
  subtitle: "",
  date: new Date().toLocaleDateString('ko-KR'),
  presenter: "",

  // 학생 기본 정보
  studentName: "",
  studentGrade: "",
  studentClass: "",
  studentNumber: "",
  studentPhone: "",
  parentName: "",
  parentPhone: "",
  enrollmentDate: "",
  attendanceRate: "",
  totalClasses: "",

  // 성적 정보
  koreanScore: "",
  mathScore: "",
  englishScore: "",
  scienceScore: "",
  socialScore: "",
  averageScore: "",
  totalScore: "",
  rank: "",
  grade: "",
  previousAverage: "",
  scoreChange: "",
  rankChange: "",
  strongestSubject: "",
  weakestSubject: "",
  improvementRate: "",

  // 학습 분석
  strengths: "",
  weaknesses: "",
  studyHabits: "",
  concentration: "",
  participation: "",
  homework: "",
  attitude: "",
  progressRate: "",
  understandingLevel: "",
  recommendations: "",

  // 목표 및 계획
  shortTermGoal: "",
  midTermGoal: "",
  longTermGoal: "",
  actionPlan1: "",
  actionPlan2: "",
  actionPlan3: "",
  expectedOutcome: "",

  // 학부모 메시지
  teacherComment: "",
  encouragement: "",
  parentAdvice: "",
};
