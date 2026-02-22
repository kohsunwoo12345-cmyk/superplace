-- 카카오 채널 테이블
CREATE TABLE IF NOT EXISTS KakaoChannel (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  phoneNumber TEXT NOT NULL,
  channelName TEXT NOT NULL,
  categoryCode TEXT NOT NULL,
  mainCategory TEXT,
  middleCategory TEXT,
  subCategory TEXT,
  businessNumber TEXT,
  solapiChannelId TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  rejectionReason TEXT,
  approvedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_kakao_channel_user ON KakaoChannel(userId);
CREATE INDEX IF NOT EXISTS idx_kakao_channel_phone ON KakaoChannel(phoneNumber);
CREATE INDEX IF NOT EXISTS idx_kakao_channel_status ON KakaoChannel(status);
CREATE INDEX IF NOT EXISTS idx_kakao_channel_created ON KakaoChannel(createdAt DESC);
