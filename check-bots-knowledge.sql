-- 현재 활성화된 봇들의 지식베이스 확인
SELECT 
  id,
  name,
  model,
  isActive,
  CASE 
    WHEN knowledgeBase IS NULL THEN '❌ NULL'
    WHEN knowledgeBase = '' THEN '❌ 빈 문자열'
    WHEN LENGTH(knowledgeBase) < 50 THEN '⚠️ 짧음 (' || LENGTH(knowledgeBase) || '자)'
    ELSE '✅ 있음 (' || LENGTH(knowledgeBase) || '자)'
  END as knowledge_status,
  SUBSTR(knowledgeBase, 1, 100) as knowledge_preview
FROM ai_bots
WHERE isActive = 1
ORDER BY name;
