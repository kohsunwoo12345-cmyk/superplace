#!/usr/bin/env python3
import requests
import time
import json

BASE_URL = "https://genspark-ai-developer.superplacestudy.pages.dev"

print("🧪 AI 챗봇 API 테스트")
print("=" * 50)

# 1. AI 챗 API 테스트
print("\n1️⃣ AI 챗 API 테스트")
print("-" * 50)

chat_data = {
    "message": "안녕하세요! 테스트 메시지입니다.",
    "botId": "bot-test-001",  # 실제 봇 ID로 변경 필요
    "conversationHistory": []
}

try:
    response = requests.post(
        f"{BASE_URL}/api/ai-chat",
        json=chat_data,
        timeout=30
    )
    print(f"상태 코드: {response.status_code}")
    print(f"응답: {response.text[:200]}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            print("✅ AI 챗 API 정상 작동!")
        else:
            print(f"⚠️ API 응답 실패: {data.get('message')}")
    else:
        print(f"❌ HTTP 오류: {response.status_code}")
except Exception as e:
    print(f"❌ 오류 발생: {e}")

print("\n" + "=" * 50)
print("테스트 완료")
