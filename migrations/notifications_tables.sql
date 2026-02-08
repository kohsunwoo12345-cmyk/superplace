-- Notification Tables Migration
-- 알림 관리 시스템용 테이블 생성

-- notifications table: 알림 메시지 정보
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  filterType TEXT NOT NULL DEFAULT 'all',
  recipientCount INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent'
);

-- notification_recipients table: 알림 수신자 정보
CREATE TABLE IF NOT EXISTS notification_recipients (
  id TEXT PRIMARY KEY,
  notificationId TEXT NOT NULL,
  userId INTEGER NOT NULL,
  userName TEXT,
  userEmail TEXT,
  academyId INTEGER,
  sentAt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  readAt TEXT,
  FOREIGN KEY (notificationId) REFERENCES notifications(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON notifications(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_userId ON notification_recipients(userId);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_notificationId ON notification_recipients(notificationId);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_academyId ON notification_recipients(academyId);
