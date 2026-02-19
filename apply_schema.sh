#!/bin/bash

echo "🚀 Applying schema to D1 database..."

# Apply schema
npx wrangler d1 execute superplace-study-db --file=cloudflare-worker/schema.sql

echo "✅ Schema applied successfully!"
echo ""
echo "📝 Inserting default templates..."

# Insert default template
npx wrangler d1 execute superplace-study-db --command="
INSERT OR IGNORE INTO LandingPageTemplate (
  id, name, description, html, variables, isDefault, createdById, createdAt, updatedAt
) VALUES (
  'tpl_default_001',
  '학생 성장 리포트',
  '학생의 학습 성과와 성장을 보여주는 기본 템플릿',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset=\"UTF-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
  <title>{{studentName}} 학생 리포트</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    h1 { color: #667eea; font-size: 32px; margin-bottom: 8px; }
    .subtitle { color: #6b7280; font-size: 18px; margin-bottom: 30px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
    .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 36px; font-weight: bold; }
    .stat-label { font-size: 14px; opacity: 0.9; margin-top: 8px; }
    .section { margin: 30px 0; }
    .section-title { font-size: 20px; font-weight: bold; color: #111827; margin-bottom: 16px; border-left: 4px solid #667eea; padding-left: 12px; }
    .progress-bar { background: #e5e7eb; height: 24px; border-radius: 12px; overflow: hidden; margin: 12px 0; }
    .progress-fill { background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; display: flex; align-items: center; padding: 0 12px; color: white; font-size: 12px; font-weight: bold; }
    .comment { background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; line-height: 1.6; }
    footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
  </style>
</head>
<body>
  <div class=\"container\">
    <h1>🌟 {{studentName}} 학생 리포트</h1>
    <div class=\"subtitle\">{{period}} 학습 성과 리포트</div>
    
    <div class=\"stats\">
      <div class=\"stat-card\">
        <div class=\"stat-value\">{{attendanceRate}}%</div>
        <div class=\"stat-label\">출석률</div>
      </div>
      <div class=\"stat-card\">
        <div class=\"stat-value\">{{homeworkRate}}%</div>
        <div class=\"stat-label\">과제 완성률</div>
      </div>
      <div class=\"stat-card\">
        <div class=\"stat-value\">{{avgScore}}점</div>
        <div class=\"stat-label\">평균 점수</div>
      </div>
    </div>

    <div class=\"section\">
      <div class=\"section-title\">📚 과목별 성취도</div>
      <div>
        <div style=\"display: flex; justify-content: space-between; margin-bottom: 8px;\">
          <span>수학</span>
          <span>{{mathScore}}점</span>
        </div>
        <div class=\"progress-bar\">
          <div class=\"progress-fill\" style=\"width: {{mathScore}}%\">{{mathScore}}%</div>
        </div>
      </div>
      <div style=\"margin-top: 16px;\">
        <div style=\"display: flex; justify-content: space-between; margin-bottom: 8px;\">
          <span>영어</span>
          <span>{{englishScore}}점</span>
        </div>
        <div class=\"progress-bar\">
          <div class=\"progress-fill\" style=\"width: {{englishScore}}%\">{{englishScore}}%</div>
        </div>
      </div>
    </div>

    <div class=\"section\">
      <div class=\"section-title\">💬 선생님 코멘트</div>
      <div class=\"comment\">
        {{teacherComment}}
      </div>
    </div>

    <footer>
      <p>이 리포트는 {{academyName}}에서 제공합니다.</p>
      <p style=\"font-size: 12px; margin-top: 8px;\">생성일: {{generatedDate}}</p>
    </footer>
  </div>
</body>
</html>',
  '[\"studentName\",\"period\",\"attendanceRate\",\"homeworkRate\",\"avgScore\",\"mathScore\",\"englishScore\",\"teacherComment\",\"academyName\",\"generatedDate\"]',
  1,
  'system',
  datetime('now'),
  datetime('now')
);
"

echo "✅ Default template inserted!"
echo ""
echo "🎉 All done! You can now use the landing page templates."
