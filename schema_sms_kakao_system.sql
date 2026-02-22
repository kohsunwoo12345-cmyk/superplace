-- SMS/Kakao 발송 시스템 통합 스키마
-- 학생-학부모 매핑 및 개인화된 랜딩페이지 발송

-- 발신번호 등록 테이블 (확장)
CREATE TABLE IF NOT EXISTS SenderNumber (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  phoneNumber TEXT NOT NULL UNIQUE,
  purpose TEXT, -- 용도
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  verificationDocUrl TEXT, -- 통신서비스이용증명원 URL
  businessCertUrl TEXT, -- 사업자등록증 URL
  approvedBy TEXT,
  approvedAt TEXT,
  rejectionReason TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_sender_number_user ON SenderNumber(userId);
CREATE INDEX IF NOT EXISTS idx_sender_number_phone ON SenderNumber(phoneNumber);
CREATE INDEX IF NOT EXISTS idx_sender_number_status ON SenderNumber(status);

-- 메시지 수신자 그룹 테이블
CREATE TABLE IF NOT EXISTS RecipientGroup (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  studentIds TEXT, -- JSON array of student IDs
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_recipient_group_user ON RecipientGroup(userId);

-- 메시지 발송 내역 테이블 (확장)
CREATE TABLE IF NOT EXISTS MessageSendHistory (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  messageType TEXT NOT NULL, -- SMS, KAKAO_ALIMTALK, KAKAO_FRIENDTALK
  senderNumber TEXT NOT NULL, -- 발신번호
  recipientCount INTEGER NOT NULL,
  recipients TEXT NOT NULL, -- JSON array: [{studentId, studentName, parentPhone, landingPageUrl}]
  messageTitle TEXT, -- 메시지 제목 (카카오용)
  messageContent TEXT NOT NULL,
  landingPageTemplate TEXT, -- 사용된 랜딩페이지 템플릿 ID
  pointsUsed INTEGER NOT NULL, -- 총 차감 포인트
  pointCostPerMessage INTEGER NOT NULL, -- 메시지당 포인트
  successCount INTEGER DEFAULT 0,
  failCount INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, SENDING, COMPLETED, FAILED
  sendResults TEXT, -- JSON array of send results
  scheduledAt TEXT, -- 예약 발송 시각
  sentAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_message_send_user ON MessageSendHistory(userId);
CREATE INDEX IF NOT EXISTS idx_message_send_type ON MessageSendHistory(messageType);
CREATE INDEX IF NOT EXISTS idx_message_send_status ON MessageSendHistory(status);
CREATE INDEX IF NOT EXISTS idx_message_send_sent ON MessageSendHistory(sentAt DESC);

-- 메시지 템플릿 테이블
CREATE TABLE IF NOT EXISTS MessageTemplate (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  messageType TEXT NOT NULL, -- SMS, KAKAO_ALIMTALK, KAKAO_FRIENDTALK
  title TEXT, -- 카카오 제목
  content TEXT NOT NULL,
  variables TEXT, -- JSON array: [{name, description, example}]
  category TEXT, -- 카테고리 (출석, 숙제, 성적, 공지 등)
  usageCount INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_message_template_user ON MessageTemplate(userId);
CREATE INDEX IF NOT EXISTS idx_message_template_type ON MessageTemplate(messageType);
CREATE INDEX IF NOT EXISTS idx_message_template_category ON MessageTemplate(category);

-- 학생별 랜딩페이지 매핑 테이블
CREATE TABLE IF NOT EXISTS StudentLandingPage (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  landingPageId TEXT NOT NULL,
  customSlug TEXT UNIQUE, -- 학생 전용 커스텀 슬러그
  expiresAt TEXT, -- 만료 시각
  viewCount INTEGER DEFAULT 0,
  lastViewedAt TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (studentId) REFERENCES User(id),
  FOREIGN KEY (landingPageId) REFERENCES LandingPage(id)
);

CREATE INDEX IF NOT EXISTS idx_student_landing_student ON StudentLandingPage(studentId);
CREATE INDEX IF NOT EXISTS idx_student_landing_page ON StudentLandingPage(landingPageId);
CREATE INDEX IF NOT EXISTS idx_student_landing_slug ON StudentLandingPage(customSlug);

-- 엑셀 업로드 수신자 목록 테이블
CREATE TABLE IF NOT EXISTS UploadedRecipient (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  batchId TEXT NOT NULL, -- 업로드 배치 ID
  studentName TEXT NOT NULL,
  parentName TEXT,
  parentPhone TEXT NOT NULL,
  grade TEXT,
  class TEXT,
  additionalInfo TEXT, -- JSON object for extra fields
  isValid INTEGER DEFAULT 1, -- 유효성 검증 통과 여부
  validationMessage TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_uploaded_recipient_user ON UploadedRecipient(userId);
CREATE INDEX IF NOT EXISTS idx_uploaded_recipient_batch ON UploadedRecipient(batchId);
CREATE INDEX IF NOT EXISTS idx_uploaded_recipient_phone ON UploadedRecipient(parentPhone);

-- 카카오 알림톡 템플릿 등록 테이블
CREATE TABLE IF NOT EXISTS KakaoAlimtalkTemplate (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  channelId TEXT NOT NULL, -- 카카오 채널 ID
  templateCode TEXT NOT NULL UNIQUE,
  templateName TEXT NOT NULL,
  content TEXT NOT NULL,
  buttons TEXT, -- JSON array of button objects
  variables TEXT, -- JSON array of variable names
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  inspectionStatus TEXT, -- 카카오 검수 상태
  approvedAt TEXT,
  rejectedReason TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_kakao_template_user ON KakaoAlimtalkTemplate(userId);
CREATE INDEX IF NOT EXISTS idx_kakao_template_channel ON KakaoAlimtalkTemplate(channelId);
CREATE INDEX IF NOT EXISTS idx_kakao_template_code ON KakaoAlimtalkTemplate(templateCode);
CREATE INDEX IF NOT EXISTS idx_kakao_template_status ON KakaoAlimtalkTemplate(status);
