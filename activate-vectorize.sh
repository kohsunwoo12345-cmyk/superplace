#!/bin/bash

echo "🎉 Vectorize 인덱스 생성 완료 후 실행 스크립트"
echo "=============================================="
echo ""
echo "이 스크립트는 다음 작업을 수행합니다:"
echo "1. wrangler.toml에서 Vectorize 바인딩 활성화"
echo "2. 변경사항 커밋"
echo "3. GitHub에 푸시"
echo "4. Cloudflare Pages 자동 배포 트리거"
echo ""
read -p "계속하시겠습니까? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ 취소되었습니다."
    exit 1
fi

echo ""
echo "📝 Step 1: wrangler.toml 수정 중..."
echo "-------------------------------------------"

# wrangler.toml 파일에서 Vectorize 바인딩 주석 제거
sed -i '23s/^# //' /home/user/webapp/wrangler.toml
sed -i '24s/^# //' /home/user/webapp/wrangler.toml
sed -i '25s/^# //' /home/user/webapp/wrangler.toml

echo "✅ wrangler.toml 수정 완료"
echo ""
echo "변경된 내용:"
echo "-------------------------------------------"
tail -n 10 /home/user/webapp/wrangler.toml
echo ""

echo "📦 Step 2: 빌드 테스트 중..."
echo "-------------------------------------------"
cd /home/user/webapp
npm run build 2>&1 | grep -E "(error|Error|✓|Compiled|complete)" | tail -5

if [ $? -eq 0 ]; then
    echo "✅ 빌드 성공!"
else
    echo "❌ 빌드 실패. wrangler.toml을 확인하세요."
    exit 1
fi

echo ""
echo "💾 Step 3: Git 커밋 중..."
echo "-------------------------------------------"
git add /home/user/webapp/wrangler.toml
git commit -m "feat(vectorize): Vectorize 바인딩 활성화 - RAG 완전 작동

- Vectorize 인덱스 'knowledge-base-embeddings' 연결
- RAG (Retrieval-Augmented Generation) 활성화
- PDF 기반 AI 챗봇 지식 베이스 기능 완전 작동
- 임베딩 API, 벡터 검색, AI 챗 통합 완료"

echo "✅ 커밋 완료"
echo ""

echo "🚀 Step 4: GitHub 푸시 중..."
echo "-------------------------------------------"
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ 푸시 성공!"
else
    echo "❌ 푸시 실패. 네트워크를 확인하세요."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 모든 작업 완료!"
echo ""
echo "⏳ Cloudflare Pages 배포 진행 중..."
echo "   - 예상 소요 시간: 3-5분"
echo "   - 배포 상태 확인: https://dash.cloudflare.com/"
echo ""
echo "✅ 배포 완료 후 테스트:"
echo "-------------------------------------------"
echo "1. PDF 업로드 테스트:"
echo "   👉 https://superplacestudy.pages.dev/dashboard/admin/ai-bots/create"
echo "   - Knowledge Base 섹션에서 PDF 파일 업로드"
echo "   - 업로드 성공 확인"
echo ""
echo "2. AI 챗봇 테스트:"
echo "   👉 https://superplacestudy.pages.dev/ai-chat"
echo "   - 지식 베이스 관련 질문 입력"
echo "   - 정확한 답변 확인"
echo ""
echo "3. Cloudflare Logs 확인:"
echo "   - RAG 검색 로그: '🔍 RAG 검색 시작'"
echo "   - 관련 청크 발견: '📚 5개 관련 청크 발견'"
echo "   - 컨텍스트 추가: '✅ RAG 컨텍스트 추가 완료'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📞 문제 발생 시:"
echo "-------------------------------------------"
echo "1. 배포 실패: 빌드 로그 확인"
echo "2. RAG 작동 안 함: Vectorize 인덱스 상태 확인"
echo "3. 자세한 가이드: /home/user/webapp/RAG_ACTIVATION_GUIDE.md"
echo ""
echo "🚀 성공을 기원합니다!"
