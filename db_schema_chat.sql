-- 채팅 세션 테이블
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,                      -- session-{timestamp} 형식
  userId TEXT NOT NULL,                     -- 사용자 ID
  academyId TEXT NOT NULL,                  -- 학원 ID
  botId TEXT NOT NULL,                      -- 사용한 봇 ID
  title TEXT,                               -- 세션 제목 (첫 메시지 일부)
  lastMessage TEXT,                         -- 마지막 메시지
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,                      -- user-{timestamp} 또는 assistant-{timestamp}
  sessionId TEXT NOT NULL,                  -- 세션 ID
  userId TEXT NOT NULL,                     -- 사용자 ID
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),  -- 역할
  content TEXT NOT NULL,                    -- 메시지 내용
  imageUrl TEXT,                            -- 이미지 URL (선택)
  audioUrl TEXT,                            -- 오디오 URL (선택)
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sessionId) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(userId);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_academy ON chat_sessions(academyId);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_bot ON chat_sessions(botId);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions(updatedAt);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(sessionId);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(userId);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(createdAt);

-- 복합 인덱스: 사용자별 최근 세션 조회 최적화
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated 
  ON chat_sessions(userId, updatedAt DESC);
