/**
 * RAG 테스트 페이지
 * 
 * 지식 업로드 및 RAG 채팅 테스트
 */

'use client';

import { useState } from 'react';

interface UploadResponse {
  success: boolean;
  filename?: string;
  chunksProcessed?: number;
  vectorsInserted?: number;
  message?: string;
  error?: string;
  details?: string;
}

interface ChatResponse {
  success: boolean;
  query?: string;
  answer?: string;
  sourcesUsed?: number;
  sources?: Array<{
    filename: string;
    chunkIndex: number;
    score: number;
    preview: string;
  }>;
  error?: string;
  details?: string;
}

export default function RagTestPage() {
  const [uploadContent, setUploadContent] = useState('');
  const [uploadFilename, setUploadFilename] = useState('test-knowledge.txt');
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const [chatQuery, setChatQuery] = useState('');
  const [chatResult, setChatResult] = useState<ChatResponse | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const handleUpload = async () => {
    if (!uploadContent.trim()) {
      alert('업로드할 내용을 입력하세요.');
      return;
    }

    setUploadLoading(true);
    setUploadResult(null);

    try {
      const response = await fetch('/api/rag/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: uploadContent,
          filename: uploadFilename,
          metadata: {
            uploadedAt: new Date().toISOString(),
            testMode: true,
          },
        }),
      });

      const data: UploadResponse = await response.json();
      setUploadResult(data);
    } catch (error: any) {
      setUploadResult({
        success: false,
        error: error.message,
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatQuery.trim()) {
      alert('질문을 입력하세요.');
      return;
    }

    setChatLoading(true);
    setChatResult(null);

    try {
      const response = await fetch('/api/rag/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: chatQuery,
          topK: 3,
        }),
      });

      const data: ChatResponse = await response.json();
      setChatResult(data);
    } catch (error: any) {
      setChatResult({
        success: false,
        error: error.message,
      });
    } finally {
      setChatLoading(false);
    }
  };

  const loadSampleData = () => {
    setUploadContent(`슈퍼플레이스는 선생님과 학생을 위한 혁신적인 교육 플랫폼입니다.

주요 기능:
1. AI 채팅 - Gemini AI를 활용한 학습 지원
2. RAG 지식 베이스 - 맞춤형 학습 자료 제공
3. 학습 자료 관리 - 문제지, 답안지 자동 생성
4. SMS 통합 - 학부모 소통 기능

기술 스택:
- Next.js 15 (App Router)
- Cloudflare Pages + D1 Database
- Cloudflare Workers AI (@cf/baai/bge-m3)
- Cloudflare Vectorize (벡터 데이터베이스)
- Google Gemini API

RAG 구현:
사용자가 지식 파일을 업로드하면 @cf/baai/bge-m3 모델로 임베딩하여
Vectorize에 저장합니다. 질문이 들어오면 관련 지식을 검색하고
Gemini API로 전송하여 정확한 답변을 생성합니다.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 RAG System Test
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📤 지식 업로드
              <span className="text-sm text-gray-500 font-normal">
                (@cf/baai/bge-m3)
              </span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  파일명
                </label>
                <input
                  type="text"
                  value={uploadFilename}
                  onChange={(e) => setUploadFilename(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="test-knowledge.txt"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  내용
                </label>
                <textarea
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="업로드할 지식을 입력하세요..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleUpload}
                  disabled={uploadLoading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {uploadLoading ? '업로드 중...' : '업로드'}
                </button>
                <button
                  onClick={loadSampleData}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  샘플 로드
                </button>
              </div>

              {uploadResult && (
                <div
                  className={`p-4 rounded-lg ${
                    uploadResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {uploadResult.success ? (
                    <div className="text-sm text-green-800">
                      <div className="font-semibold mb-2">✅ 업로드 성공!</div>
                      <div className="space-y-1">
                        <div>파일: {uploadResult.filename}</div>
                        <div>청크: {uploadResult.chunksProcessed}개</div>
                        <div>벡터: {uploadResult.vectorsInserted}개</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-red-800">
                      <div className="font-semibold mb-2">❌ 업로드 실패</div>
                      <div className="mb-1">{uploadResult.error}</div>
                      {uploadResult.details && (
                        <div className="text-xs mt-2 p-2 bg-white rounded border border-red-200 font-mono overflow-auto max-h-32">
                          {uploadResult.details}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              💬 RAG 채팅
              <span className="text-sm text-gray-500 font-normal">
                (Vectorize + Gemini)
              </span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  질문
                </label>
                <input
                  type="text"
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="질문을 입력하세요..."
                />
              </div>

              <button
                onClick={handleChat}
                disabled={chatLoading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {chatLoading ? '답변 생성 중...' : '질문하기'}
              </button>

              {chatResult && (
                <div
                  className={`p-4 rounded-lg ${
                    chatResult.success
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {chatResult.success ? (
                    <div className="text-sm">
                      <div className="font-semibold mb-2 text-blue-900">
                        🤖 Gemini 답변
                      </div>
                      <div className="p-3 bg-white rounded border border-blue-200 mb-3 text-gray-800 whitespace-pre-wrap">
                        {chatResult.answer}
                      </div>

                      {chatResult.sources && chatResult.sources.length > 0 && (
                        <div className="mt-3">
                          <div className="font-semibold mb-2 text-blue-900">
                            📚 출처 ({chatResult.sourcesUsed}개)
                          </div>
                          <div className="space-y-2">
                            {chatResult.sources.map((source, idx) => (
                              <div
                                key={idx}
                                className="p-2 bg-white rounded border border-blue-100 text-xs"
                              >
                                <div className="font-semibold text-gray-700">
                                  {source.filename} (chunk {source.chunkIndex})
                                </div>
                                <div className="text-gray-600 mt-1">
                                  유사도: {(source.score * 100).toFixed(1)}%
                                </div>
                                <div className="text-gray-500 mt-1">
                                  {source.preview}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-red-800">
                      <div className="font-semibold mb-2">❌ 질문 실패</div>
                      <div className="mb-1">{chatResult.error}</div>
                      {chatResult.details && (
                        <div className="text-xs mt-2 p-2 bg-white rounded border border-red-200 font-mono overflow-auto max-h-32">
                          {chatResult.details}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
                <div className="font-semibold mb-1">💡 테스트 순서:</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>왼쪽에서 지식 파일을 업로드합니다</li>
                  <li>업로드가 성공하면 2초 대기합니다</li>
                  <li>오른쪽에서 질문을 입력합니다</li>
                  <li>Gemini가 지식 기반 답변을 생성합니다</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">ℹ️ RAG 시스템 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-700 mb-2">
                🔢 임베딩 모델
              </div>
              <div className="text-gray-600">@cf/baai/bge-m3</div>
              <div className="text-xs text-gray-500 mt-1">1024 dimensions</div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-700 mb-2">
                💾 벡터 저장소
              </div>
              <div className="text-gray-600">Cloudflare Vectorize</div>
              <div className="text-xs text-gray-500 mt-1">
                knowledge-base-embeddings
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-700 mb-2">
                🤖 AI 모델
              </div>
              <div className="text-gray-600">Google Gemini 1.5 Flash</div>
              <div className="text-xs text-gray-500 mt-1">답변 생성</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
