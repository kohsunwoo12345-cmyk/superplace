-- 포인트 충전 신청 테이블
CREATE TABLE IF NOT EXISTS PointChargeRequest (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  userEmail TEXT NOT NULL,
  requestedPoints INTEGER NOT NULL,
  pointPrice REAL NOT NULL, -- 포인트 금액 (부가세 제외)
  vat REAL NOT NULL, -- 부가세 (10%)
  totalPrice REAL NOT NULL, -- 총 금액 (VAT 포함)
  paymentMethod TEXT, -- 결제 방법
  depositBank TEXT, -- 입금 은행
  depositorName TEXT, -- 입금자명
  attachmentUrl TEXT, -- 입금 증빙 파일 URL
  requestMessage TEXT, -- 신청 메시지
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  approvedBy TEXT, -- 승인자 ID
  approvedAt TEXT, -- 승인 시각
  rejectionReason TEXT, -- 거절 사유
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_point_charge_user ON PointChargeRequest(userId);
CREATE INDEX IF NOT EXISTS idx_point_charge_status ON PointChargeRequest(status);
CREATE INDEX IF NOT EXISTS idx_point_charge_created ON PointChargeRequest(createdAt DESC);

-- 메시지 발송 내역 테이블
CREATE TABLE IF NOT EXISTS MessageHistory (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  messageType TEXT NOT NULL, -- SMS, KAKAO
  recipientCount INTEGER NOT NULL, -- 수신자 수
  recipients TEXT NOT NULL, -- JSON array of phone numbers
  messageContent TEXT NOT NULL,
  pointsUsed INTEGER NOT NULL, -- 차감된 포인트
  pointCostPerMessage INTEGER NOT NULL, -- 메시지당 포인트 비용
  status TEXT NOT NULL DEFAULT 'SENT', -- SENT, FAILED, PENDING
  failureReason TEXT, -- 실패 사유
  sentAt TEXT NOT NULL DEFAULT (datetime('now')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_message_history_user ON MessageHistory(userId);
CREATE INDEX IF NOT EXISTS idx_message_history_type ON MessageHistory(messageType);
CREATE INDEX IF NOT EXISTS idx_message_history_sent ON MessageHistory(sentAt DESC);

-- SMS 사업자 등록 신청 테이블 (기존에 없다면 추가)
CREATE TABLE IF NOT EXISTS SmsRegistrationRequest (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  userEmail TEXT NOT NULL,
  businessName TEXT NOT NULL, -- 사업자명
  businessNumber TEXT NOT NULL, -- 사업자등록번호
  businessAddress TEXT, -- 사업장 주소
  representativeName TEXT NOT NULL, -- 대표자명
  contactPhone TEXT NOT NULL, -- 연락처
  attachmentUrl TEXT, -- 사업자등록증 첨부 파일
  requestMessage TEXT, -- 신청 메시지
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  approvedBy TEXT, -- 승인자 ID
  approvedAt TEXT, -- 승인 시각
  rejectionReason TEXT, -- 거절 사유
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_sms_registration_user ON SmsRegistrationRequest(userId);
CREATE INDEX IF NOT EXISTS idx_sms_registration_status ON SmsRegistrationRequest(status);
CREATE INDEX IF NOT EXISTS idx_sms_registration_created ON SmsRegistrationRequest(createdAt DESC);
