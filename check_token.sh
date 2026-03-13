#!/bin/bash

# 실제 사용 중인 토큰
TOKEN="student-1771491307268-zavs7u5t0|1773523200000|9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08|129"

echo "토큰: $TOKEN"
echo ""
echo "토큰 파싱:"
IFS='|' read -ra PARTS <<< "$TOKEN"
for i in "${!PARTS[@]}"; do
  echo "  Part $i: ${PARTS[$i]}"
done

echo ""
echo "파트 개수: ${#PARTS[@]}"
