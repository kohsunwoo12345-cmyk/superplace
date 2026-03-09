#!/bin/bash

# RAG System Test Script
# Tests the complete RAG workflow: upload knowledge → query → Gemini response

echo "🚀 RAG System Test Starting..."
echo ""

# Configuration
BASE_URL="https://superplacestudy.pages.dev"
# BASE_URL="http://localhost:8788" # Use for local testing

# Test knowledge content (Korean + English)
TEST_KNOWLEDGE="
슈퍼플레이스 스터디는 AI 기반 교육 플랫폼입니다.

주요 기능:
1. AI 챗봇을 통한 학습 지원
2. 문제 출제 및 자동 채점
3. 학생 성적 분석
4. 실시간 출결 관리

기술 스택:
- Next.js 15 (React 19)
- Cloudflare Pages + Workers
- Cloudflare D1 Database
- Cloudflare Vectorize (RAG)
- Workers AI (@cf/baai/bge-m3 for embeddings)
- Google Gemini API

SuperPlace Study is an AI-powered educational platform.

Key Features:
1. AI chatbot for learning support
2. Problem generation and auto-grading
3. Student performance analysis
4. Real-time attendance management

Tech Stack:
- Next.js 15 (React 19)
- Cloudflare Pages + Workers
- Cloudflare D1 Database
- Cloudflare Vectorize (RAG)
- Workers AI (@cf/baai/bge-m3 for embeddings)
- Google Gemini API
"

# Test 1: Upload Knowledge
echo "📤 Test 1: Uploading knowledge to RAG system..."
UPLOAD_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/rag/upload" \
  -H "Content-Type: application/json" \
  -d "{
    \"content\": $(echo "$TEST_KNOWLEDGE" | jq -Rs .),
    \"filename\": \"superplace-info.txt\",
    \"metadata\": {
      \"category\": \"platform-info\",
      \"language\": \"ko+en\"
    }
  }")

echo "Upload Response:"
echo "$UPLOAD_RESPONSE" | jq .
echo ""

# Check if upload was successful
SUCCESS=$(echo "$UPLOAD_RESPONSE" | jq -r '.success // false')
if [ "$SUCCESS" != "true" ]; then
  echo "❌ Upload failed! Stopping tests."
  exit 1
fi

echo "✅ Knowledge uploaded successfully!"
echo ""

# Wait a bit for indexing
echo "⏳ Waiting 3 seconds for Vectorize indexing..."
sleep 3
echo ""

# Test 2: Korean Query
echo "🔍 Test 2: Querying in Korean..."
KOREAN_QUERY="슈퍼플레이스 스터디의 주요 기능은 무엇인가요?"
KOREAN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/rag/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"$KOREAN_QUERY\",
    \"topK\": 3
  }")

echo "Query: $KOREAN_QUERY"
echo ""
echo "Response:"
echo "$KOREAN_RESPONSE" | jq .
echo ""

# Check answer
ANSWER=$(echo "$KOREAN_RESPONSE" | jq -r '.answer // "No answer"')
SOURCES_USED=$(echo "$KOREAN_RESPONSE" | jq -r '.sourcesUsed // 0')

if [ "$SOURCES_USED" -gt 0 ]; then
  echo "✅ Korean query test passed! Used $SOURCES_USED sources."
else
  echo "⚠️  Korean query test: No sources found in Vectorize"
fi
echo ""
echo "Answer preview: ${ANSWER:0:200}..."
echo ""
echo "---"
echo ""

# Test 3: English Query
echo "🔍 Test 3: Querying in English..."
ENGLISH_QUERY="What technology stack does SuperPlace Study use?"
ENGLISH_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/rag/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"$ENGLISH_QUERY\",
    \"topK\": 3
  }")

echo "Query: $ENGLISH_QUERY"
echo ""
echo "Response:"
echo "$ENGLISH_RESPONSE" | jq .
echo ""

# Check answer
ANSWER_EN=$(echo "$ENGLISH_RESPONSE" | jq -r '.answer // "No answer"')
SOURCES_USED_EN=$(echo "$ENGLISH_RESPONSE" | jq -r '.sourcesUsed // 0')

if [ "$SOURCES_USED_EN" -gt 0 ]; then
  echo "✅ English query test passed! Used $SOURCES_USED_EN sources."
else
  echo "⚠️  English query test: No sources found in Vectorize"
fi
echo ""
echo "Answer preview: ${ANSWER_EN:0:200}..."
echo ""
echo "---"
echo ""

# Test 4: Complex Query with Conversation History
echo "🔍 Test 4: Query with conversation history..."
COMPLEX_QUERY="이전에 말한 기능들 중에서 가장 중요한 것은 무엇인가요?"
COMPLEX_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/rag/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"$COMPLEX_QUERY\",
    \"topK\": 3,
    \"conversationHistory\": [
      {
        \"role\": \"user\",
        \"content\": \"$KOREAN_QUERY\"
      },
      {
        \"role\": \"assistant\",
        \"content\": \"$(echo "$ANSWER" | head -c 200)\"
      }
    ]
  }")

echo "Query: $COMPLEX_QUERY"
echo ""
echo "Response:"
echo "$COMPLEX_RESPONSE" | jq .
echo ""

# Check answer
ANSWER_COMPLEX=$(echo "$COMPLEX_RESPONSE" | jq -r '.answer // "No answer"')
if [ ${#ANSWER_COMPLEX} -gt 10 ]; then
  echo "✅ Complex query test passed!"
else
  echo "❌ Complex query test failed: Answer too short"
fi
echo ""
echo "Answer preview: ${ANSWER_COMPLEX:0:200}..."
echo ""

# Summary
echo "="
echo "📊 RAG System Test Summary"
echo "=========================="
echo ""
echo "1. ✅ Knowledge Upload: Working"
echo "2. $([ "$SOURCES_USED" -gt 0 ] && echo "✅" || echo "⚠️ ") Korean Query: $([ "$SOURCES_USED" -gt 0 ] && echo "Working ($SOURCES_USED sources)" || echo "No sources found")"
echo "3. $([ "$SOURCES_USED_EN" -gt 0 ] && echo "✅" || echo "⚠️ ") English Query: $([ "$SOURCES_USED_EN" -gt 0 ] && echo "Working ($SOURCES_USED_EN sources)" || echo "No sources found")"
echo "4. $([ ${#ANSWER_COMPLEX} -gt 10 ] && echo "✅" || echo "❌") Complex Query with History: $([ ${#ANSWER_COMPLEX} -gt 10 ] && echo "Working" || echo "Failed")"
echo ""
echo "🎯 RAG System Status: $([ "$SOURCES_USED" -gt 0 ] && [ "$SOURCES_USED_EN" -gt 0 ] && [ ${#ANSWER_COMPLEX} -gt 10 ] && echo "✅ FULLY OPERATIONAL" || echo "⚠️  PARTIAL (Check logs above)")"
echo ""
