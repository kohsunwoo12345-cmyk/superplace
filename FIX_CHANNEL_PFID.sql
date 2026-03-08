-- ============================================
-- FIX: Update KakaoChannel with Real Solapi pfId
-- ============================================
-- Problem: solapiChannelId contains Korean name "꾸메땅학원" instead of real pfId
-- Solution: Replace with actual 32-40 character Solapi pfId (e.g., KA01PF...)

-- STEP 1: Check current data
SELECT 
    id,
    channelName,
    solapiChannelId as current_pfId,
    LENGTH(solapiChannelId) as pfId_length,
    phoneNumber,
    userId,
    createdAt
FROM KakaoChannel 
WHERE id = 'ch_1772359215883_fk4otb5hv';

-- STEP 2: Update with real pfId (REPLACE 'YOUR_REAL_PFID_HERE' with actual value)
-- Example: KA01PF240301AB12CD34EF56GH78IJ90KL
UPDATE KakaoChannel 
SET solapiChannelId = 'YOUR_REAL_PFID_HERE',
    updatedAt = CURRENT_TIMESTAMP
WHERE id = 'ch_1772359215883_fk4otb5hv';

-- STEP 3: Verify the update
SELECT 
    id,
    channelName,
    solapiChannelId as updated_pfId,
    LENGTH(solapiChannelId) as pfId_length,
    phoneNumber,
    updatedAt
FROM KakaoChannel 
WHERE id = 'ch_1772359215883_fk4otb5hv';

-- STEP 4: Check all channels
SELECT 
    id,
    channelName,
    solapiChannelId,
    LENGTH(solapiChannelId) as pfId_length,
    CASE 
        WHEN LENGTH(solapiChannelId) >= 30 AND LENGTH(solapiChannelId) <= 40 THEN '✅ Valid'
        ELSE '❌ Invalid'
    END as status
FROM KakaoChannel
ORDER BY createdAt DESC;

-- ============================================
-- Additional Info
-- ============================================
-- Valid pfId format:
-- - Starts with "KA01PF"
-- - Length: 30-40 characters
-- - Example: KA01PF240301AB12CD34EF56GH78IJ90KL (32 chars)
--
-- How to get real pfId:
-- 1. Solapi Console: https://solapi.com → 카카오 채널 관리
-- 2. Solapi API: GET https://api.solapi.com/kakao/v2/plus-friends
