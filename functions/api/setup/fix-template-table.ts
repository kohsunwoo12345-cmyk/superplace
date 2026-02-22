// Cloudflare Pages Function - Fix Template Table Schema
// This API will drop and recreate the LandingPageTemplate table without foreign key constraints
// Access: /api/setup/fix-template-table

export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json();
    const { password } = body;
    
    if (password !== "setup-templates-2026") {
      return new Response(JSON.stringify({ 
        error: "Invalid password" 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = context.env.DB;
    
    console.log('🔧 Starting template table fix...');
    
    // Step 1: Drop the existing table
    try {
      await db.prepare(`DROP TABLE IF EXISTS LandingPageTemplate`).run();
      console.log('✅ Dropped old LandingPageTemplate table');
    } catch (error: any) {
      console.error('⚠️ Failed to drop table:', error.message);
    }
    
    // Step 2: Create new table WITHOUT foreign key constraint
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS LandingPageTemplate (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          html TEXT NOT NULL,
          variables TEXT,
          isDefault INTEGER DEFAULT 0,
          usageCount INTEGER DEFAULT 0,
          createdById TEXT,
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).run();
      console.log('✅ Created new LandingPageTemplate table (createdById nullable, no FK)');
    } catch (error: any) {
      console.error('❌ Failed to create table:', error.message);
      throw error;
    }
    
    // Step 3: Create indexes
    try {
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_landing_template_default ON LandingPageTemplate(isDefault)`).run();
      console.log('✅ Created indexes');
    } catch (error: any) {
      console.log('⚠️ Index creation warning:', error.message);
    }
    
    // Step 4: Insert 5 default templates
    const templates = [
      {
        id: 'tpl_student_report_001',
        name: '🌟 학생 성장 상세 리포트',
        description: '문제점, 개선 과정, 결과까지 완벽하게 보여주는 스토리텔링 리포트',
        html: '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{studentName}} 성장 리포트</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;padding:20px}.container{max-width:900px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden}.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:50px 30px;text-align:center}.header h1{font-size:36px;margin-bottom:10px;font-weight:700}.header .period{font-size:20px;opacity:.95;font-weight:500}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:40px 30px;background:#f8f9fa}.stat{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:30px;border-radius:12px;text-align:center;box-shadow:0 4px 15px rgba(102,126,234,.4)}.stat-value{font-size:48px;font-weight:700;margin-bottom:5px}.stat-label{font-size:15px;opacity:.9}.section{margin:0 30px 30px;padding:35px;background:#f9fafb;border-radius:12px}.section-title{font-size:26px;font-weight:700;color:#1f2937;margin-bottom:25px;padding-left:18px;border-left:5px solid #667eea}.problem{background:#fee2e2;border-left:5px solid #ef4444;padding:25px;border-radius:10px;margin-bottom:20px}.problem h3{font-size:20px;color:#991b1b;margin-bottom:15px;display:flex;align-items:center;gap:10px}.problem p{color:#7f1d1d;line-height:1.9;font-size:16px}.freq{background:#fff;padding:18px;border-radius:8px;margin-top:15px;display:flex;justify-content:space-between;align-items:center}.freq-label{font-weight:600;color:#374151}.freq-value{color:#ef4444;font-weight:700;font-size:18px}.process{background:#dbeafe;border-left:5px solid #3b82f6;padding:25px;border-radius:10px;margin-bottom:30px}.process h3{font-size:20px;color:#1e40af;margin-bottom:20px;display:flex;align-items:center;gap:10px}.step{margin:15px 0;padding-left:30px;position:relative}.step::before{content:"";position:absolute;left:0;top:8px;width:20px;height:20px;background:#3b82f6;border-radius:50%;border:3px solid #fff}.step-title{font-size:18px;font-weight:600;color:#1e3a8a;margin-bottom:8px}.step-desc{color:#1e40af;line-height:1.7;font-size:15px}.results{background:#d1fae5;border-left:5px solid #10b981;padding:25px;border-radius:10px}.results h3{font-size:20px;color:#065f46;margin-bottom:20px;display:flex;align-items:center;gap:10px}.achievement{background:#fff;padding:20px;border-radius:8px;margin-bottom:15px}.achievement-title{font-size:17px;font-weight:600;color:#065f46;margin-bottom:12px}.comparison{display:grid;grid-template-columns:1fr auto 1fr;gap:15px;align-items:center}.comparison-before,.comparison-after{text-align:center;padding:15px;border-radius:8px}.comparison-before{background:#fef3c7;color:#92400e}.comparison-after{background:#d1fae5;color:#065f46}.comparison-arrow{font-size:24px;color:#10b981}.comp-value{font-size:28px;font-weight:700;margin-bottom:5px}.comp-label{font-size:13px;opacity:.8}.teacher-comment{background:#f3f4f6;border-left:5px solid #667eea;padding:25px;border-radius:10px;margin-top:30px}.teacher-comment h3{font-size:20px;color:#1f2937;margin-bottom:15px;display:flex;align-items:center;gap:10px}.teacher-comment p{color:#4b5563;line-height:1.8;font-size:16px}footer{text-align:center;padding:30px;background:#f8f9fa;color:#6b7280}.footer-academy{font-size:18px;font-weight:600;color:#1f2937;margin-bottom:8px}.footer-date{font-size:14px}</style></head><body><div class="container"><div class="header"><h1>🌟 {{studentName}} 학생 성장 리포트</h1><div class="period">{{period}}</div></div><div class="stats"><div class="stat"><div class="stat-value">{{attendanceRate}}%</div><div class="stat-label">출석률</div></div><div class="stat"><div class="stat-value">{{homeworkRate}}%</div><div class="stat-label">과제 완성률</div></div><div class="stat"><div class="stat-value">{{avgScore}}점</div><div class="stat-label">현재 평균</div></div></div><div class="section"><div class="section-title">🔍 발견된 문제점</div><div class="problem"><h3>❌ 주요 문제</h3><p>{{problemDescription}}</p><div class="freq"><span class="freq-label">발생 빈도</span><span class="freq-value">{{problemFrequency}}</span></div></div></div><div class="section"><div class="section-title">💡 개선 과정</div><div class="process"><h3>🎯 3단계 맞춤 솔루션</h3><div class="step"><div class="step-title">1단계: 기초 다지기</div><div class="step-desc">{{improvementStep1}}</div></div><div class="step"><div class="step-title">2단계: 습관 형성</div><div class="step-desc">{{improvementStep2}}</div></div><div class="step"><div class="step-title">3단계: 실전 적용</div><div class="step-desc">{{improvementStep3}}</div></div></div></div><div class="section"><div class="section-title">📈 개선 결과</div><div class="results"><h3>✅ 놀라운 성장!</h3><p style="color:#065f46;font-size:16px;margin-bottom:20px;line-height:1.7">{{achievementDescription}}</p><div class="achievement"><div class="achievement-title">📊 점수 변화</div><div class="comparison"><div class="comparison-before"><div class="comp-value">{{scoreBefore}}점</div><div class="comp-label">개선 전</div></div><div class="comparison-arrow">→</div><div class="comparison-after"><div class="comp-value">{{scoreAfter}}점</div><div class="comp-label">개선 후</div></div></div></div><div class="achievement"><div class="achievement-title">🧠 이해도 향상</div><div class="comparison"><div class="comparison-before"><div class="comp-value">{{understandingBefore}}%</div><div class="comp-label">개선 전</div></div><div class="comparison-arrow">→</div><div class="comparison-after"><div class="comp-value">{{understandingAfter}}%</div><div class="comp-label">개선 후</div></div></div></div><div class="achievement"><div class="achievement-title">😊 학습 태도</div><div class="comparison"><div class="comparison-before"><div class="comp-value">{{attitudeBefore}}</div><div class="comp-label">개선 전</div></div><div class="comparison-arrow">→</div><div class="comparison-after"><div class="comp-value">{{attitudeAfter}}</div><div class="comp-label">개선 후</div></div></div></div></div></div><div class="section"><div class="teacher-comment"><h3>💬 담당 선생님 총평</h3><p>{{teacherComment}}</p></div></div><footer><div class="footer-academy">{{academyName}}</div><div class="footer-date">리포트 생성일: {{generatedDate}}</div></footer></div></body></html>',
        variables: '["studentName","period","attendanceRate","homeworkRate","avgScore","problemDescription","problemFrequency","improvementStep1","improvementStep2","improvementStep3","achievementDescription","scoreBefore","scoreAfter","understandingBefore","understandingAfter","attitudeBefore","attitudeAfter","teacherComment","academyName","generatedDate"]',
        isDefault: 1
      },
      {
        id: 'tpl_academy_intro_001',
        name: '🎓 모던 학원 소개',
        description: '세련되고 전문적인 학원 소개 페이지',
        html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{academyName}}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui}header{background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#fff;padding:60px 20px;text-align:center}h1{font-size:48px;margin-bottom:16px}p{font-size:18px;opacity:.9}.container{max-width:1200px;margin:0 auto;padding:60px 20px}.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:30px;margin:40px 0}.feature-card{background:#fff;padding:30px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.1);transition:transform .3s}.feature-card:hover{transform:translateY(-5px)}.feature-icon{font-size:48px;margin-bottom:16px}.feature-title{font-size:20px;font-weight:700;margin-bottom:12px;color:#1f2937}.feature-desc{color:#6b7280;line-height:1.6}.cta{text-align:center;margin-top:60px}.cta-button{display:inline-block;background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#fff;padding:16px 48px;border-radius:8px;text-decoration:none;font-size:18px;font-weight:700;transition:transform .3s}.cta-button:hover{transform:scale(1.05)}</style></head><body><header><h1>{{academyName}}</h1><p>{{tagline}}</p></header><div class="container"><div class="features"><div class="feature-card"><div class="feature-icon">📚</div><div class="feature-title">체계적인 커리큘럼</div><div class="feature-desc">{{feature1}}</div></div><div class="feature-card"><div class="feature-icon">👨‍🏫</div><div class="feature-title">최고의 강사진</div><div class="feature-desc">{{feature2}}</div></div><div class="feature-card"><div class="feature-icon">🎯</div><div class="feature-title">맞춤형 학습관리</div><div class="feature-desc">{{feature3}}</div></div></div><div class="cta"><a href="#contact" class="cta-button">무료 상담 신청하기</a></div></div></body></html>',
        variables: '["academyName","tagline","feature1","feature2","feature3"]',
        isDefault: 0
      },
      {
        id: 'tpl_event_001',
        name: '🎉 이벤트 & 세미나',
        description: '특별 이벤트와 세미나 안내 페이지',
        html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{eventTitle}}</title><style>body{font-family:system-ui;margin:0;background:linear-gradient(135deg,#ff6b6b 0%,#ee5a6f 100%);color:#fff}.container{max-width:800px;margin:0 auto;padding:40px 20px;text-align:center}.badge{display:inline-block;background:rgba(255,255,255,.2);padding:8px 20px;border-radius:20px;font-size:14px;margin-bottom:20px}h1{font-size:48px;margin-bottom:16px;text-shadow:2px 2px 4px rgba(0,0,0,.2)}.date{font-size:24px;margin:20px 0;opacity:.9}.description{font-size:18px;line-height:1.8;margin:30px 0;background:rgba(255,255,255,.1);padding:30px;border-radius:12px}.highlights{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin:40px 0}.highlight{background:rgba(255,255,255,.15);padding:20px;border-radius:8px}.highlight-icon{font-size:36px;margin-bottom:12px}.register{margin-top:40px}.register-btn{display:inline-block;background:#fff;color:#ff6b6b;padding:16px 48px;border-radius:8px;text-decoration:none;font-size:18px;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,.2);transition:transform .3s}.register-btn:hover{transform:scale(1.05)}</style></head><body><div class="container"><div class="badge">특별 이벤트</div><h1>{{eventTitle}}</h1><div class="date">📅 {{eventDate}} {{eventTime}}</div><div class="description">{{description}}</div><div class="highlights"><div class="highlight"><div class="highlight-icon">🎁</div><div>{{benefit1}}</div></div><div class="highlight"><div class="highlight-icon">⭐</div><div>{{benefit2}}</div></div><div class="highlight"><div class="highlight-icon">🚀</div><div>{{benefit3}}</div></div></div><div class="register"><a href="#register" class="register-btn">지금 신청하기</a></div></div></body></html>',
        variables: '["eventTitle","eventDate","eventTime","description","benefit1","benefit2","benefit3"]',
        isDefault: 0
      },
      {
        id: 'tpl_free_trial_001',
        name: '🚀 무료 체험 신청',
        description: '무료 체험 수업 신청을 위한 전환 최적화 페이지',
        html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>무료 체험 신청</title><style>body{font-family:system-ui;margin:0;background:#f3f4f6}.hero{background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;padding:80px 20px;text-align:center}.urgency{background:#fbbf24;color:#92400e;display:inline-block;padding:8px 20px;border-radius:20px;font-weight:700;margin-bottom:20px}h1{font-size:48px;margin-bottom:16px;text-shadow:2px 2px 4px rgba(0,0,0,.2)}.subtitle{font-size:24px;opacity:.9}.container{max-width:1000px;margin:-60px auto 0;position:relative;z-index:1;padding:0 20px}.benefits{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-bottom:40px}.benefit-card{background:#fff;padding:30px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.1)}.benefit-icon{font-size:48px;margin-bottom:16px}.benefit-title{font-size:18px;font-weight:700;margin-bottom:8px;color:#1f2937}.benefit-desc{color:#6b7280}.cta-section{background:#fff;padding:40px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.1);text-align:center}.cta-title{font-size:32px;color:#1f2937;margin-bottom:20px}.cta-button{display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;padding:20px 60px;border-radius:8px;text-decoration:none;font-size:20px;font-weight:700;box-shadow:0 4px 12px rgba(16,185,129,.3);transition:transform .3s}.cta-button:hover{transform:scale(1.05)}</style></head><body><div class="hero"><div class="urgency">⏰ 이번 주 한정 특별 혜택!</div><h1>지금 무료로 체험하세요!</h1><div class="subtitle">{{subtitle}}</div></div><div class="container"><div class="benefits"><div class="benefit-card"><div class="benefit-icon">✅</div><div class="benefit-title">첫 수업 무료</div><div class="benefit-desc">{{benefit1}}</div></div><div class="benefit-card"><div class="benefit-icon">🎯</div><div class="benefit-title">맞춤 학습 진단</div><div class="benefit-desc">{{benefit2}}</div></div><div class="benefit-card"><div class="benefit-icon">🎁</div><div class="benefit-title">특별 혜택</div><div class="benefit-desc">{{benefit3}}</div></div></div><div class="cta-section"><div class="cta-title">지금 바로 신청하세요!</div><a href="#apply" class="cta-button">무료 체험 신청하기</a></div></div></body></html>',
        variables: '["subtitle","benefit1","benefit2","benefit3"]',
        isDefault: 0
      },
      {
        id: 'tpl_community_001',
        name: '👥 학부모 커뮤니티',
        description: '학부모 소통과 참여를 위한 커뮤니티 페이지',
        html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>학부모 커뮤니티</title><style>body{font-family:system-ui;margin:0;background:#f9fafb}.header{background:linear-gradient(135deg,#14b8a6 0%,#0891b2 100%);color:#fff;padding:60px 20px;text-align:center}h1{font-size:42px;margin-bottom:16px}.tagline{font-size:20px;opacity:.9}.container{max-width:1200px;margin:0 auto;padding:60px 20px}.intro{text-align:center;max-width:800px;margin:0 auto 60px}.intro-text{font-size:18px;line-height:1.8;color:#4b5563}.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:30px;margin:60px 0}.feature{background:#fff;padding:30px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.05);border-top:4px solid #14b8a6}.feature-icon{font-size:40px;margin-bottom:16px}.feature-title{font-size:20px;font-weight:700;margin-bottom:12px;color:#1f2937}.feature-desc{color:#6b7280;line-height:1.6}.join-section{background:#fff;padding:60px 40px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.1);text-align:center;margin-top:60px}.join-title{font-size:32px;color:#1f2937;margin-bottom:16px}.join-desc{font-size:18px;color:#6b7280;margin-bottom:30px}.join-button{display:inline-block;background:linear-gradient(135deg,#14b8a6 0%,#0891b2 100%);color:#fff;padding:16px 48px;border-radius:8px;text-decoration:none;font-size:18px;font-weight:700;transition:transform .3s}.join-button:hover{transform:scale(1.05)}</style></head><body><div class="header"><h1>{{communityName}}</h1><div class="tagline">{{tagline}}</div></div><div class="container"><div class="intro"><div class="intro-text">{{introText}}</div></div><div class="features"><div class="feature"><div class="feature-icon">💬</div><div class="feature-title">소통 공간</div><div class="feature-desc">{{feature1}}</div></div><div class="feature"><div class="feature-icon">📚</div><div class="feature-title">교육 정보</div><div class="feature-desc">{{feature2}}</div></div><div class="feature"><div class="feature-icon">🤝</div><div class="feature-title">학부모 네트워크</div><div class="feature-desc">{{feature3}}</div></div><div class="feature"><div class="feature-icon">📢</div><div class="feature-title">공지사항</div><div class="feature-desc">{{feature4}}</div></div></div><div class="join-section"><div class="join-title">지금 바로 참여하세요!</div><div class="join-desc">우리 아이의 미래를 함께 만들어갑니다</div><a href="#join" class="join-button">커뮤니티 가입하기</a></div></div></body></html>',
        variables: '["communityName","tagline","introText","feature1","feature2","feature3","feature4"]',
        isDefault: 0
      }
    ];

    let insertedCount = 0;
    const errors = [];

    for (const template of templates) {
      try {
        const result = await db
          .prepare(`
            INSERT OR REPLACE INTO LandingPageTemplate (
              id, name, description, html, variables, isDefault, usageCount, createdById, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, 0, NULL, datetime('now'), datetime('now'))
          `)
          .bind(
            template.id,
            template.name,
            template.description,
            template.html,
            template.variables,
            template.isDefault
          )
          .run();
        
        if (result.success) {
          insertedCount++;
          console.log(`✅ 템플릿 삽입 성공: ${template.id} - ${template.name}`);
        } else {
          console.error(`❌ 템플릿 삽입 실패: ${template.id}`, result);
          errors.push({ id: template.id, error: 'Insert failed', result });
        }
      } catch (error: any) {
        console.error(`❌ 템플릿 삽입 예외: ${template.id}`, error.message);
        errors.push({ id: template.id, error: error.message });
      }
    }

    // Verify insertion
    const finalCount = await db
      .prepare("SELECT COUNT(*) as count FROM LandingPageTemplate")
      .first();

    console.log(`✅ 최종 템플릿 개수: ${finalCount?.count || 0}`);

    return new Response(JSON.stringify({
      success: true,
      message: `✅ 테이블 재생성 완료! ${insertedCount}개 템플릿 삽입됨`,
      inserted: insertedCount,
      total: finalCount?.count || 0,
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Template table fix failed:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Template table fix failed",
      stack: error.stack
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
