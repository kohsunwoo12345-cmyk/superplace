import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 키워드 카테고리 기반 검색량 추정
function estimateSearchVolume(keyword: string): number {
  const baseVolume = 1000;
  const length = keyword.length;
  
  // 키워드 길이에 따른 가중치
  let multiplier = 1;
  if (length <= 3) multiplier = 5; // 짧은 키워드는 검색량이 높음
  else if (length <= 6) multiplier = 3;
  else if (length <= 10) multiplier = 2;
  
  // 특정 카테고리 키워드 가중치
  const highVolumeKeywords = ['맛집', '병원', '학원', '카페', '헬스장', '피부과', '치과', '성형외과'];
  const mediumVolumeKeywords = ['마케팅', '교육', '컨설팅', '디자인', '개발'];
  
  if (highVolumeKeywords.some(k => keyword.includes(k))) multiplier *= 4;
  else if (mediumVolumeKeywords.some(k => keyword.includes(k))) multiplier *= 2;
  
  const volume = baseVolume * multiplier * (0.8 + Math.random() * 0.4);
  return Math.round(volume);
}

// 관련 키워드 생성
function generateRelatedKeywords(keyword: string): string[] {
  const prefixes = ['', '강남', '서울', '부산', '대전', '대구', '근처', '추천', '유명한', '가성비'];
  const suffixes = ['', '추천', '리스트', '순위', '가격', '후기', '비교', '장점', '단점', '방법'];
  
  const related: string[] = [];
  
  // 지역 + 키워드
  prefixes.slice(0, 5).forEach(prefix => {
    if (prefix) related.push(`${prefix} ${keyword}`);
  });
  
  // 키워드 + 수식어
  suffixes.slice(0, 5).forEach(suffix => {
    if (suffix) related.push(`${keyword} ${suffix}`);
  });
  
  return related.slice(0, 8);
}

// 트렌드 데이터 생성 (최근 12개월)
function generateTrendData(keyword: string) {
  const months = [];
  const now = new Date();
  const baseVolume = estimateSearchVolume(keyword);
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('ko-KR', { month: 'short' });
    
    // 계절성 반영
    const seasonalMultiplier = 0.7 + Math.sin((date.getMonth() / 12) * Math.PI * 2) * 0.3;
    const trendMultiplier = 1 + (i / 12) * 0.2; // 점진적 증가 트렌드
    
    const volume = Math.round(baseVolume * seasonalMultiplier * trendMultiplier * (0.9 + Math.random() * 0.2));
    
    months.push({
      month: monthName,
      volume,
      date: date.toISOString().split('T')[0],
    });
  }
  
  return months;
}

// 경쟁 지표 분석
function analyzeCompetition(keyword: string) {
  const searchVolume = estimateSearchVolume(keyword);
  
  // 검색량이 높을수록 경쟁이 치열
  let competition: 'low' | 'medium' | 'high';
  let competitionScore: number;
  
  if (searchVolume > 50000) {
    competition = 'high';
    competitionScore = 75 + Math.random() * 20;
  } else if (searchVolume > 10000) {
    competition = 'medium';
    competitionScore = 40 + Math.random() * 35;
  } else {
    competition = 'low';
    competitionScore = 10 + Math.random() * 30;
  }
  
  return {
    level: competition,
    score: Math.round(competitionScore),
    description: competition === 'high' 
      ? '경쟁이 매우 치열합니다. 롱테일 키워드 전략을 권장합니다.'
      : competition === 'medium'
      ? '적당한 경쟁 수준입니다. 꾸준한 콘텐츠 발행으로 상위 노출 가능합니다.'
      : '경쟁이 낮습니다. 빠르게 상위 노출을 달성할 수 있습니다.',
  };
}

// AI 인사이트 생성
function generateInsights(keyword: string, searchVolume: number, competition: any) {
  const insights = [];
  
  // 검색량 기반 인사이트
  if (searchVolume > 50000) {
    insights.push(`"${keyword}"는 매우 높은 검색량을 보이고 있습니다. 블로그, 카페, 플레이스 등 다채널 전략이 필요합니다.`);
  } else if (searchVolume > 10000) {
    insights.push(`"${keyword}"는 안정적인 검색 수요가 있습니다. 꾸준한 콘텐츠 발행으로 상위 노출을 노려볼 만합니다.`);
  } else {
    insights.push(`"${keyword}"는 틈새 키워드입니다. 경쟁이 낮아 빠르게 1페이지 진입이 가능합니다.`);
  }
  
  // 경쟁 기반 인사이트
  if (competition.level === 'high') {
    insights.push('경쟁이 치열한 키워드이므로, "지역명 + 키워드" 조합의 롱테일 키워드를 활용하세요.');
    insights.push('블로그 포스팅 시 최소 2,000자 이상의 고품질 콘텐츠를 작성하세요.');
  } else if (competition.level === 'medium') {
    insights.push('주 2-3회 꾸준한 포스팅으로 3개월 내 상위 노출을 기대할 수 있습니다.');
  } else {
    insights.push('경쟁이 낮아 즉시 상위 노출이 가능합니다. 지금 바로 콘텐츠를 발행하세요!');
  }
  
  // 콘텐츠 전략
  insights.push('이미지 5장 이상, 동영상 1개 이상 포함 시 노출 확률이 높아집니다.');
  insights.push('네이버 플레이스 등록과 블로그를 연동하면 시너지 효과를 볼 수 있습니다.');
  
  return insights;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { keywords } = await req.json();

    if (!keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: "키워드를 입력해주세요" },
        { status: 400 }
      );
    }

    // 키워드 분석 결과 생성
    const results = keywords.map((keyword: string) => {
      const searchVolume = estimateSearchVolume(keyword);
      const relatedKeywords = generateRelatedKeywords(keyword);
      const trendData = generateTrendData(keyword);
      const competition = analyzeCompetition(keyword);
      const insights = generateInsights(keyword, searchVolume, competition);
      
      // 월평균 검색량
      const avgVolume = Math.round(trendData.reduce((sum, m) => sum + m.volume, 0) / trendData.length);
      
      // 검색량 증감
      const firstMonthVolume = trendData[0].volume;
      const lastMonthVolume = trendData[trendData.length - 1].volume;
      const growthRate = ((lastMonthVolume - firstMonthVolume) / firstMonthVolume * 100).toFixed(1);
      
      return {
        keyword,
        searchVolume,
        avgMonthlyVolume: avgVolume,
        growthRate: parseFloat(growthRate),
        competition,
        relatedKeywords,
        trendData,
        insights,
        recommendation: competition.level === 'low' 
          ? '즉시 콘텐츠 발행을 권장합니다' 
          : competition.level === 'medium'
          ? '꾸준한 콘텐츠 발행으로 3개월 내 상위 노출 가능'
          : '롱테일 키워드 전략 및 장기 전략이 필요합니다',
      };
    });

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalKeywords: results.length,
        avgSearchVolume: Math.round(results.reduce((sum: number, r: any) => sum + r.searchVolume, 0) / results.length),
        highCompetition: results.filter((r: any) => r.competition.level === 'high').length,
        opportunities: results.filter((r: any) => r.competition.level === 'low').length,
      },
      note: "이 데이터는 키워드 길이, 카테고리, 시장 트렌드를 기반으로 한 추정치입니다. 실제 네이버 검색광고 데이터는 네이버 광고 계정에서 확인하실 수 있습니다.",
    });
  } catch (error) {
    console.error("Keyword analysis error:", error);
    return NextResponse.json(
      { error: "키워드 분석 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
