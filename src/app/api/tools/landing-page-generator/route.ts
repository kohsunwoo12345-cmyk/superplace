import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 색상 보정 함수
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

// 히어로 텍스트 생성
function generateHeroText(businessName: string, mainService: string, targetAudience: string) {
  const templates = [
    `${targetAudience}의 성공을 위한 ${mainService}`,
    `${mainService}로 비즈니스를 성장시키세요`,
    `${targetAudience}가 선택한 1등 ${mainService}`,
    `더 나은 ${mainService}, ${businessName}와 함께`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// 기능 카드 생성
function generateFeatures(businessType: string, mainService: string) {
  const featureTemplates: Record<string, any[]> = {
    default: [
      { icon: "🎯", title: "전문성", desc: `${businessType} 분야의 풍부한 경험과 노하우를 바탕으로 최상의 서비스를 제공합니다.` },
      { icon: "⚡", title: "빠른 대응", desc: "고객의 요구사항에 신속하게 대응하여 최적의 솔루션을 제시합니다." },
      { icon: "💎", title: "검증된 성과", desc: "수많은 성공 사례를 통해 검증된 실력으로 고객의 성장을 돕습니다." },
      { icon: "🤝", title: "맞춤 컨설팅", desc: "고객 맞춤형 전략으로 최고의 ROI를 달성합니다." },
    ],
    마케팅: [
      { icon: "📈", title: "성과 중심", desc: "데이터 기반의 마케팅 전략으로 실질적인 성과를 만들어냅니다." },
      { icon: "🎯", title: "타겟 광고", desc: "정교한 타게팅으로 광고 효율을 극대화합니다." },
      { icon: "💡", title: "창의적 기획", desc: "차별화된 크리에이티브로 브랜드 가치를 높입니다." },
      { icon: "📊", title: "분석 리포트", desc: "상세한 성과 분석으로 지속적인 개선을 제공합니다." },
    ],
    교육: [
      { icon: "📚", title: "체계적 커리큘럼", desc: "검증된 교육 과정으로 확실한 실력 향상을 보장합니다." },
      { icon: "👨‍🏫", title: "전문 강사진", desc: "현업 전문가들의 실무 중심 강의를 제공합니다." },
      { icon: "🎓", title: "수료 후 지원", desc: "수료 후에도 지속적인 멘토링과 취업 지원을 제공합니다." },
      { icon: "💻", title: "실습 중심", desc: "이론과 실습의 완벽한 조화로 실전 역량을 키웁니다." },
    ],
    컨설팅: [
      { icon: "🔍", title: "정밀 진단", desc: "비즈니스를 면밀히 분석하여 핵심 문제를 파악합니다." },
      { icon: "💼", title: "맞춤 전략", desc: "기업 상황에 최적화된 전략을 수립합니다." },
      { icon: "📋", title: "실행 지원", desc: "전략 수립부터 실행까지 전 과정을 지원합니다." },
      { icon: "📊", title: "성과 관리", desc: "지속적인 모니터링으로 목표 달성을 보장합니다." },
    ],
  };

  const category = Object.keys(featureTemplates).find(key => 
    businessType?.includes(key)
  ) || 'default';
  
  return featureTemplates[category];
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

    const { businessName, businessType, targetAudience, mainService, colors } = await req.json();

    if (!businessName || !mainService) {
      return NextResponse.json(
        { error: "필수 정보를 입력해주세요" },
        { status: 400 }
      );
    }

    const primaryColor = colors || "#3B82F6";
    const secondaryColor = adjustColor(primaryColor, -20);
    
    // 요청사항에 맞는 커스텀 콘텐츠 생성
    const heroText = generateHeroText(businessName, mainService, targetAudience || "고객");
    const features = generateFeatures(businessType || "", mainService);
    
    // Generate professional landing page HTML with custom content
    const htmlCode = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessName} - ${mainService}</title>
    <meta name="description" content="${heroText}">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans KR', sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        header {
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px 0;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: ${primaryColor};
        }
        .cta-button {
            background: ${primaryColor};
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s;
        }
        .cta-button:hover {
            background: ${secondaryColor};
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        .hero {
            background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
            color: white;
            padding: 120px 0;
            text-align: center;
        }
        .hero h1 {
            font-size: 56px;
            margin-bottom: 24px;
            font-weight: 800;
            line-height: 1.2;
        }
        .hero .subtitle {
            font-size: 24px;
            margin-bottom: 16px;
            opacity: 0.95;
            font-weight: 500;
        }
        .hero p {
            font-size: 18px;
            margin-bottom: 40px;
            opacity: 0.9;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        .features {
            padding: 100px 0;
            background: #f9fafb;
        }
        .features h2 {
            text-align: center;
            font-size: 42px;
            margin-bottom: 16px;
            font-weight: 800;
        }
        .features .section-subtitle {
            text-align: center;
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 60px;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 30px;
        }
        .feature-card {
            background: white;
            padding: 40px 30px;
            border-radius: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.07);
            transition: all 0.3s;
            border: 2px solid transparent;
        }
        .feature-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.12);
            border-color: ${primaryColor};
        }
        .feature-icon {
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin-bottom: 24px;
        }
        .feature-card h3 {
            font-size: 24px;
            margin-bottom: 16px;
            color: #1f2937;
            font-weight: 700;
        }
        .feature-card p {
            color: #6b7280;
            line-height: 1.8;
            font-size: 16px;
        }
        .stats {
            background: white;
            padding: 80px 0;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 40px;
            text-align: center;
        }
        .stat-item h3 {
            font-size: 48px;
            color: ${primaryColor};
            font-weight: 800;
            margin-bottom: 8px;
        }
        .stat-item p {
            font-size: 16px;
            color: #6b7280;
        }
        .cta-section {
            background: ${primaryColor};
            color: white;
            padding: 100px 0;
            text-align: center;
        }
        .cta-section h2 {
            font-size: 42px;
            margin-bottom: 20px;
            font-weight: 800;
        }
        .cta-section p {
            font-size: 20px;
            margin-bottom: 40px;
            opacity: 0.95;
        }
        .cta-button-white {
            background: white;
            color: ${primaryColor};
            padding: 18px 48px;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s;
        }
        .cta-button-white:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 20px rgba(255,255,255,0.3);
        }
        footer {
            background: #1f2937;
            color: white;
            padding: 60px 0 30px;
        }
        .footer-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 40px;
            margin-bottom: 40px;
        }
        .footer-section h4 {
            font-size: 18px;
            margin-bottom: 16px;
            font-weight: 700;
        }
        .footer-section p, .footer-section a {
            color: #9ca3af;
            text-decoration: none;
            display: block;
            margin-bottom: 8px;
        }
        .footer-section a:hover {
            color: ${primaryColor};
        }
        .footer-bottom {
            border-top: 1px solid #374151;
            padding-top: 30px;
            text-align: center;
            color: #9ca3af;
        }
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 36px;
            }
            .hero .subtitle {
                font-size: 18px;
            }
            .hero p {
                font-size: 16px;
            }
            .features h2, .cta-section h2 {
                font-size: 32px;
            }
            .stat-item h3 {
                font-size: 36px;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <div class="header-content">
                <div class="logo">${businessName}</div>
                <a href="#contact" class="cta-button">문의하기</a>
            </div>
        </div>
    </header>

    <section class="hero">
        <div class="container">
            <h1>${businessName}</h1>
            <div class="subtitle">${heroText}</div>
            <p>${targetAudience || "고객"}의 성공을 위해 ${mainService}를 제공합니다</p>
            <a href="#contact" class="cta-button" style="font-size: 18px; padding: 16px 48px;">무료 상담 신청하기</a>
        </div>
    </section>

    <section class="stats">
        <div class="container">
            <div class="stats-grid">
                <div class="stat-item">
                    <h3>1,000+</h3>
                    <p>누적 고객사</p>
                </div>
                <div class="stat-item">
                    <h3>98%</h3>
                    <p>고객 만족도</p>
                </div>
                <div class="stat-item">
                    <h3>5년+</h3>
                    <p>업계 경험</p>
                </div>
                <div class="stat-item">
                    <h3>24/7</h3>
                    <p>고객 지원</p>
                </div>
            </div>
        </div>
    </section>

    <section class="features">
        <div class="container">
            <h2>왜 ${businessName}를 선택해야 할까요?</h2>
            <p class="section-subtitle">${businessType || "업계"} 최고의 서비스로 고객의 성공을 돕습니다</p>
            <div class="feature-grid">
${features.map(f => `                <div class="feature-card">
                    <div class="feature-icon">${f.icon}</div>
                    <h3>${f.title}</h3>
                    <p>${f.desc}</p>
                </div>`).join('\n')}
            </div>
        </div>
    </section>

    <section class="cta-section" id="contact">
        <div class="container">
            <h2>지금 바로 시작하세요</h2>
            <p>무료 상담으로 당신의 비즈니스를 다음 단계로 끌어올리세요</p>
            <a href="tel:010-1234-5678" class="cta-button-white">📞 무료 상담 신청 (010-1234-5678)</a>
        </div>
    </section>

    <footer>
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>${businessName}</h4>
                    <p>${mainService}</p>
                    <p>${businessType || "전문 서비스"}</p>
                </div>
                <div class="footer-section">
                    <h4>서비스</h4>
                    <a href="#">${mainService}</a>
                    <a href="#">컨설팅</a>
                    <a href="#">고객 지원</a>
                </div>
                <div class="footer-section">
                    <h4>회사</h4>
                    <a href="#">회사 소개</a>
                    <a href="#">팀 소개</a>
                    <a href="#">채용</a>
                </div>
                <div class="footer-section">
                    <h4>문의</h4>
                    <p>Tel: 010-1234-5678</p>
                    <p>Email: contact@${businessName.toLowerCase().replace(/\s+/g, '')}.com</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 ${businessName}. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script>
        // Smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    </script>
</body>
</html>`;

    return NextResponse.json({ htmlCode });
  } catch (error) {
    console.error("Landing page generation error:", error);
    return NextResponse.json(
      { error: "랜딩페이지 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
