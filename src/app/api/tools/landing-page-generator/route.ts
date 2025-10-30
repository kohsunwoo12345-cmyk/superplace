import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    
    // Generate professional landing page HTML
    const htmlCode = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessName} - ${mainService}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        .hero {
            background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%);
            color: white;
            padding: 100px 0;
            text-align: center;
        }
        .hero h1 {
            font-size: 48px;
            margin-bottom: 20px;
        }
        .hero p {
            font-size: 20px;
            margin-bottom: 40px;
            opacity: 0.9;
        }
        .features {
            padding: 80px 0;
            background: #f9fafb;
        }
        .features h2 {
            text-align: center;
            font-size: 36px;
            margin-bottom: 60px;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }
        .feature-card {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.15);
        }
        .feature-icon {
            width: 60px;
            height: 60px;
            background: ${primaryColor};
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            margin-bottom: 20px;
        }
        .feature-card h3 {
            font-size: 22px;
            margin-bottom: 15px;
            color: #1f2937;
        }
        .feature-card p {
            color: #6b7280;
            line-height: 1.8;
        }
        .cta-section {
            background: ${primaryColor};
            color: white;
            padding: 80px 0;
            text-align: center;
        }
        .cta-section h2 {
            font-size: 36px;
            margin-bottom: 20px;
        }
        .cta-section p {
            font-size: 18px;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        .cta-button-white {
            background: white;
            color: ${primaryColor};
            padding: 15px 40px;
            border: none;
            border-radius: 6px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        footer {
            background: #1f2937;
            color: white;
            padding: 40px 0;
            text-align: center;
        }
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 32px;
            }
            .hero p {
                font-size: 16px;
            }
            .features h2, .cta-section h2 {
                font-size: 28px;
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
            <h1>${mainService}</h1>
            <p>${targetAudience || "여러분"}을 위한 최고의 솔루션</p>
            <a href="#contact" class="cta-button">무료 상담 받기</a>
        </div>
    </section>

    <section class="features">
        <div class="container">
            <h2>왜 ${businessName}인가요?</h2>
            <div class="feature-grid">
                <div class="feature-card">
                    <div class="feature-icon">🎯</div>
                    <h3>전문성</h3>
                    <p>${businessType || "업계"} 분야의 풍부한 경험과 노하우를 바탕으로 최상의 서비스를 제공합니다.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">⚡</div>
                    <h3>빠른 대응</h3>
                    <p>고객의 요구사항에 신속하게 대응하여 최적의 솔루션을 제시합니다.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">💎</div>
                    <h3>검증된 성과</h3>
                    <p>수많은 성공 사례를 통해 검증된 실력으로 고객의 성장을 돕습니다.</p>
                </div>
            </div>
        </div>
    </section>

    <section class="cta-section" id="contact">
        <div class="container">
            <h2>지금 바로 시작하세요</h2>
            <p>무료 상담으로 당신의 비즈니스를 성장시킬 기회를 잡으세요</p>
            <a href="tel:010-1234-5678" class="cta-button-white">📞 상담 신청하기</a>
        </div>
    </section>

    <footer>
        <div class="container">
            <p>&copy; 2024 ${businessName}. All rights reserved.</p>
        </div>
    </footer>
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
