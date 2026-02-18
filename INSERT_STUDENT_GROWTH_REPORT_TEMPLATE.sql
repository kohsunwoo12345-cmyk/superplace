-- ============================================
-- 학생 성장 리포트 템플릿 삽입 SQL
-- ============================================
-- 실행 위치: Cloudflare Dashboard > D1 > 데이터베이스 > Console
-- ============================================

-- 먼저 테이블이 존재하는지 확인
SELECT name FROM sqlite_master WHERE type='table' AND name='LandingPageTemplate';

-- 기존 템플릿 삭제 (있다면)
DELETE FROM LandingPageTemplate WHERE name = '학생 성장 리포트 v1.0';

-- 템플릿 삽입
INSERT INTO LandingPageTemplate (
  id,
  name,
  description,
  html,
  variables,
  isDefault,
  usageCount,
  createdById,
  createdAt,
  updatedAt
) VALUES (
  'template_growth_report_v1',
  '학생 성장 리포트 v1.0',
  '상세한 성장 일기 형식의 학생 학습 리포트. 출석, AI 학습, 숙제 현황을 아름다운 디자인으로 표현합니다.',
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{studentName}} 학생의 성장 리포트</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ''Noto Sans KR'', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    /* 헤더 */
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 60px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: ''✨'';
      position: absolute;
      font-size: 150px;
      opacity: 0.1;
      top: -30px;
      right: -20px;
      transform: rotate(-15deg);
    }

    .header h1 {
      font-size: 42px;
      font-weight: 900;
      margin-bottom: 15px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }

    .header .subtitle {
      font-size: 20px;
      font-weight: 300;
      opacity: 0.95;
    }

    .header .period {
      margin-top: 20px;
      font-size: 16px;
      background: rgba(255,255,255,0.2);
      display: inline-block;
      padding: 10px 25px;
      border-radius: 30px;
      backdrop-filter: blur(10px);
    }

    /* 메인 콘텐츠 */
    .content {
      padding: 50px 40px;
    }

    /* 인트로 메시지 */
    .intro {
      background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%);
      padding: 30px;
      border-radius: 15px;
      margin-bottom: 40px;
      border-left: 5px solid #667eea;
      line-height: 1.8;
      font-size: 16px;
      color: #333;
    }

    .intro strong {
      color: #667eea;
      font-weight: 700;
    }

    /* 섹션 */
    .section {
      margin-bottom: 50px;
    }

    .section-title {
      font-size: 28px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 25px;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .section-title .emoji {
      font-size: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 15px;
      box-shadow: 0 5px 15px rgba(102,126,234,0.3);
    }

    /* 통계 카드 그리드 */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%);
      padding: 25px;
      border-radius: 15px;
      text-align: center;
      transition: transform 0.3s, box-shadow 0.3s;
      border: 2px solid transparent;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      border-color: #667eea;
    }

    .stat-card .label {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
      font-weight: 500;
    }

    .stat-card .value {
      font-size: 32px;
      font-weight: 900;
      color: #667eea;
      margin-bottom: 5px;
    }

    .stat-card .sub-value {
      font-size: 12px;
      color: #999;
    }

    /* 성장 스토리 */
    .growth-story {
      background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
      padding: 30px;
      border-radius: 15px;
      line-height: 1.9;
      font-size: 16px;
      color: #333;
      margin-bottom: 30px;
      border-left: 5px solid #ff6b6b;
    }

    .growth-story p {
      margin-bottom: 15px;
    }

    .growth-story strong {
      color: #ff6b6b;
      font-weight: 700;
    }

    /* 상세 데이터 테이블 */
    .data-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 10px;
      margin-top: 20px;
    }

    .data-table tr {
      background: #f6f8fb;
      transition: all 0.3s;
    }

    .data-table tr:hover {
      background: #e9ecef;
      transform: scale(1.02);
    }

    .data-table td {
      padding: 20px;
      font-size: 16px;
    }

    .data-table td:first-child {
      color: #666;
      font-weight: 500;
      border-radius: 10px 0 0 10px;
      width: 40%;
    }

    .data-table td:last-child {
      font-weight: 700;
      color: #667eea;
      text-align: right;
      border-radius: 0 10px 10px 0;
    }

    /* 하이라이트 박스 */
    .highlight-box {
      background: linear-gradient(135deg, #fff9e6 0%, #ffe6b3 100%);
      padding: 25px;
      border-radius: 15px;
      margin: 30px 0;
      border-left: 5px solid #ffd93d;
    }

    .highlight-box h3 {
      color: #d4a017;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .highlight-box p {
      color: #333;
      line-height: 1.8;
      font-size: 15px;
    }

    /* 마무리 메시지 */
    .footer-message {
      background: linear-gradient(135deg, #e6f7ff 0%, #b3e0ff 100%);
      padding: 40px;
      border-radius: 15px;
      text-align: center;
      margin-top: 50px;
      border: 3px solid #667eea;
    }

    .footer-message h3 {
      color: #667eea;
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .footer-message p {
      color: #333;
      line-height: 1.9;
      font-size: 16px;
      margin-bottom: 15px;
    }

    .footer-message .signature {
      margin-top: 30px;
      font-size: 18px;
      font-weight: 700;
      color: #667eea;
    }

    /* 프로그레스 바 */
    .progress-bar {
      background: #e9ecef;
      height: 30px;
      border-radius: 15px;
      overflow: hidden;
      margin: 20px 0;
      position: relative;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 14px;
      transition: width 1s ease;
    }

    /* 뱃지 */
    .badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 700;
      margin: 5px;
    }

    .badge-excellent {
      background: linear-gradient(135deg, #51cf66 0%, #37b24d 100%);
      color: white;
    }

    .badge-good {
      background: linear-gradient(135deg, #4dabf7 0%, #228be6 100%);
      color: white;
    }

    .badge-improve {
      background: linear-gradient(135deg, #ffd93d 0%, #ff922b 100%);
      color: white;
    }

    /* 반응형 */
    @media (max-width: 768px) {
      .header {
        padding: 40px 20px;
      }

      .header h1 {
        font-size: 28px;
      }

      .content {
        padding: 30px 20px;
      }

      .section-title {
        font-size: 22px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .data-table td {
        padding: 15px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 헤더 -->
    <div class="header">
      <h1>🌟 {{studentName}} 학생의 성장 리포트</h1>
      <div class="subtitle">학습과 성장의 아름다운 여정</div>
      <div class="period">📅 {{period}}</div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="content">
      <!-- 인트로 메시지 -->
      <div class="intro">
        <p>안녕하세요, <strong>{{studentName}}</strong> 학생 학부모님! 👋</p>
        <p>이번 기간 동안 {{studentName}} 학생이 보여준 놀라운 성장과 노력의 흔적을 담았습니다. 매 순간 최선을 다하는 모습이 정말 자랑스럽습니다. 함께 확인해보시겠습니까?</p>
      </div>

      <!-- 출석 현황 섹션 -->
      <div class="section">
        <h2 class="section-title">
          <span class="emoji">📊</span>
          출석 현황
        </h2>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="label">전체 수업일</div>
            <div class="value">{{totalDays}}</div>
            <div class="sub-value">총 수업 일수</div>
          </div>
          <div class="stat-card">
            <div class="label">출석</div>
            <div class="value">{{presentDays}}</div>
            <div class="sub-value">참석한 날</div>
          </div>
          <div class="stat-card">
            <div class="label">출석률</div>
            <div class="value">{{attendanceRate}}</div>
            <div class="sub-value">
              <span class="badge badge-excellent">우수</span>
            </div>
          </div>
        </div>

        <div class="progress-bar">
          <div class="progress-fill" style="width: {{attendanceRate}}">
            {{attendanceRate}} 달성!
          </div>
        </div>

        <div class="growth-story">
          <p>📖 <strong>선생님의 한마디</strong></p>
          <p>{{studentName}} 학생은 이번 기간 동안 <strong>{{presentDays}}</strong> 수업에 참석하여 <strong>{{attendanceRate}}</strong>의 출석률을 기록했습니다. 수업에 빠지지 않고 성실하게 참여하는 모습이 정말 인상적이었습니다.</p>
          <p>특히 결석일이 거의 없었고, 지각도 최소화하려는 노력이 돋보였습니다. {{absentDays}}의 결석과 {{tardyDays}}의 지각만 있었는데, 이는 학생의 높은 책임감을 보여주는 지표입니다. 계속해서 이런 성실함을 유지해주길 바랍니다! 💪</p>
        </div>

        <table class="data-table">
          <tr>
            <td>📌 전체 수업일</td>
            <td>{{totalDays}}</td>
          </tr>
          <tr>
            <td>✅ 출석 일수</td>
            <td>{{presentDays}}</td>
          </tr>
          <tr>
            <td>❌ 결석 일수</td>
            <td>{{absentDays}}</td>
          </tr>
          <tr>
            <td>⏰ 지각 일수</td>
            <td>{{tardyDays}}</td>
          </tr>
          <tr>
            <td>📈 출석률</td>
            <td>{{attendanceRate}}</td>
          </tr>
        </table>
      </div>

      <!-- AI 학습 활동 섹션 -->
      <div class="section">
        <h2 class="section-title">
          <span class="emoji">🤖</span>
          AI 학습 활동
        </h2>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="label">AI 대화 횟수</div>
            <div class="value">{{aiChatCount}}회</div>
            <div class="sub-value">
              <span class="badge badge-good">활발</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="label">평균 대화 길이</div>
            <div class="value">{{avgChatLength}}</div>
            <div class="sub-value">메시지당 평균</div>
          </div>
          <div class="stat-card">
            <div class="label">주요 질문 주제</div>
            <div class="value">{{mainTopic}}</div>
            <div class="sub-value">가장 많이 다룬 분야</div>
          </div>
        </div>

        <div class="highlight-box">
          <h3>⭐ AI 학습 하이라이트</h3>
          <p>{{studentName}} 학생은 AI 챗봇과 <strong>{{aiChatCount}}회</strong>의 대화를 나누며 능동적으로 학습에 참여했습니다. 특히 <strong>{{mainTopic}}</strong> 분야에 대한 질문이 많았으며, 궁금한 점을 스스로 해결하려는 자기주도적 학습 태도가 돋보였습니다.</p>
          <p>AI 챗봇과의 대화를 통해 수업 내용을 복습하고, 이해가 부족한 부분을 보완하는 모습이 인상적이었습니다. 계속해서 이런 학습 습관을 유지한다면 큰 성장이 기대됩니다! 🚀</p>
        </div>

        <table class="data-table">
          <tr>
            <td>💬 총 대화 횟수</td>
            <td>{{aiChatCount}}회</td>
          </tr>
          <tr>
            <td>📝 평균 대화 길이</td>
            <td>{{avgChatLength}}</td>
          </tr>
          <tr>
            <td>🎯 주요 질문 주제</td>
            <td>{{mainTopic}}</td>
          </tr>
          <tr>
            <td>⏱️ 평균 응답 시간</td>
            <td>{{avgResponseTime}}</td>
          </tr>
        </table>
      </div>

      <!-- 숙제 제출 현황 섹션 -->
      <div class="section">
        <h2 class="section-title">
          <span class="emoji">📝</span>
          숙제 제출 현황
        </h2>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="label">완료한 숙제</div>
            <div class="value">{{homeworkCompleted}}개</div>
            <div class="sub-value">총 제출 건수</div>
          </div>
          <div class="stat-card">
            <div class="label">완료율</div>
            <div class="value">{{homeworkRate}}</div>
            <div class="sub-value">
              <span class="badge badge-excellent">완벽!</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="label">평균 점수</div>
            <div class="value">{{avgHomeworkScore}}</div>
            <div class="sub-value">100점 만점 기준</div>
          </div>
        </div>

        <div class="progress-bar">
          <div class="progress-fill" style="width: {{homeworkRate}}">
            숙제 완료율 {{homeworkRate}}
          </div>
        </div>

        <div class="growth-story">
          <p>📖 <strong>선생님의 한마디</strong></p>
          <p>{{studentName}} 학생은 이번 기간 동안 <strong>{{homeworkCompleted}}개</strong>의 숙제를 완료하여 <strong>{{homeworkRate}}</strong>의 완료율을 달성했습니다. 숙제를 성실히 수행하는 모습이 정말 자랑스럽습니다!</p>
          <p>특히 제출 기한을 잘 지키고, 숙제의 질도 매우 높았습니다. 평균 <strong>{{avgHomeworkScore}}점</strong>을 기록하며 우수한 학습 성과를 보여주었습니다. 이런 꾸준함이 실력 향상의 밑거름이 됩니다. 계속 파이팅! 🔥</p>
        </div>

        <table class="data-table">
          <tr>
            <td>✅ 완료한 숙제</td>
            <td>{{homeworkCompleted}}개</td>
          </tr>
          <tr>
            <td>📊 완료율</td>
            <td>{{homeworkRate}}</td>
          </tr>
          <tr>
            <td>⭐ 평균 점수</td>
            <td>{{avgHomeworkScore}}점</td>
          </tr>
          <tr>
            <td>🏆 최고 점수</td>
            <td>{{maxHomeworkScore}}점</td>
          </tr>
          <tr>
            <td>⏰ 평균 제출 시간</td>
            <td>{{avgSubmitTime}}</td>
          </tr>
        </table>
      </div>

      <!-- 학습 성장 섹션 -->
      <div class="section">
        <h2 class="section-title">
          <span class="emoji">🌱</span>
          학습 성장 일기
        </h2>

        <div class="growth-story">
          <p>📖 <strong>{{studentName}} 학생의 성장 이야기</strong></p>
          <p>{{studentName}} 학생은 이번 기간 동안 정말 눈부신 성장을 보여주었습니다. 처음에는 수업 내용을 이해하는 데 시간이 걸렸지만, 끊임없는 노력과 질문을 통해 점차 자신감을 얻어갔습니다.</p>
          
          <p><strong>✨ 가장 인상 깊었던 순간:</strong></p>
          <p>{{impressiveMoment}}</p>
          
          <p><strong>💪 개선이 필요한 부분:</strong></p>
          <p>{{improvementArea}}</p>
          
          <p><strong>🎯 다음 목표:</strong></p>
          <p>{{nextGoal}}</p>
        </div>

        <div class="highlight-box">
          <h3>🏆 이번 기간 주요 성취</h3>
          <p><strong>1. 출석률 {{attendanceRate}}</strong> - 성실한 수업 참여</p>
          <p><strong>2. AI 대화 {{aiChatCount}}회</strong> - 능동적 학습 태도</p>
          <p><strong>3. 숙제 완료율 {{homeworkRate}}</strong> - 책임감 있는 과제 수행</p>
          <p><strong>4. 평균 숙제 점수 {{avgHomeworkScore}}점</strong> - 우수한 학습 성과</p>
        </div>
      </div>

      <!-- 선생님의 종합 평가 -->
      <div class="section">
        <h2 class="section-title">
          <span class="emoji">💌</span>
          선생님의 종합 평가
        </h2>

        <div class="intro">
          <p><strong>{{teacherName}} 선생님의 평가</strong></p>
          <p>{{teacherComment}}</p>
          <p>{{studentName}} 학생은 항상 긍정적인 태도로 수업에 임하며, 어려운 문제도 끝까지 포기하지 않고 해결하려는 모습이 매우 인상적입니다. 이런 학습 태도를 유지한다면 앞으로 더욱 큰 성장이 기대됩니다.</p>
          <p>학부모님의 관심과 격려가 {{studentName}} 학생에게 큰 힘이 되고 있습니다. 앞으로도 함께 응원하며 성장을 지켜봐주시길 부탁드립니다. 감사합니다! 🙏</p>
        </div>
      </div>

      <!-- 마무리 메시지 -->
      <div class="footer-message">
        <h3>🎉 축하합니다!</h3>
        <p>{{studentName}} 학생은 이번 기간 동안 정말 열심히 노력했습니다.</p>
        <p>출석률 <strong>{{attendanceRate}}</strong>, 숙제 완료율 <strong>{{homeworkRate}}</strong>를 달성하며</p>
        <p>자기주도적 학습 능력을 키워가고 있습니다.</p>
        <p>앞으로도 계속해서 이런 성실함과 열정을 유지해주길 바랍니다!</p>
        <div class="signature">
          {{academyName}} 드림<br>
          발급일: {{issueDate}}
        </div>
      </div>
    </div>
  </div>
</body>
</html>
,
  '["studentName","period","academyName","issueDate","totalDays","presentDays","absentDays","tardyDays","attendanceRate","aiChatCount","avgChatLength","mainTopic","avgResponseTime","homeworkCompleted","homeworkRate","avgHomeworkScore","maxHomeworkScore","avgSubmitTime","impressiveMoment","improvementArea","nextGoal","teacherName","teacherComment"]',
  1,
  0,
  '1',
  datetime('now'),
  datetime('now')
);

-- 삽입 확인
SELECT id, name, description, isDefault, usageCount, createdAt 
FROM LandingPageTemplate 
WHERE name = '학생 성장 리포트 v1.0';

-- ============================================
-- ✅ 실행 완료 후 확인사항
-- ============================================
-- 1. 템플릿이 정상 삽입되었는지 확인
-- 2. 관리 페이지에서 템플릿 목록 확인
-- 3. 랜딩페이지 생성 테스트
-- ============================================
