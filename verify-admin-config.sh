#!/bin/bash
echo "=== 1. Admin 설정 확인 ==="
curl -s "https://suplacestudy.com/api/admin/homework-grading-config" \
  -H "Authorization: Bearer test-token" | jq -r '.config | {model, temperature, enableRAG, systemPromptLength: (.systemPrompt | length)}'

echo ""
echo "=== 2. 실제 채점 시 사용된 설정 확인 (로그에서) ==="
echo "채점 API가 config를 로드하는 코드:"
grep -A 10 "채점 설정 불러오기" functions/api/homework/process-grading.ts

echo ""
echo "=== 3. DeepSeek API 호출 부분 확인 ==="
grep -A 30 "performDeepSeekGrading" functions/api/homework/process-grading.ts | head -40
