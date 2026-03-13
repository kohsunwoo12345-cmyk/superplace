#!/bin/bash

TOKEN="student-1771491307268-zavs7u5t0|1773523200000|9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08|129"

echo "📊 API 응답 구조 확인..."
curl -s "https://superplacestudy.pages.dev/api/homework/results?date=2026-03-14" \
  -H "Authorization: Bearer $TOKEN" | jq '.results[0] | {
  submissionId: .submissionId,
  submission_id: .submission.id,
  userName: .submission.userName,
  structure: keys
}'
