import OpenAI from "openai";

// Initialize OpenAI client (will use env variable OPENAI_API_KEY)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "demo-mode",
});

// Check if we have a real API key
const hasRealApiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "demo-mode";

/**
 * AI Service for all content generation and analysis needs
 * Falls back to mock responses when API key is not configured
 */
export class AIService {
  /**
   * Generate blog post content with AI
   */
  static async generateBlogContent(params: {
    topic: string;
    keywords: string[];
    tone?: "professional" | "casual" | "friendly";
    length?: "short" | "medium" | "long";
  }): Promise<{ title: string; content: string; isRealAI: boolean }> {
    if (!hasRealApiKey) {
      return this.mockBlogContent(params);
    }

    try {
      const prompt = `다음 주제로 ${params.tone || "professional"} 톤의 블로그 포스트를 작성해주세요.

주제: ${params.topic}
키워드: ${params.keywords.join(", ")}
길이: ${params.length || "medium"}

제목과 본문을 한국어로 작성해주세요. 자연스럽고 읽기 쉬운 글을 작성해주세요.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content || "";
      const lines = response.split("\n");
      const title = lines[0].replace(/^#+\s*/, "").trim();
      const content = lines.slice(1).join("\n").trim();

      return { title, content, isRealAI: true };
    } catch (error) {
      console.error("AI generation error:", error);
      return this.mockBlogContent(params);
    }
  }

  /**
   * Analyze sentiment of reviews or comments
   */
  static async analyzeSentiment(texts: string[]): Promise<{
    overall: "positive" | "neutral" | "negative";
    scores: Array<{ text: string; sentiment: string; score: number }>;
    isRealAI: boolean;
  }> {
    if (!hasRealApiKey) {
      return this.mockSentimentAnalysis(texts);
    }

    try {
      const prompt = `다음 리뷰들의 감정을 분석해주세요. 각 리뷰에 대해 positive, neutral, negative 중 하나로 분류하고 0-1 사이의 점수를 매겨주세요.

리뷰들:
${texts.map((t, i) => `${i + 1}. ${t}`).join("\n")}

JSON 형식으로 응답해주세요:
{
  "overall": "positive|neutral|negative",
  "scores": [
    {"sentiment": "positive", "score": 0.85},
    ...
  ]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const response = JSON.parse(completion.choices[0].message.content || "{}");
      
      return {
        overall: response.overall,
        scores: texts.map((text, i) => ({
          text,
          sentiment: response.scores[i]?.sentiment || "neutral",
          score: response.scores[i]?.score || 0.5,
        })),
        isRealAI: true,
      };
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      return this.mockSentimentAnalysis(texts);
    }
  }

  /**
   * Generate Instagram captions and hashtags
   */
  static async generateInstagramContent(params: {
    description: string;
    mood?: string;
    targetAudience?: string;
  }): Promise<{
    caption: string;
    hashtags: string[];
    isRealAI: boolean;
  }> {
    if (!hasRealApiKey) {
      return this.mockInstagramContent(params);
    }

    try {
      const prompt = `다음 내용으로 Instagram 게시물의 매력적인 캡션과 해시태그를 생성해주세요.

내용: ${params.description}
분위기: ${params.mood || "트렌디하고 친근한"}
타겟: ${params.targetAudience || "일반"}

한국어로 작성하고, 이모지를 적절히 사용해주세요. 해시태그는 한국어와 영어를 섞어서 15-20개 정도 추천해주세요.

JSON 형식으로 응답:
{
  "caption": "캡션 내용",
  "hashtags": ["해시태그1", "해시태그2", ...]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      const response = JSON.parse(completion.choices[0].message.content || "{}");
      
      return {
        caption: response.caption,
        hashtags: response.hashtags,
        isRealAI: true,
      };
    } catch (error) {
      console.error("Instagram content generation error:", error);
      return this.mockInstagramContent(params);
    }
  }

  /**
   * Optimize YouTube video titles and descriptions
   */
  static async optimizeYouTubeContent(params: {
    originalTitle: string;
    videoTopic: string;
    keywords: string[];
  }): Promise<{
    optimizedTitle: string;
    description: string;
    tags: string[];
    isRealAI: boolean;
  }> {
    if (!hasRealApiKey) {
      return this.mockYouTubeContent(params);
    }

    try {
      const prompt = `YouTube 동영상의 제목과 설명을 SEO 최적화하여 개선해주세요.

원본 제목: ${params.originalTitle}
주제: ${params.videoTopic}
키워드: ${params.keywords.join(", ")}

클릭률을 높이면서도 자연스러운 한국어 제목과 상세한 설명, 그리고 관련 태그를 생성해주세요.

JSON 형식으로 응답:
{
  "optimizedTitle": "개선된 제목",
  "description": "상세 설명",
  "tags": ["태그1", "태그2", ...]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const response = JSON.parse(completion.choices[0].message.content || "{}");
      
      return {
        optimizedTitle: response.optimizedTitle,
        description: response.description,
        tags: response.tags,
        isRealAI: true,
      };
    } catch (error) {
      console.error("YouTube optimization error:", error);
      return this.mockYouTubeContent(params);
    }
  }

  /**
   * Analyze TikTok trends and generate content ideas
   */
  static async analyzeTikTokTrends(params: {
    niche: string;
    currentTrends?: string[];
  }): Promise<{
    contentIdeas: Array<{ title: string; description: string; hooks: string[] }>;
    trendingHashtags: string[];
    isRealAI: boolean;
  }> {
    if (!hasRealApiKey) {
      return this.mockTikTokTrends(params);
    }

    try {
      const prompt = `다음 분야의 TikTok 콘텐츠 아이디어와 트렌드를 분석해주세요.

분야: ${params.niche}
현재 트렌드: ${params.currentTrends?.join(", ") || "일반"}

5개의 콘텐츠 아이디어와 각각의 후킹 문구, 그리고 트렌딩 해시태그를 제안해주세요.

JSON 형식으로 응답:
{
  "contentIdeas": [
    {
      "title": "콘텐츠 제목",
      "description": "상세 설명",
      "hooks": ["후킹 문구1", "후킹 문구2"]
    }
  ],
  "trendingHashtags": ["해시태그1", "해시태그2", ...]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      const response = JSON.parse(completion.choices[0].message.content || "{}");
      
      return {
        contentIdeas: response.contentIdeas,
        trendingHashtags: response.trendingHashtags,
        isRealAI: true,
      };
    } catch (error) {
      console.error("TikTok trend analysis error:", error);
      return this.mockTikTokTrends(params);
    }
  }

  /**
   * Generate product descriptions for Karrot (당근마켓)
   */
  static async generateKarrotDescription(params: {
    productName: string;
    condition: string;
    price: number;
    category: string;
  }): Promise<{
    title: string;
    description: string;
    tips: string[];
    isRealAI: boolean;
  }> {
    if (!hasRealApiKey) {
      return this.mockKarrotDescription(params);
    }

    try {
      const prompt = `당근마켓 판매글을 작성해주세요.

상품명: ${params.productName}
상태: ${params.condition}
가격: ${params.price.toLocaleString()}원
카테고리: ${params.category}

구매자의 관심을 끌 수 있는 제목과 상세한 설명, 그리고 판매 팁을 작성해주세요.

JSON 형식으로 응답:
{
  "title": "매력적인 제목",
  "description": "상세 설명",
  "tips": ["판매 팁1", "판매 팁2", ...]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const response = JSON.parse(completion.choices[0].message.content || "{}");
      
      return {
        title: response.title,
        description: response.description,
        tips: response.tips,
        isRealAI: true,
      };
    } catch (error) {
      console.error("Karrot description generation error:", error);
      return this.mockKarrotDescription(params);
    }
  }

  /**
   * Generate marketing insights from analytics data
   */
  static async generateMarketingInsights(data: {
    platform: string;
    metrics: Record<string, number>;
    timeframe: string;
  }): Promise<{
    insights: string[];
    recommendations: string[];
    isRealAI: boolean;
  }> {
    if (!hasRealApiKey) {
      return this.mockMarketingInsights(data);
    }

    try {
      const prompt = `다음 마케팅 데이터를 분석하고 인사이트를 제공해주세요.

플랫폼: ${data.platform}
기간: ${data.timeframe}
지표: ${JSON.stringify(data.metrics, null, 2)}

데이터를 분석하여 주요 인사이트와 실행 가능한 추천사항을 제시해주세요.

JSON 형식으로 응답:
{
  "insights": ["인사이트1", "인사이트2", ...],
  "recommendations": ["추천사항1", "추천사항2", ...]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      const response = JSON.parse(completion.choices[0].message.content || "{}");
      
      return {
        insights: response.insights,
        recommendations: response.recommendations,
        isRealAI: true,
      };
    } catch (error) {
      console.error("Marketing insights generation error:", error);
      return this.mockMarketingInsights(data);
    }
  }

  // Mock responses for when API key is not configured
  private static mockBlogContent(params: any) {
    return {
      title: `${params.topic}에 대한 완벽 가이드`,
      content: `# ${params.topic}에 대한 완벽 가이드

${params.topic}은(는) 현대 마케팅에서 매우 중요한 요소입니다. 이 글에서는 ${params.keywords.join(", ")}을(를) 중심으로 자세히 알아보겠습니다.

## 주요 내용

1. **기본 개념 이해하기**
   - ${params.keywords[0]}의 중요성
   - 실전 활용 방법

2. **실무 적용 전략**
   - 단계별 가이드
   - 주의사항 및 팁

3. **성공 사례 분석**
   - 실제 사례 연구
   - 배울 점과 적용 방법

## 결론

${params.topic}을(를) 올바르게 이해하고 활용한다면, 마케팅 성과를 크게 향상시킬 수 있습니다.

⚠️ 이것은 샘플 콘텐츠입니다. OPENAI_API_KEY를 설정하면 실제 AI가 생성한 콘텐츠를 받을 수 있습니다.`,
      isRealAI: false,
    };
  }

  private static mockSentimentAnalysis(texts: string[]) {
    return {
      overall: "positive" as const,
      scores: texts.map((text) => ({
        text,
        sentiment: "positive",
        score: 0.75,
      })),
      isRealAI: false,
    };
  }

  private static mockInstagramContent(params: any) {
    return {
      caption: `✨ ${params.description} ✨

오늘도 멋진 하루 보내세요! 💫
더 많은 정보는 프로필 링크에서 확인하세요 👆

⚠️ 샘플 캡션입니다. OPENAI_API_KEY를 설정하면 AI가 생성한 캡션을 받을 수 있습니다.`,
      hashtags: [
        "마케팅",
        "디지털마케팅",
        "SNS마케팅",
        "marketing",
        "digitalmarketing",
        "소셜미디어",
        "인스타그램",
        "instagram",
        "비즈니스",
        "business",
      ],
      isRealAI: false,
    };
  }

  private static mockYouTubeContent(params: any) {
    return {
      optimizedTitle: `${params.originalTitle} | 완벽 가이드 2024`,
      description: `${params.videoTopic}에 대한 완벽한 가이드입니다.

🎯 이 영상에서 다루는 내용:
- ${params.keywords[0]} 기초부터 실전까지
- ${params.keywords[1]} 활용 팁
- 실무 노하우 공유

⚠️ 샘플 설명입니다. OPENAI_API_KEY를 설정하면 AI가 최적화한 내용을 받을 수 있습니다.`,
      tags: params.keywords,
      isRealAI: false,
    };
  }

  private static mockTikTokTrends(params: any) {
    return {
      contentIdeas: [
        {
          title: `${params.niche} 초보자도 5분만에!`,
          description: "쉽고 빠르게 따라할 수 있는 팁",
          hooks: ["이거 모르면 손해!", "지금 바로 시도해보세요"],
        },
        {
          title: `${params.niche} 실수 TOP 5`,
          description: "초보자들이 흔히 하는 실수와 해결법",
          hooks: ["여러분도 하고 계신가요?", "이것만은 피하세요!"],
        },
      ],
      trendingHashtags: [
        "fyp",
        "tiktok",
        params.niche,
        "꿀팁",
        "정보",
        "추천",
      ],
      isRealAI: false,
    };
  }

  private static mockKarrotDescription(params: any) {
    return {
      title: `${params.productName} ${params.condition} 판매`,
      description: `${params.productName} 판매합니다.

📦 상품 정보:
- 상태: ${params.condition}
- 가격: ${params.price.toLocaleString()}원
- 카테고리: ${params.category}

💬 채팅 주시면 친절하게 답변드리겠습니다!

⚠️ 샘플 설명입니다. OPENAI_API_KEY를 설정하면 AI가 생성한 설명을 받을 수 있습니다.`,
      tips: [
        "깔끔한 사진을 여러 장 올리세요",
        "가격은 협상 가능 여부를 명시하세요",
        "거래 희망 지역을 구체적으로 적으세요",
      ],
      isRealAI: false,
    };
  }

  private static mockMarketingInsights(data: any) {
    return {
      insights: [
        `${data.platform} 활동이 ${data.timeframe} 동안 활발했습니다.`,
        "주요 지표들이 전반적으로 긍정적인 추세를 보입니다.",
        "추가 분석을 통해 더 자세한 인사이트를 얻을 수 있습니다.",
      ],
      recommendations: [
        "콘텐츠 게시 빈도를 늘려보세요.",
        "사용자 참여를 유도하는 캠페인을 진행해보세요.",
        "성과가 좋은 콘텐츠 유형을 분석하여 더 많이 활용하세요.",
      ],
      isRealAI: false,
    };
  }
}
