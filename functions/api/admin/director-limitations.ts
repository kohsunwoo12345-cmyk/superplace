interface Env {
  DB: D1Database;
}

interface DirectorLimitation {
  id?: number;
  director_id: number;
  academy_id: number;
  
  // 숙제 채점 제한
  homework_grading_daily_limit: number;
  homework_grading_monthly_limit: number;
  homework_grading_daily_used: number;
  homework_grading_monthly_used: number;
  homework_grading_daily_reset_date?: string;
  homework_grading_monthly_reset_date?: string;
  
  // 학생 수 제한
  max_students: number;
  
  // 유사문제 출제 기능
  similar_problem_enabled: number;
  similar_problem_daily_limit: number;
  similar_problem_monthly_limit: number;
  similar_problem_daily_used: number;
  similar_problem_monthly_used: number;
  
  // 부족한 개념 분석 기능
  weak_concept_analysis_enabled: number;
  weak_concept_daily_limit: number;
  weak_concept_monthly_limit: number;
  weak_concept_daily_used: number;
  weak_concept_monthly_used: number;
  
  // AI 기반 역량 분석 기능
  competency_analysis_enabled: number;
  competency_daily_limit: number;
  competency_monthly_limit: number;
  competency_daily_used: number;
  competency_monthly_used: number;
  
  created_at?: string;
  updated_at?: string;
}

// 학원장 제한 정보 조회 (director_id로)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const directorId = url.searchParams.get('directorId');
    const academyId = url.searchParams.get('academyId');

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!directorId && !academyId) {
      return new Response(JSON.stringify({ error: "directorId or academyId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 테이블 존재 확인 및 생성
    await DB.prepare(`
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

    let limitation;
    console.log('🔍 Querying limitation with:', { directorId, academyId });
    
    if (directorId) {
      limitation = await DB.prepare(`
        SELECT * FROM director_limitations WHERE director_id = ?
      `).bind(directorId).first();
      console.log('📊 Query by director_id result:', limitation);
    } else if (academyId) {
      limitation = await DB.prepare(`
        SELECT * FROM director_limitations WHERE academy_id = ?
      `).bind(academyId).first();
      console.log('📊 Query by academy_id result:', limitation);
    }
    
    // 데이터가 있는 경우 값 확인
    if (limitation) {
      console.log('✅ Found limitation record:', {
        id: limitation.id,
        director_id: limitation.director_id,
        academy_id: limitation.academy_id,
        similar_problem_enabled: limitation.similar_problem_enabled,
        weak_concept_analysis_enabled: limitation.weak_concept_analysis_enabled,
        competency_analysis_enabled: limitation.competency_analysis_enabled
      });
    }

    // 제한이 없으면 기본값 반환 (모든 기능 비활성화)
    if (!limitation) {
      const defaultLimitation: Partial<DirectorLimitation> = {
        director_id: Number(directorId) || 0,
        academy_id: Number(academyId) || 0,
        homework_grading_daily_limit: 0,
        homework_grading_monthly_limit: 0,
        homework_grading_daily_used: 0,
        homework_grading_monthly_used: 0,
        max_students: 0,
        similar_problem_enabled: 0,
        similar_problem_daily_limit: 0,
        similar_problem_monthly_limit: 0,
        similar_problem_daily_used: 0,
        similar_problem_monthly_used: 0,
        weak_concept_analysis_enabled: 0,  // 기본값 0으로 변경 (비활성화)
        weak_concept_daily_limit: 0,
        weak_concept_monthly_limit: 0,
        weak_concept_daily_used: 0,
        weak_concept_monthly_used: 0,
        competency_analysis_enabled: 0,  // 기본값 0으로 변경 (비활성화)
        competency_daily_limit: 0,
        competency_monthly_limit: 0,
        competency_daily_used: 0,
        competency_monthly_used: 0,
      };
      
      console.log('⚠️ No limitation record found, returning default (all disabled):', { directorId, academyId });
      
      return new Response(JSON.stringify({ success: true, limitation: defaultLimitation }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, limitation }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Get director limitations error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to get director limitations",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// 학원장 제한 정보 생성 또는 업데이트
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json() as DirectorLimitation;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!body.director_id || !body.academy_id) {
      return new Response(JSON.stringify({ error: "director_id and academy_id required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 테이블 존재 확인 및 생성
    await DB.prepare(`
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

    // 기존 제한 확인
    const existing = await DB.prepare(`
      SELECT id FROM director_limitations WHERE director_id = ?
    `).bind(body.director_id).first();

    if (existing) {
      // 업데이트
      await DB.prepare(`
        UPDATE director_limitations SET
          academy_id = ?,
          homework_grading_daily_limit = ?,
          homework_grading_monthly_limit = ?,
          max_students = ?,
          similar_problem_enabled = ?,
          similar_problem_daily_limit = ?,
          similar_problem_monthly_limit = ?,
          weak_concept_analysis_enabled = ?,
          weak_concept_daily_limit = ?,
          weak_concept_monthly_limit = ?,
          competency_analysis_enabled = ?,
          competency_daily_limit = ?,
          competency_monthly_limit = ?,
          updated_at = datetime('now')
        WHERE director_id = ?
      `).bind(
        body.academy_id,
        body.homework_grading_daily_limit ?? 0,
        body.homework_grading_monthly_limit ?? 0,
        body.max_students ?? 0,
        body.similar_problem_enabled ?? 0,
        body.similar_problem_daily_limit ?? 0,
        body.similar_problem_monthly_limit ?? 0,
        body.weak_concept_analysis_enabled ?? 1,
        body.weak_concept_daily_limit ?? 0,
        body.weak_concept_monthly_limit ?? 0,
        body.competency_analysis_enabled ?? 1,
        body.competency_daily_limit ?? 0,
        body.competency_monthly_limit ?? 0,
        body.director_id
      ).run();

      console.log(`✅ Director limitation updated: directorId=${body.director_id}`);
    } else {
      // 생성
      await DB.prepare(`
        INSERT INTO director_limitations (
          director_id, academy_id,
          homework_grading_daily_limit, homework_grading_monthly_limit,
          max_students,
          similar_problem_enabled, similar_problem_daily_limit, similar_problem_monthly_limit,
          weak_concept_analysis_enabled, weak_concept_daily_limit, weak_concept_monthly_limit,
          competency_analysis_enabled, competency_daily_limit, competency_monthly_limit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        body.director_id,
        body.academy_id,
        body.homework_grading_daily_limit ?? 0,
        body.homework_grading_monthly_limit ?? 0,
        body.max_students ?? 0,
        body.similar_problem_enabled ?? 0,
        body.similar_problem_daily_limit ?? 0,
        body.similar_problem_monthly_limit ?? 0,
        body.weak_concept_analysis_enabled ?? 1,
        body.weak_concept_daily_limit ?? 0,
        body.weak_concept_monthly_limit ?? 0,
        body.competency_analysis_enabled ?? 1,
        body.competency_daily_limit ?? 0,
        body.competency_monthly_limit ?? 0
      ).run();

      console.log(`✅ Director limitation created: directorId=${body.director_id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Director limitation saved successfully"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Save director limitations error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to save director limitations",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
