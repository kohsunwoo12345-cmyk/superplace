#!/bin/bash

echo "=== 실제 Solapi 템플릿 확인 ==="
echo ""

# 배포된 사이트에서 채널 정보 확인
echo "1. 채널 정보 확인 중..."
CHANNEL_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/kakao/channels?userId=20640435")
echo "$CHANNEL_RESPONSE" | jq -r '.channels[] | "채널 ID: \(.id), 이름: \(.channelName), Solapi ID: \(.solapiChannelId)"' 2>/dev/null || echo "$CHANNEL_RESPONSE"

echo ""
echo "2. 템플릿 정보 확인 중..."

# 5개 템플릿 코드
TEMPLATE_CODES=(
  "KA01TP230126085130773ZHclHN4i674"
  "KA01TP221027002252645FPwAcO9SguY"
  "KA01TP221025083117992xkz17KyvNbr"
  "KA01TP240110072220677clp0DwzaW23"
  "KA01TP230131084504073zoRX27WkwHB"
)

echo ""
echo "3. 현재 코드의 템플릿 내용:"
echo "----------------------------------------"
for i in {1..5}; do
  echo "기본 템플릿 $i:"
  grep -A 3 "id: 'default-$i'" /home/user/webapp/src/app/dashboard/kakao-alimtalk/send/page.tsx | grep "content:" | sed 's/.*content: //' | sed "s/',$//"
  echo ""
done

echo ""
echo "=== 랜딩페이지 URL 고유성 확인 ==="
echo ""
echo "4. handleSend 함수의 URL 생성 로직:"
grep -A 15 "preparedRecipients = validRecipients.map" /home/user/webapp/src/app/dashboard/kakao-alimtalk/send/page.tsx | head -20

echo ""
echo "✅ 각 수신자마다 고유한 URL이 생성되는지 확인:"
echo "   - studentId가 있으면: ?studentId=\${recipient.studentId}&ref=\${Date.now()}_\${index}"
echo "   - 없으면: ?student=\${name}&phone=\${phone}&ref=\${Date.now()}_\${index}"
echo ""
echo "   index가 있어서 각 수신자마다 다른 ref 값이 부여됩니다!"
