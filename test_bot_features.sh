#!/bin/bash

echo "=== AI Bot Features Debugging Guide ==="
echo ""
echo "🔍 **Current Status:**"
echo "- Backend (functions/api/admin/ai-bots.ts):"
echo "  ✅ Lines 204-205: Converts boolean to integer"
echo "  ✅ enableProblemGeneration: boolean ? 1 : 0"
echo "  ✅ voiceEnabled: boolean ? 1 : 0"
echo ""
echo "- Frontend (src/app/dashboard/admin/ai-bots/create/page.tsx):"
echo "  ✅ Lines 1122-1127: enableProblemGeneration checkbox"
echo "  ✅ Lines 1143-1148: voiceEnabled checkbox"
echo "  ✅ Both checkboxes send boolean values to backend"
echo ""
echo "- AI Chat page (src/app/ai-chat/page.tsx):"
echo "  ✅ Line 52: enableProblemGeneration?: number"
echo "  ✅ Line 53: voiceEnabled?: number | boolean"
echo "  ✅ Line 679: checks selectedBot.voiceEnabled"
echo "  ✅ Line 738: checks enableProblemGeneration (1, '1', true, Number===1)"
echo ""
echo "- TTS API (functions/api/ai/tts.ts):"
echo "  ✅ Endpoint: POST /api/ai/tts"
echo "  ✅ Requires: { text, voiceName }"
echo "  ✅ Uses GEMINI_API_KEY for Google Cloud TTS"
echo ""
echo "📝 **Potential Issues:**"
echo ""
echo "1. Database Value Issue:"
echo "   - If existing bots were created before enableProblemGeneration/voiceEnabled columns existed"
echo "   - These values might be NULL or 0 in the database"
echo "   - Solution: Update existing bots to set proper values"
echo ""
echo "2. Type Mismatch:"
echo "   - Frontend sends: boolean (true/false)"
echo "   - Backend saves: integer (1/0)"
echo "   - Frontend reads: could be number | boolean"
echo "   - Solution: Ensure consistent type checking"
echo ""
echo "3. TTS API Key:"
echo "   - TTS requires GEMINI_API_KEY environment variable"
echo "   - If not set, TTS will fail"
echo "   - Check Cloudflare Pages environment variables"
echo ""
echo "🔧 **Fixes Needed:**"
echo ""
echo "1. Console Logging Enhancement:"
echo "   - Add logs to show voiceEnabled value when bot is selected"
echo "   - Add logs to show enableProblemGeneration value"
echo "   - Add logs in TTS playback attempt"
echo ""
echo "2. Better Error Messages:"
echo "   - Show clear error if TTS is not enabled"
echo "   - Show clear error if problem generation is not enabled"
echo ""
echo "3. UI Feedback:"
echo "   - Display TTS status in bot info"
echo "   - Display problem generation status in bot info"
echo ""

# Create test data
cat > test_data.json << 'TESTDATA'
{
  "test_scenarios": [
    {
      "name": "New Bot Creation",
      "steps": [
        "1. Go to /dashboard/admin/ai-bots/create",
        "2. Enable '유사문제 출제 기능' checkbox",
        "3. Enable '음성 출력 (TTS)' checkbox",
        "4. Select voice (e.g., ko-KR-Wavenet-A)",
        "5. Fill other required fields",
        "6. Click '생성하기'",
        "7. Check console logs for saved values"
      ],
      "expected": {
        "enableProblemGeneration": 1,
        "voiceEnabled": 1,
        "voiceName": "ko-KR-Wavenet-A"
      }
    },
    {
      "name": "Problem Generation Test",
      "steps": [
        "1. Go to /ai-chat",
        "2. Select bot with enableProblemGeneration=1",
        "3. Ask AI to create math problems",
        "4. Click '문제지 출력' button",
        "5. Check console for extracted problems"
      ],
      "expected": {
        "console_log": "🖨️ 문제지 출력 시작...",
        "alert": "문제지가 열립니다"
      }
    },
    {
      "name": "TTS Playback Test",
      "steps": [
        "1. Go to /ai-chat",
        "2. Select bot with voiceEnabled=1",
        "3. Send a message to AI",
        "4. Click speaker button on AI response",
        "5. Check console for TTS logs"
      ],
      "expected": {
        "console_log": "🔊 Playing TTS for message",
        "result": "Audio plays successfully"
      }
    }
  ]
}
TESTDATA

echo ""
echo "✅ Test scenarios saved to test_data.json"
echo ""
echo "🎯 **Next Steps:**"
echo "1. Add debug logs to ai-chat page"
echo "2. Test with a newly created bot"
echo "3. Check browser console for feature status"
echo "4. Verify GEMINI_API_KEY is set in Cloudflare"

