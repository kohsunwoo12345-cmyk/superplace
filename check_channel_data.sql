-- 채널 데이터 확인
SELECT 
  id,
  channelName,
  solapiChannelId,
  LENGTH(solapiChannelId) as pfIdLength,
  phoneNumber,
  userId,
  createdAt
FROM KakaoChannel 
WHERE id = 'ch_1772359215883_fk4otb5hv';

-- 모든 채널 확인
SELECT 
  id,
  channelName,
  solapiChannelId,
  LENGTH(solapiChannelId) as pfIdLength
FROM KakaoChannel 
ORDER BY createdAt DESC 
LIMIT 5;
