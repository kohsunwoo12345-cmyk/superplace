// 학생 성장 리포트 HTML 템플릿
export const STUDENT_GROWTH_REPORT_TEMPLATE = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{studentName}} 학생의 학습 리포트</title>
  <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
      background-color: #f8fafc;
      min-height: 100vh;
      padding: 1rem;
    }
    
    @keyframes gradientMove {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    @keyframes ping {
      75%, 100% {
        transform: scale(2);
        opacity: 0;
      }
    }
    
    .progress-bar-fill {
      transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1);
      background-size: 200% 200%;
      animation: gradientMove 3s ease infinite;
    }
    
    .stat-card {
      transition: all 0.3s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.08);
    }
    
    .ping-animation {
      animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
  </style>
</head>
<body>
  <div style="max-width: 850px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden; border: 1px solid #e2e8f0;">
    
    <!-- Header -->
    <div style="position: relative; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 3rem 2.5rem; overflow: hidden;">
      <div style="position: absolute; top: -6rem; right: -6rem; width: 16rem; height: 16rem; background: #6366f1; border-radius: 50%; filter: blur(80px); opacity: 0.2;"></div>
      <div style="position: absolute; bottom: -6rem; left: -6rem; width: 16rem; height: 16rem; background: #a855f7; border-radius: 50%; filter: blur(80px); opacity: 0.2;"></div>
      
      <div style="position: relative; z-index: 10;">
        <div style="margin-bottom: 1rem;">
          <span style="padding: 0.5rem 1rem; background: rgba(255, 255, 255, 0.1); color: #c7d2fe; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; border-radius: 9999px; border: 1px solid rgba(255, 255, 255, 0.1); display: inline-block;">
            ✨ AI-POWERED ANALYSIS
          </span>
        </div>
        <h1 style="font-size: 2.25rem; font-weight: 800; color: #ffffff; margin-bottom: 0.5rem;">
          <span style="background: linear-gradient(135deg, #d4af37 0%, #f3e5ab 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">{{studentName}}</span> 학생
        </h1>
        <div style="font-size: 1.5rem; font-weight: 300; color: #cbd5e1; margin-top: 0.5rem;">
          종합 학습 성과 리포트
        </div>
        <div style="margin-top: 1.5rem; text-align: right;">
          <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 0.5rem;">분석 기간</p>
          <p style="color: #ffffff; font-weight: 600; background: rgba(30, 41, 59, 0.5); padding: 0.5rem 1rem; border-radius: 0.5rem; border: 1px solid #475569; display: inline-block;">
            {{period}}
          </p>
        </div>
      </div>
    </div>

    <div style="padding: 3rem 2.5rem;">
      
      <!-- Intro -->
      <div style="margin-bottom: 3rem; position: relative;">
        <div style="position: absolute; left: 0; top: 0; width: 4px; height: 100%; background: linear-gradient(to bottom, #6366f1, #a855f7); border-radius: 9999px;"></div>
        <div style="padding-left: 1.5rem;">
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 0.75rem;">
            학부모님, 안녕하십니까.
          </h3>
          <p style="color: #475569; line-height: 1.75; font-weight: 500;">
            본 리포트는 20년의 교육 노하우와 최첨단 AI 시스템의 정밀한 데이터를 바탕으로 작성되었습니다. 
            해당 기간 동안 <strong style="color: #6366f1;">{{studentName}}</strong> 학생이 학원에서 
            보여준 눈부신 성장과 학습 궤적을 투명하고 섬세하게 공유해 드립니다.
          </p>
        </div>
      </div>

      <!-- Attendance -->
      <div style="margin-bottom: 3.5rem;">
        <div style="display: flex; align-items: center; margin-bottom: 1.5rem;">
          <div style="width: 2rem; height: 2rem; border-radius: 50%; background: #eff6ff; color: #3b82f6; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; font-size: 0.875rem;">
            📅
          </div>
          <h3 style="font-size: 1.125rem; font-weight: 700; color: #1e293b;">
            출결 및 성실도 지표
          </h3>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div class="stat-card" style="background: #f8fafc; border-radius: 0.75rem; padding: 1.25rem; text-align: center;">
            <p style="font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 0.25rem;">총 수업 일수</p>
            <p style="font-size: 1.5rem; font-weight: 700; color: #1e293b;">{{totalDays}}<span style="font-size: 0.875rem; color: #64748b; margin-left: 0.25rem;">일</span></p>
          </div>
          <div class="stat-card" style="background: #ecfdf5; border-radius: 0.75rem; padding: 1.25rem; text-align: center; border: 1px solid #a7f3d0;">
            <p style="font-size: 0.75rem; font-weight: 600; color: #059669; margin-bottom: 0.25rem;">출석</p>
            <p style="font-size: 1.5rem; font-weight: 700; color: #059669;">{{presentDays}}<span style="font-size: 0.875rem; color: #10b981; margin-left: 0.25rem;">일</span></p>
          </div>
          <div class="stat-card" style="background: #fffbeb; border-radius: 0.75rem; padding: 1.25rem; text-align: center; border: 1px solid #fde68a;">
            <p style="font-size: 0.75rem; font-weight: 600; color: #d97706; margin-bottom: 0.25rem;">지각</p>
            <p style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">{{tardyDays}}<span style="font-size: 0.875rem; color: #f59e0b; margin-left: 0.25rem;">일</span></p>
          </div>
          <div class="stat-card" style="background: #fef2f2; border-radius: 0.75rem; padding: 1.25rem; text-align: center; border: 1px solid #fecaca;">
            <p style="font-size: 0.75rem; font-weight: 600; color: #dc2626; margin-bottom: 0.25rem;">결석</p>
            <p style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">{{absentDays}}<span style="font-size: 0.875rem; color: #ef4444; margin-left: 0.25rem;">일</span></p>
          </div>
        </div>

        <div style="background: #ffffff; border-radius: 0.75rem; padding: 1.25rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.5rem;">
            <span style="font-size: 0.875rem; font-weight: 700; color: #475569;">종합 출석률</span>
            <span style="font-size: 1.25rem; font-weight: 800; color: #3b82f6;">{{attendanceRate}}</span>
          </div>
          <div style="width: 100%; background: #f1f5f9; border-radius: 9999px; height: 10px; overflow: hidden;">
            <div class="progress-bar-fill" style="background: linear-gradient(to right, #60a5fa, #6366f1); height: 100%; border-radius: 9999px; width: {{attendanceRate}}; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);"></div>
          </div>
        </div>
      </div>

      <!-- Homework -->
      <div style="margin-bottom: 3.5rem;">
        <div style="display: flex; align-items: center; margin-bottom: 1.5rem;">
          <div style="width: 2rem; height: 2rem; border-radius: 50%; background: #eef2ff; color: #6366f1; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; font-size: 0.875rem;">
            ✍️
          </div>
          <h3 style="font-size: 1.125rem; font-weight: 700; color: #1e293b;">
            자기주도학습 및 과제 달성도
          </h3>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.25rem;">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); border-radius: 0.75rem; padding: 1.5rem;">
            <p style="font-size: 0.875rem; font-weight: 700; color: #64748b; margin-bottom: 0.75rem;">과제 완수율</p>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
              <span style="font-size: 2.5rem; font-weight: 800; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">{{homeworkRate}}</span>
              <div style="width: 3rem; height: 3rem; border-radius: 50%; background: #eef2ff; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">✅</div>
            </div>
            <div style="width: 100%; background: #f1f5f9; border-radius: 9999px; height: 8px; overflow: hidden;">
              <div class="progress-bar-fill" style="background: linear-gradient(to right, #818cf8, #a78bfa); height: 100%; border-radius: 9999px; width: {{homeworkRate}};"></div>
            </div>
          </div>
          
          <div style="background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); border-radius: 0.75rem; padding: 1.5rem; position: relative; overflow: hidden;">
            <div style="position: absolute; right: -1.5rem; top: -1.5rem; font-size: 9rem; opacity: 0.05;">📚</div>
            <div style="position: relative; z-index: 10;">
              <p style="font-size: 0.875rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem;">누적 과제 완료</p>
              <p style="font-size: 3rem; font-weight: 800; color: #1e293b; margin-top: 0.5rem;">{{homeworkCompleted}}<span style="font-size: 1.125rem; color: #94a3b8; margin-left: 0.25rem;">건</span></p>
              <p style="font-size: 0.75rem; color: #6366f1; margin-top: 0.75rem; font-weight: 500; background: #eef2ff; display: inline-block; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">📈 꾸준한 성실함의 결과입니다.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Learning -->
      <div style="margin-bottom: 3.5rem;">
        <div style="display: flex; align-items: center; margin-bottom: 1.5rem;">
          <div style="width: 2rem; height: 2rem; border-radius: 50%; background: #faf5ff; color: #a855f7; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; font-size: 0.875rem;">
            🧠
          </div>
          <h3 style="font-size: 1.125rem; font-weight: 700; color: #1e293b;">
            AI 스마트 튜터링 상호작용
          </h3>
        </div>
        
        <div style="background: linear-gradient(135deg, #eef2ff 0%, #ffffff 50%, #faf5ff 100%); border: 1px solid #e9d5ff; border-radius: 1rem; padding: 2rem; position: relative; overflow: hidden;">
          <div style="position: absolute; right: 0; top: 0; width: 16rem; height: 16rem; background: #e9d5ff; border-radius: 50%; filter: blur(80px); transform: translate(50%, -50%); opacity: 0.3;"></div>
          
          <div style="position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 2rem;">
            <div style="position: relative; flex-shrink: 0;">
              <div style="width: 8rem; height: 8rem; border-radius: 50%; background: #ffffff; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; align-items: center; justify-content: center; border: 4px solid #faf5ff;">
                <span style="font-size: 0.875rem; font-weight: 700; color: #c084fc;">TOTAL</span>
                <span style="font-size: 2.5rem; font-weight: 900; color: #a855f7;">{{aiChatCount}}</span>
                <span style="font-size: 0.75rem; font-weight: 600; color: #94a3b8; margin-top: 0.25rem;">INTERACTIONS</span>
              </div>
              <div class="ping-animation" style="position: absolute; inset: 0; background: #a855f7; border-radius: 50%; opacity: 0.2;"></div>
            </div>
            
            <div style="flex: 1; text-align: center;">
              <h4 style="font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 0.75rem;">자기주도적 AI 학습 체화</h4>
              <p style="color: #475569; font-size: 0.875rem; line-height: 1.75;">
                {{studentName}} 학생은 전용 AI 튜터 시스템을 통해 총 <strong style="color: #a855f7; font-size: 1rem;">{{aiChatCount}}회</strong>의 
                심층적인 질의응답과 내신 대비 훈련을 진행했습니다. 이는 단순히 정답을 암기하는 것을 넘어, 
                <strong> 스스로 취약점을 발견하고 AI와 상호작용하며 문제를 해결하는 메타인지 능력</strong>이 
                극대화되었음을 증명하는 핵심 데이터입니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Evaluation -->
      <div>
        <div style="display: flex; align-items: center; margin-bottom: 1.5rem;">
          <div style="width: 2rem; height: 2rem; border-radius: 50%; background: #ecfdf5; color: #10b981; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; font-size: 0.875rem;">
            💬
          </div>
          <h3 style="font-size: 1.125rem; font-weight: 700; color: #1e293b;">
            원장 종합 분석 및 향후 방향
          </h3>
        </div>
        
        <div style="background: #f8fafc; border-radius: 1rem; padding: 2rem; border: 1px solid #e2e8f0; color: #334155; line-height: 1.75; font-size: 0.875rem; font-weight: 500;">
          <p style="margin-bottom: 1rem;">
            {{studentName}} 학생은 이번 학습 기간 동안 완벽에 가까운 과제 수행률(<span style="font-weight: 700; color: #6366f1;">{{homeworkRate}}</span>)과 
            주도적인 AI 스마트 학습(<span style="font-weight: 700; color: #a855f7;">{{aiChatCount}}회</span>)을 
            통해 괄목할 만한 학업적 성장을 증명해 보였습니다.
          </p>
          <p style="margin-bottom: 1rem;">
            이러한 정량적 수치는 학생이 가진 <strong>'배움에 대한 끈기'</strong>와 
            <strong>'새로운 학습 시스템(AI)을 흡수하는 유연성'</strong>을 동시에 보여주는 
            매우 긍정적인 신호입니다. 다가오는 커리큘럼에서는 현재 확보된 탄탄한 기본기를 바탕으로, 
            고난도 서술형 영작 및 수능형 독해 추론 능력을 극대화하는 데 집중하여 
            완벽한 최상위권으로 도약할 수 있도록 철저히 지도하겠습니다.
          </p>
          <p style="color: #64748b; margin-top: 1.5rem; text-align: center; font-style: italic;">
            "가정에서도 {{studentName}} 학생의 훌륭한 태도와 눈부신 성장에 
            아낌없는 칭찬과 지지를 부탁드립니다."
          </p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 4rem; text-align: center;">
          <div style="display: inline-block;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1.5rem;">
              <div style="height: 1px; width: 4rem; background: linear-gradient(to right, transparent, #cbd5e1);"></div>
              <span style="color: #cbd5e1; font-size: 0.75rem;">💎</span>
              <div style="height: 1px; width: 4rem; background: linear-gradient(to left, transparent, #cbd5e1);"></div>
            </div>
            
            <h2 style="font-size: 1.5rem; font-weight: 800; color: #1e293b; letter-spacing: 0.1em; margin-bottom: 0.25rem;">
              {{academyName}}
            </h2>
            <p style="color: #64748b; font-weight: 600; font-size: 0.875rem;">
              <span style="color: #6366f1;">인문학 박사</span> / 원장 {{directorName}} 배상
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
