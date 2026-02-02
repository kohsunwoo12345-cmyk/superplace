'use client';

import { useState } from 'react';

export default function AIChatPage() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    
    // TODO: AI API 연동
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'AI 챗봇 기능은 API 연동 후 활성화됩니다. 🤖' 
      }]);
    }, 500);
  };

  return (
    <div className="p-6 h-[calc(100vh-120px)]">
      <div className="h-full flex flex-col bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold text-gray-900">AI 학습 도우미</h1>
          <p className="text-gray-600 text-sm">질문하면 AI가 답변해드립니다</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-gray-500">안녕하세요! 무엇을 도와드릴까요?</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              전송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
