-- 현재 활성화된 봇들의 모델 확인
SELECT 
  id,
  name,
  model,
  isActive,
  knowledgeBase IS NOT NULL as hasKnowledge
FROM ai_bots 
WHERE isActive = 1
ORDER BY createdAt DESC
LIMIT 10;
