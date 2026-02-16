/**
 * 학원장 제한 체크 유틸리티
 * 각 기능에서 사용할 수 있는 제한 검증 함수들
 */

interface LimitationCheck {
  allowed: boolean;
  message?: string;
  remaining?: number;
}

/**
 * 학원장 제한 정보 조회
 */
export async function getDirectorLimitation(db: D1Database, directorId: number) {
  try {
    // 테이블 존재 확인 및 생성
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS director_limitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        director_id INTEGER NOT NULL UNIQUE,
        academy_id INTEGER NOT NULL,
        
        homework_grading_daily_limit INTEGER DEFAULT 0,
        homework_grading_monthly_limit INTEGER DEFAULT 0,
        homework_grading_daily_used INTEGER DEFAULT 0,
        homework_grading_monthly_used INTEGER DEFAULT 0,
        homework_grading_daily_reset_date TEXT,
        homework_grading_monthly_reset_date TEXT,
        
        max_students INTEGER DEFAULT 0,
        
        similar_problem_enabled INTEGER DEFAULT 0,
        similar_problem_daily_limit INTEGER DEFAULT 0,
        similar_problem_monthly_limit INTEGER DEFAULT 0,
        similar_problem_daily_used INTEGER DEFAULT 0,
        similar_problem_monthly_used INTEGER DEFAULT 0,
        
        weak_concept_analysis_enabled INTEGER DEFAULT 1,
        weak_concept_daily_limit INTEGER DEFAULT 0,
        weak_concept_monthly_limit INTEGER DEFAULT 0,
        weak_concept_daily_used INTEGER DEFAULT 0,
        weak_concept_monthly_used INTEGER DEFAULT 0,
        
        competency_analysis_enabled INTEGER DEFAULT 1,
        competency_daily_limit INTEGER DEFAULT 0,
        competency_monthly_limit INTEGER DEFAULT 0,
        competency_daily_used INTEGER DEFAULT 0,
        competency_monthly_used INTEGER DEFAULT 0,
        
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    const limitation = await db.prepare(`
      SELECT * FROM director_limitations WHERE director_id = ?
    `).bind(directorId).first();

    return limitation;
  } catch (error) {
    console.error('Failed to get director limitation:', error);
    return null;
  }
}

/**
 * 일일/월간 제한 초기화 확인 및 업데이트
 */
async function checkAndResetLimits(
  db: D1Database,
  directorId: number,
  limitation: any
) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let needsUpdate = false;
  const updates: { field: string; value: any }[] = [];

  // 일일 초기화 확인
  if (limitation.homework_grading_daily_reset_date !== today) {
    updates.push(
      { field: 'homework_grading_daily_used', value: 0 },
      { field: 'homework_grading_daily_reset_date', value: today },
      { field: 'similar_problem_daily_used', value: 0 },
      { field: 'weak_concept_daily_used', value: 0 },
      { field: 'competency_daily_used', value: 0 }
    );
    needsUpdate = true;
  }

  // 월간 초기화 확인
  if (!limitation.homework_grading_monthly_reset_date || 
      !limitation.homework_grading_monthly_reset_date.startsWith(thisMonth)) {
    updates.push(
      { field: 'homework_grading_monthly_used', value: 0 },
      { field: 'homework_grading_monthly_reset_date', value: `${thisMonth}-01` },
      { field: 'similar_problem_monthly_used', value: 0 },
      { field: 'weak_concept_monthly_used', value: 0 },
      { field: 'competency_monthly_used', value: 0 }
    );
    needsUpdate = true;
  }

  if (needsUpdate) {
    const setClause = updates.map(u => `${u.field} = ?`).join(', ');
    const values = updates.map(u => u.value);
    
    await db.prepare(`
      UPDATE director_limitations 
      SET ${setClause}, updated_at = datetime('now')
      WHERE director_id = ?
    `).bind(...values, directorId).run();

    // 업데이트된 제한 정보 반환
    return await getDirectorLimitation(db, directorId);
  }

  return limitation;
}

/**
 * 유사문제 출제 기능 체크
 */
export async function checkSimilarProblemLimit(
  db: D1Database,
  directorId: number
): Promise<LimitationCheck> {
  const limitation = await getDirectorLimitation(db, directorId);

  if (!limitation) {
    // 제한이 없으면 허용 (기본값)
    return { allowed: true };
  }

  // 기능 활성화 체크
  if (limitation.similar_problem_enabled === 0) {
    return {
      allowed: false,
      message: '유사문제 출제 기능이 비활성화되어 있습니다. 관리자에게 문의하세요.'
    };
  }

  // 제한 초기화 확인
  const updatedLimitation = await checkAndResetLimits(db, directorId, limitation);

  // 일일 제한 체크
  if (updatedLimitation.similar_problem_daily_limit > 0) {
    if (updatedLimitation.similar_problem_daily_used >= updatedLimitation.similar_problem_daily_limit) {
      return {
        allowed: false,
        message: `일일 유사문제 출제 횟수를 초과했습니다. (${updatedLimitation.similar_problem_daily_limit}회 제한)`,
        remaining: 0
      };
    }
  }

  // 월간 제한 체크
  if (updatedLimitation.similar_problem_monthly_limit > 0) {
    if (updatedLimitation.similar_problem_monthly_used >= updatedLimitation.similar_problem_monthly_limit) {
      return {
        allowed: false,
        message: `월간 유사문제 출제 횟수를 초과했습니다. (${updatedLimitation.similar_problem_monthly_limit}회 제한)`,
        remaining: 0
      };
    }
  }

  return {
    allowed: true,
    remaining: updatedLimitation.similar_problem_daily_limit > 0
      ? updatedLimitation.similar_problem_daily_limit - updatedLimitation.similar_problem_daily_used
      : -1 // -1 = 무제한
  };
}

/**
 * 부족한 개념 분석 기능 체크
 */
export async function checkWeakConceptLimit(
  db: D1Database,
  directorId: number
): Promise<LimitationCheck> {
  const limitation = await getDirectorLimitation(db, directorId);

  if (!limitation) {
    return { allowed: true };
  }

  if (limitation.weak_concept_analysis_enabled === 0) {
    return {
      allowed: false,
      message: '부족한 개념 분석 기능이 비활성화되어 있습니다. 관리자에게 문의하세요.'
    };
  }

  const updatedLimitation = await checkAndResetLimits(db, directorId, limitation);

  if (updatedLimitation.weak_concept_daily_limit > 0) {
    if (updatedLimitation.weak_concept_daily_used >= updatedLimitation.weak_concept_daily_limit) {
      return {
        allowed: false,
        message: `일일 개념 분석 횟수를 초과했습니다. (${updatedLimitation.weak_concept_daily_limit}회 제한)`,
        remaining: 0
      };
    }
  }

  if (updatedLimitation.weak_concept_monthly_limit > 0) {
    if (updatedLimitation.weak_concept_monthly_used >= updatedLimitation.weak_concept_monthly_limit) {
      return {
        allowed: false,
        message: `월간 개념 분석 횟수를 초과했습니다. (${updatedLimitation.weak_concept_monthly_limit}회 제한)`,
        remaining: 0
      };
    }
  }

  return {
    allowed: true,
    remaining: updatedLimitation.weak_concept_daily_limit > 0
      ? updatedLimitation.weak_concept_daily_limit - updatedLimitation.weak_concept_daily_used
      : -1
  };
}

/**
 * AI 역량 분석 기능 체크
 */
export async function checkCompetencyAnalysisLimit(
  db: D1Database,
  directorId: number
): Promise<LimitationCheck> {
  const limitation = await getDirectorLimitation(db, directorId);

  if (!limitation) {
    return { allowed: true };
  }

  if (limitation.competency_analysis_enabled === 0) {
    return {
      allowed: false,
      message: 'AI 역량 분석 기능이 비활성화되어 있습니다. 관리자에게 문의하세요.'
    };
  }

  const updatedLimitation = await checkAndResetLimits(db, directorId, limitation);

  if (updatedLimitation.competency_daily_limit > 0) {
    if (updatedLimitation.competency_daily_used >= updatedLimitation.competency_daily_limit) {
      return {
        allowed: false,
        message: `일일 역량 분석 횟수를 초과했습니다. (${updatedLimitation.competency_daily_limit}회 제한)`,
        remaining: 0
      };
    }
  }

  if (updatedLimitation.competency_monthly_limit > 0) {
    if (updatedLimitation.competency_monthly_used >= updatedLimitation.competency_monthly_limit) {
      return {
        allowed: false,
        message: `월간 역량 분석 횟수를 초과했습니다. (${updatedLimitation.competency_monthly_limit}회 제한)`,
        remaining: 0
      };
    }
  }

  return {
    allowed: true,
    remaining: updatedLimitation.competency_daily_limit > 0
      ? updatedLimitation.competency_daily_limit - updatedLimitation.competency_daily_used
      : -1
  };
}

/**
 * 학생 수 제한 체크
 */
export async function checkMaxStudentsLimit(
  db: D1Database,
  academyId: number
): Promise<LimitationCheck> {
  // academy_id로 학원장 찾기
  const director = await db.prepare(`
    SELECT id FROM users WHERE academy_id = ? AND role = 'DIRECTOR' LIMIT 1
  `).bind(academyId).first();

  if (!director) {
    return { allowed: true };
  }

  const limitation = await getDirectorLimitation(db, director.id as number);

  if (!limitation || limitation.max_students === 0) {
    return { allowed: true }; // 제한 없음
  }

  // 현재 학생 수 조회
  const result = await db.prepare(`
    SELECT COUNT(*) as count FROM users 
    WHERE academy_id = ? AND role = 'STUDENT'
  `).bind(academyId).first();

  const currentStudents = (result as any)?.count || 0;

  if (currentStudents >= limitation.max_students) {
    return {
      allowed: false,
      message: `학생 수 제한을 초과했습니다. (최대 ${limitation.max_students}명)`,
      remaining: 0
    };
  }

  return {
    allowed: true,
    remaining: limitation.max_students - currentStudents
  };
}

/**
 * 제한 사용량 증가
 */
export async function incrementLimitUsage(
  db: D1Database,
  directorId: number,
  limitType: 'similar_problem' | 'weak_concept' | 'competency' | 'homework_grading'
) {
  try {
    await db.prepare(`
      UPDATE director_limitations 
      SET 
        ${limitType}_daily_used = ${limitType}_daily_used + 1,
        ${limitType}_monthly_used = ${limitType}_monthly_used + 1,
        updated_at = datetime('now')
      WHERE director_id = ?
    `).bind(directorId).run();
    
    console.log(`✅ Incremented ${limitType} usage for director ${directorId}`);
  } catch (error) {
    console.error(`Failed to increment ${limitType} usage:`, error);
  }
}
