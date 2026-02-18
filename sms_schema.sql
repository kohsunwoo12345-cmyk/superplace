-- SMS System Tables
-- This schema adds SMS functionality to the existing database

-- SMS Senders (발신번호 관리)
CREATE TABLE IF NOT EXISTS SMSSender (
  id TEXT PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  description TEXT,
  verified INTEGER DEFAULT 0,
  createdById TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_sms_sender_phone ON SMSSender(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_sender_verified ON SMSSender(verified);

-- SMS Templates (템플릿 관리)
CREATE TABLE IF NOT EXISTS SMSTemplate (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  folder_id TEXT,
  createdById TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_sms_template_creator ON SMSTemplate(createdById);
CREATE INDEX IF NOT EXISTS idx_sms_template_folder ON SMSTemplate(folder_id);

-- SMS Template Folders (템플릿 폴더)
CREATE TABLE IF NOT EXISTS SMSTemplateFolder (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  createdById TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_sms_folder_creator ON SMSTemplateFolder(createdById);

-- SMS Logs (발송 이력)
CREATE TABLE IF NOT EXISTS SMSLog (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'SMS', -- SMS or LMS
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  cost INTEGER DEFAULT 0,
  error_message TEXT,
  reserve_time TEXT, -- 예약 발송 시간
  sent_at TEXT,
  createdById TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sender_id) REFERENCES SMSSender(id),
  FOREIGN KEY (createdById) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_sms_log_sender ON SMSLog(sender_id);
CREATE INDEX IF NOT EXISTS idx_sms_log_status ON SMSLog(status);
CREATE INDEX IF NOT EXISTS idx_sms_log_creator ON SMSLog(createdById);
CREATE INDEX IF NOT EXISTS idx_sms_log_sent_at ON SMSLog(sent_at);

-- SMS Balance (포인트 관리)
CREATE TABLE IF NOT EXISTS SMSBalance (
  id TEXT PRIMARY KEY,
  balance INTEGER DEFAULT 0,
  total_charged INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  lastChargedAt TEXT,
  lastUsedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- SMS Balance Transactions (포인트 거래 내역)
CREATE TABLE IF NOT EXISTS SMSBalanceTransaction (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- charge, use, refund
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  relatedLogId TEXT,
  createdById TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (relatedLogId) REFERENCES SMSLog(id),
  FOREIGN KEY (createdById) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_sms_transaction_type ON SMSBalanceTransaction(type);
CREATE INDEX IF NOT EXISTS idx_sms_transaction_creator ON SMSBalanceTransaction(createdById);
CREATE INDEX IF NOT EXISTS idx_sms_transaction_log ON SMSBalanceTransaction(relatedLogId);

-- Initialize SMS Balance (Create one default record)
INSERT OR IGNORE INTO SMSBalance (id, balance, total_charged, total_used)
VALUES ('default', 0, 0, 0);
