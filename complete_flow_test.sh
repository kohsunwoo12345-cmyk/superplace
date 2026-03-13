#!/bin/bash

echo "============================================="
echo "   완전한 플로우 테스트"
echo "============================================="

# 실제 숙제 이미지 (간단한 수학 문제)
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAZAAAADICAYAAADGFbfiAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAADl0RVh0U29mdHdhcmUAbWF0cGxvdGxpYiB2ZXJzaW9uIDMuMC4zLCBodHRwOi8vbWF0cGxvdGxpYi5vcmcvnQurowAAIABJREFUeJzs3Xd8FNX+xvHPmd1seiEJCSUh9C4gKCBNpCqIFFFB77V3sV0V9V6vvV1RrthABAVFFBQVC0VBelGkSpHekhBCEkj7fX9/JIslJSEh2Uny"

echo ""
echo "=== 1. 새로운 숙제 제출 ==="
SUBMIT_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/grade" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"student-1771491307268-zavs7u5t0\",
    \"code\": \"REALTEST999\",
    \"images\": [\"data:image/png;base64,${TEST_IMAGE}\"]
  }")

echo "$SUBMIT_RESPONSE" | jq '{
  success: .success,
  error: .error,
  submission_id: .submission.id,
  status: .submission.status,
  userName: .submission.studentName
}' 2>&1

SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id // "none"')
echo ""
echo "제출 ID: $SUBMISSION_ID"

if [ "$SUBMISSION_ID" = "none" ]; then
  echo "❌ 제출 실패!"
  exit 1
fi

echo ""
echo "⏳ 채점 대기 (5초)..."
sleep 5

echo ""
echo "=== 2. 제출된 데이터 조회 ==="
TOKEN="student-1771491307268-zavs7u5t0|student-1771491307055@temp.superplace.com|student|129|$(date +%s)000"

RESULT=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2026-03-14&endDate=2026-03-14" \
  -H "Authorization: Bearer $TOKEN")

echo "$RESULT" | jq ".results[] | select(.submission.id == \"$SUBMISSION_ID\") | {
  id: .submission.id,
  userName: .submission.userName,
  userEmail: .submission.userEmail,
  status: .submission.status,
  imageCount: .submission.imageCount,
  images_length: (.submission.images | length),
  score: .grading.score,
  feedback: .grading.feedback
}" 2>&1

echo ""
echo "=== 3. 이미지 API 직접 확인 ==="
curl -s "https://superplacestudy.pages.dev/api/homework/images?submissionId=$SUBMISSION_ID" \
  | jq '{
    success: .success,
    count: .count,
    has_images: ((.images | length) > 0)
  }' 2>&1

echo ""
echo "============================================="
echo "✅ 완전한 플로우 테스트 완료"
echo "============================================="

