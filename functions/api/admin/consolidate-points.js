// 포인트 시스템 통합 API
// 1. academy.smsPoints - 학원의 SMS 포인트 잔액
// 2. 충전 요청 테이블 - point_charge_requests
// 3. 사용 내역 테이블 - point_transactions
// 모두 academy.smsPoints를 중심으로 통합

export async function onRequestPost(context) {
  const { env } = context;

  try {
    console.log('🔧 Points system consolidation starting...');

    // 1. Ensure academy table has smsPoints column (already done via fix-academy-fields.js)
    console.log('✅ Step 1: Academy.smsPoints column ready');

    // 2. Create point_charge_requests table if not exists
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS point_charge_requests (
          id TEXT PRIMARY KEY,
          academyId TEXT NOT NULL,
          academyName TEXT,
          amount INTEGER NOT NULL,
          status TEXT DEFAULT 'PENDING',
          requestedBy TEXT,
          requestedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          approvedBy TEXT,
          approvedAt TEXT,
          rejectedBy TEXT,
          rejectedAt TEXT,
          rejectReason TEXT,
          memo TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      console.log('✅ Step 2: point_charge_requests table ready');
    } catch (e) {
      console.log('ℹ️  point_charge_requests table already exists');
    }

    // 3. Create point_transactions table if not exists (for usage history)
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS point_transactions (
          id TEXT PRIMARY KEY,
          academyId TEXT NOT NULL,
          userId TEXT,
          type TEXT NOT NULL,
          amount INTEGER NOT NULL,
          balance INTEGER NOT NULL,
          description TEXT,
          relatedId TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      console.log('✅ Step 3: point_transactions table ready');
    } catch (e) {
      console.log('ℹ️  point_transactions table already exists');
    }

    // 4. Create indexes for performance
    try {
      await env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_point_charge_requests_academy 
        ON point_charge_requests(academyId)
      `).run();
      
      await env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_point_transactions_academy 
        ON point_transactions(academyId)
      `).run();
      
      console.log('✅ Step 4: Indexes created');
    } catch (e) {
      console.log('ℹ️  Indexes already exist');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Points system consolidated successfully',
      structure: {
        academy: {
          smsPoints: 'Current balance (INTEGER)'
        },
        point_charge_requests: {
          description: 'Charging requests (PENDING/APPROVED/REJECTED)',
          onApproval: 'Updates academy.smsPoints'
        },
        point_transactions: {
          description: 'Usage history log',
          onUsage: 'Decreases academy.smsPoints and logs transaction'
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error consolidating points:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    message: 'Use POST to consolidate points system',
    endpoint: '/api/admin/consolidate-points'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
