-- AI 봇 할당 테이블
CREATE TABLE IF NOT EXISTS bot_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  academyId TEXT NOT NULL,                    -- 학원 ID
  botId TEXT NOT NULL,                        -- AI 봇 ID
  assignedBy TEXT,                            -- 할당한 관리자 ID
  assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 할당 시각
  expiresAt DATETIME,                         -- 만료 시각 (NULL = 무제한)
  isActive INTEGER DEFAULT 1,                 -- 활성 상태 (0: 비활성, 1: 활성)
  notes TEXT,                                 -- 메모
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bot_assignments_academy ON bot_assignments(academyId);
CREATE INDEX IF NOT EXISTS idx_bot_assignments_bot ON bot_assignments(botId);
CREATE INDEX IF NOT EXISTS idx_bot_assignments_active ON bot_assignments(isActive);
CREATE INDEX IF NOT EXISTS idx_bot_assignments_expires ON bot_assignments(expiresAt);

-- 복합 인덱스: 학원별 활성 봇 조회 최적화
CREATE INDEX IF NOT EXISTS idx_bot_assignments_academy_active 
  ON bot_assignments(academyId, isActive, expiresAt);

-- 코멘트 (SQLite는 주석만 지원)
-- academyId: academy 테이블의 id (문자열)
-- botId: ai_bots 테이블의 id
-- isActive: 1=활성, 0=비활성 (관리자가 수동으로 비활성화)
-- expiresAt: NULL이면 무제한, 날짜가 있으면 해당 날짜까지만 사용 가능
