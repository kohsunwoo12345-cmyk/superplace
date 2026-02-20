// Cloudflare Pages Function - Setup Templates (Run once)
// Access: /api/setup/templates

interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body = await context.request.json();
    const { password, forceRecreate } = body;
    
    if (password !== "setup-templates-2026") {
      return new Response(JSON.stringify({ 
        error: "Invalid password" 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = context.env.DB;
    
    // 🔥 forceRecreate가 true면 테이블 삭제 후 재생성
    if (forceRecreate === true) {
      console.log('🔥 forceRecreate 모드: 테이블 삭제 후 재생성');
      try {
        await db.prepare(`DROP TABLE IF EXISTS LandingPageTemplate`).run();
        console.log('✅ 기존 LandingPageTemplate 테이블 삭제 완료');
      } catch (dropError: any) {
        console.error('⚠️ 테이블 삭제 실패 (없을 수 있음):', dropError.message);
      }
    }
    
    // 🔥 테이블 생성 (createdById를 NULL 허용으로 변경, FOREIGN KEY 없음)
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
      console.log('✅ LandingPageTemplate 테이블 생성 완료 (createdById NULL 허용, FK 없음)');
    } catch (tableError: any) {
      console.error('❌ 테이블 생성 오류:', tableError);
      throw tableError;
    }
    
    // Check if templates already exist
    const existingCount = await db
      .prepare("SELECT COUNT(*) as count FROM LandingPageTemplate")
      .first();
    
    if (existingCount && existingCount.count > 0) {
      return new Response(JSON.stringify({
        success: true,
        message: `템플릿이 이미 ${existingCount.count}개 존재합니다.`,
        existing: existingCount.count
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Insert 5 templates
    const templates = [
      {
        id: 'tpl_student_report_001',
        name: '🌟 학생 성장 리포트',
        description: '학생의 학습 성과와 성장을 보여주는 프리미엄 템플릿',
        html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{studentName}} 학생 리포트</title><style>body{font-family:system-ui;max-width:800px;margin:0 auto;padding:20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}.container{background:#fff;padding:40px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.1)}h1{color:#667eea;font-size:32px;margin-bottom:8px}.subtitle{color:#6b7280;font-size:18px;margin-bottom:30px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:30px 0}.stat-card{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:20px;border-radius:8px;text-align:center}.stat-value{font-size:36px;font-weight:700}.stat-label{font-size:14px;opacity:.9;margin-top:8px}.section{margin:30px 0}.section-title{font-size:20px;font-weight:700;color:#111827;margin-bottom:16px;border-left:4px solid #667eea;padding-left:12px}.comment{background:#f9fafb;padding:20px;border-radius:8px;border-left:4px solid #667eea;line-height:1.6}footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280}</style></head><body><div class="container"><h1>🌟 {{studentName}} 학생 리포트</h1><div class="subtitle">{{period}} 학습 성과 리포트</div><div class="stats"><div class="stat-card"><div class="stat-value">{{attendanceRate}}%</div><div class="stat-label">출석률</div></div><div class="stat-card"><div class="stat-value">{{homeworkRate}}%</div><div class="stat-label">과제 완성률</div></div><div class="stat-card"><div class="stat-value">{{avgScore}}점</div><div class="stat-label">평균 점수</div></div></div><div class="section"><div class="section-title">💬 선생님 코멘트</div><div class="comment">{{teacherComment}}</div></div><footer><p>이 리포트는 {{academyName}}에서 제공합니다.</p><p style="font-size:12px;margin-top:8px">생성일: {{generatedDate}}</p></footer></div></body></html>',
        variables: '["studentName","period","attendanceRate","homeworkRate","avgScore","teacherComment","academyName","generatedDate"]',
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
        html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>무료 체험 신청</title><style>body{font-family:system-ui;margin:0;background:#f3f4f6}.hero{background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;padding:80px 20px;text-align:center}.urgency{background:#fbbf24;color:#92400e;display:inline-block;padding:8px 20px;border-radius:20px;font-weight:700;margin-bottom:20px}h1{font-size:48px;margin-bottom:16px;text-shadow:2px 2px 4px rgba(0,0,0,.2)}.subtitle{font-size:24px;opacity:.9}.container{max-width:1000px;margin:-60px auto 0;position:relative;z-index:1;padding:0 20px}.benefits{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-bottom:40px}.benefit-card{background:#fff;padding:30px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.1)}.benefit-icon{font-size:48px;margin-bottom:16px}.benefit-title{font-size:18px;font-weight:700;margin-bottom:8px;color:#1f2937}.benefit-desc{color:#6b7280}.cta-section{background:#fff;padding:40px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.1);text-align:center}.cta-title{font-size:32px;color:#1f2937;margin-bottom:20px}.cta-button{display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;padding:20px 60px;border-radius:8px;text-decoration:none;font-size:20px;font-weight:700;box-shadow:0 4px 12px rgba(16,185,129,.3);transition:transform .3s}.cta-button:hover{transform:scale(1.05)}</style></head><body><div class="hero"><div class="urgency">⏰ 이번 주 한정 특별 혜택!</div><h1>지금 무료로 체험하세요!</h1><div class="subtitle">{{subtitle}}</div></div><div class="container"><div class="benefits"><div class="benefit-card"><div class="benefit-icon">✅</div><div class="benefit-title">첫 수업 무료</div><div class="benefit-desc">{{benefit1}}</div></div><div class="benefit-card"><div class="benefit-icon">🎯</div><div class="benefit-title">맞춤 학습 진단</div><div class="benefit-desc">{{benefit2}}</div></div><div class="benefit-card"><div class="benefit-icon">💰</div><div class="benefit-title">특별 할인</div><div class="benefit-desc">{{benefit3}}</div></div></div><div class="cta-section"><div class="cta-title">단 3분이면 신청 완료!</div><a href="#form" class="cta-button">무료 체험 신청하기</a></div></div></body></html>',
        variables: '["subtitle","benefit1","benefit2","benefit3"]',
        isDefault: 0
      },
      {
        id: 'tpl_community_001',
        name: '👥 학부모 커뮤니티',
        description: '학부모 소통과 참여를 위한 커뮤니티 페이지',
        html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>학부모 커뮤니티</title><style>body{font-family:system-ui;margin:0;background:#f9fafb}.header{background:linear-gradient(135deg,#14b8a6 0%,#0891b2 100%);color:#fff;padding:60px 20px;text-align:center}h1{font-size:42px;margin-bottom:16px}.tagline{font-size:20px;opacity:.9}.container{max-width:1200px;margin:0 auto;padding:60px 20px}.intro{text-align:center;max-width:800px;margin:0 auto 60px}.intro-text{font-size:18px;line-height:1.8;color:#4b5563}.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:30px;margin:60px 0}.feature{background:#fff;padding:30px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.05);border-top:4px solid #14b8a6}.feature-icon{font-size:40px;margin-bottom:16px}.feature-title{font-size:20px;font-weight:700;margin-bottom:12px;color:#1f2937}.feature-desc{color:#6b7280;line-height:1.6}.join-section{background:#fff;padding:60px 40px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.1);text-align:center;margin-top:60px}.join-title{font-size:32px;color:#1f2937;margin-bottom:16px}.join-desc{font-size:18px;color:#6b7280;margin-bottom:30px}.join-button{display:inline-block;background:linear-gradient(135deg,#14b8a6 0%,#0891b2 100%);color:#fff;padding:16px 48px;border-radius:8px;text-decoration:none;font-size:18px;font-weight:700;transition:transform .3s}.join-button:hover{transform:scale(1.05)}</style></head><body><div class="header"><h1>{{communityName}}</h1><div class="tagline">{{tagline}}</div></div><div class="container"><div class="intro"><div class="intro-text">{{introText}}</div></div><div class="features"><div class="feature"><div class="feature-icon">💬</div><div class="feature-title">소통 공간</div><div class="feature-desc">{{feature1}}</div></div><div class="feature"><div class="feature-icon">📚</div><div class="feature-title">교육 정보</div><div class="feature-desc">{{feature2}}</div></div><div class="feature"><div class="feature-icon">📅</div><div class="feature-title">일정 공유</div><div class="feature-desc">{{feature3}}</div></div><div class="feature"><div class="feature-icon">🎯</div><div class="feature-title">상담 예약</div><div class="feature-desc">{{feature4}}</div></div></div><div class="join-section"><div class="join-title">함께 성장하는 커뮤니티</div><div class="join-desc">지금 가입하고 다양한 혜택을 누리세요</div><a href="#join" class="join-button">커뮤니티 가입하기</a></div></div></body></html>',
        variables: '["communityName","tagline","introText","feature1","feature2","feature3","feature4"]',
        isDefault: 0
      }
    ];

    let insertedCount = 0;
    const errors = [];

    for (const template of templates) {
      try {
        await db
          .prepare(`
            INSERT OR IGNORE INTO LandingPageTemplate (
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
        
        insertedCount++;
        console.log(`✅ 템플릿 삽입 성공: ${template.id}`);
      } catch (error: any) {
        console.error(`❌ 템플릿 삽입 실패: ${template.id}`, error.message);
        errors.push({ id: template.id, error: error.message });
      }
    }

    // Verify insertion
    const finalCount = await db
      .prepare("SELECT COUNT(*) as count FROM LandingPageTemplate")
      .first();

    return new Response(JSON.stringify({
      success: true,
      message: `템플릿 ${insertedCount}개 삽입 완료`,
      inserted: insertedCount,
      total: finalCount?.count || 0,
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Template setup failed:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Template setup failed",
      stack: error.stack
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
