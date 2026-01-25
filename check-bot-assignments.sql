-- AI 봇 및 할당 상태 확인 쿼리

-- 1. 모든 AI 봇 목록
SELECT 
  id as "봇ID",
  name as "봇이름",
  description as "설명",
  "createdAt" as "생성일"
FROM "AIBot"
ORDER BY "createdAt" DESC;

-- 2. 봇 할당 현황
SELECT 
  ba."botId" as "봇ID",
  b.name as "봇이름",
  u.email as "사용자이메일",
  u.name as "사용자이름",
  u.role as "역할",
  ba."isActive" as "활성화",
  ba."expiresAt" as "만료일"
FROM "BotAssignment" ba
JOIN "AIBot" b ON ba."botId" = b.id
JOIN "User" u ON ba."userId" = u.id
ORDER BY ba."createdAt" DESC;

-- 3. 특정 사용자의 할당된 봇 확인 (director@ggume.com)
SELECT 
  ba."botId" as "봇ID",
  b.name as "봇이름",
  ba."isActive" as "활성화"
FROM "BotAssignment" ba
JOIN "AIBot" b ON ba."botId" = b.id
JOIN "User" u ON ba."userId" = u.id
WHERE u.email = 'director@ggume.com'
  AND ba."isActive" = true
  AND (ba."expiresAt" IS NULL OR ba."expiresAt" > NOW());
