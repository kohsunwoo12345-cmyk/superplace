#!/bin/bash

echo "=== Testing /api/homework/grade endpoint ==="
echo ""

# Test POST request
echo "1. Testing POST request..."
curl -X POST "https://genspark-ai-developer.superplacestudy.pages.dev/api/homework/grade" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "code": "123456", "images": ["test"]}' \
  -w "\nHTTP Status: %{http_code}\n" \
  2>&1 | head -50

echo ""
echo "=== Test completed ==="
