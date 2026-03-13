-- Seminars System Schema

-- 세미나 테이블
CREATE TABLE IF NOT EXISTS seminars (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  detailHtml TEXT,  -- 상세 HTML 코드
  mainImage TEXT,  -- 메인 이미지 URL
  instructor TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT,
  locationType TEXT,  -- 'online' or 'offline'
  maxParticipants INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active',  -- 'active', 'closed', 'cancelled'
  formHtml TEXT,  -- 신청 폼 HTML (외부 폼 임베드)
  useCustomForm INTEGER DEFAULT 0,  -- 1: 외부 폼 사용, 0: 내부 폼 사용
  createdBy TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 세미나 신청 테이블
CREATE TABLE IF NOT EXISTS seminar_applications (
  id TEXT PRIMARY KEY,
  seminarId TEXT NOT NULL,
  applicantName TEXT NOT NULL,
  applicantEmail TEXT NOT NULL,
  applicantPhone TEXT,
  academyName TEXT,
  position TEXT,  -- '학원장', '강사', '관리자' 등
  additionalInfo TEXT,  -- JSON 형식의 추가 정보
  status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  appliedAt TEXT NOT NULL,
  FOREIGN KEY (seminarId) REFERENCES seminars(id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_seminars_date ON seminars(date);
CREATE INDEX IF NOT EXISTS idx_seminars_status ON seminars(status);
CREATE INDEX IF NOT EXISTS idx_seminar_applications_seminar ON seminar_applications(seminarId);
CREATE INDEX IF NOT EXISTS idx_seminar_applications_email ON seminar_applications(applicantEmail);
