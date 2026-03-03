// 사용량 알림 조회 API
// 학원장의 사용량 알림 목록 조회

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get('academyId');
    const directorId = url.searchParams.get('directorId');
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    
    if (!academyId && !directorId) {
      return new Response(JSON.stringify({ 
        error: "academyId or directorId required" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    let query = `
      SELECT * FROM usage_alerts 
      WHERE 1=1
    `;
    const params = [];
    
    if (academyId) {
      query += ` AND academyId = ?`;
      params.push(academyId);
    }
    
    if (directorId) {
      query += ` AND directorId = ?`;
      params.push(directorId);
    }
    
    if (unreadOnly) {
      query += ` AND notified = 0`;
    }
    
    query += ` ORDER BY createdAt DESC LIMIT 50`;
    
    const stmt = DB.prepare(query);
    const alerts = await stmt.bind(...params).all();
    
    // 타입별 라벨 추가
    const alertsWithLabels = alerts.results.map((alert: any) => ({
      ...alert,
      typeLabel: getTypeLabel(alert.type),
      thresholdLabel: getThresholdLabel(alert.threshold),
      message: generateAlertMessage(alert)
    }));
    
    return new Response(JSON.stringify({
      success: true,
      alerts: alertsWithLabels,
      total: alerts.results.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error: any) {
    console.error("알림 조회 오류:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "알림 조회 실패",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'student': '학생 등록',
    'homework_check': '숙제 검사',
    'ai_analysis': 'AI 분석',
    'similar_problem': '유사문제 출제',
    'landing_page': '랜딩페이지 제작'
  };
  return labels[type] || type;
}

function getThresholdLabel(threshold: number): string {
  if (threshold >= 100) return '한도 초과';
  if (threshold >= 95) return '95% 도달';
  if (threshold >= 90) return '90% 도달';
  return `${threshold}% 도달`;
}

function generateAlertMessage(alert: any): string {
  const typeLabel = getTypeLabel(alert.type);
  const percentage = alert.percentage;
  
  if (percentage >= 100) {
    return `⛔ ${typeLabel} 한도를 초과했습니다! (${alert.current}/${alert.limit}) 플랜을 업그레이드해주세요.`;
  } else if (percentage >= 95) {
    return `🚨 ${typeLabel} 한도의 95%에 도달했습니다. (${alert.current}/${alert.limit}) 곧 한도에 도달합니다.`;
  } else if (percentage >= 90) {
    return `⚠️ ${typeLabel} 한도의 90%에 도달했습니다. (${alert.current}/${alert.limit}) 한도를 확인해주세요.`;
  }
  return `${typeLabel}: ${alert.current}/${alert.limit} (${percentage}%)`;
}
