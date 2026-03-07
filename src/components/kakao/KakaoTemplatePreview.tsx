'use client';

import React from 'react';

export interface KakaoButton {
  buttonName: string;
  buttonType: 'WL' | 'AL' | 'DS' | 'BK' | 'MD' | 'BC' | 'BT' | 'AC';
  linkMo?: string;
  linkPc?: string;
  linkAnd?: string;
  linkIos?: string;
}

export interface QuickReply {
  name: string;
  linkType: 'WL' | 'AL' | 'BK' | 'BT' | 'BC';
  linkMo?: string;
  linkPc?: string;
}

export interface KakaoTemplateData {
  name: string;
  content: string;
  messageType?: 'BA' | 'EX' | 'AD' | 'MI';
  emphasizeType?: 'NONE' | 'TEXT' | 'IMAGE' | 'ITEM_LIST';
  emphasizeTitle?: string;
  emphasizeSubTitle?: string;
  header?: string;
  extra?: string;
  buttons?: KakaoButton[];
  quickReplies?: QuickReply[];
  imageUrl?: string;
}

interface KakaoTemplatePreviewProps {
  template: KakaoTemplateData;
  className?: string;
}

const KakaoTemplatePreview: React.FC<KakaoTemplatePreviewProps> = ({ template, className = '' }) => {
  // 현재 시간 표시
  const currentTime = new Date().toLocaleTimeString('ko-KR', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  return (
    <div className={`max-w-[375px] mx-auto ${className}`}>
      {/* 스마트폰 프레임 */}
      <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800">
        
        {/* 상단 상태바 (9:41) */}
        <div className="bg-white px-6 py-2 flex items-center justify-between text-xs font-semibold">
          <span className="text-gray-900">9:41</span>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 22h20V2z"/>
            </svg>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 4h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 2v20"/>
            </svg>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 7h4v10H2z M8 4h4v16H8z M14 2h4v20h-4z M20 6h2v12h-2z"/>
            </svg>
          </div>
        </div>

        {/* 카카오톡 헤더 */}
        <div className="bg-[#A5B8C9] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="text-white/80">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-white font-semibold text-lg">Kakao알림톡</span>
            </div>
            <button className="text-white/80">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* 메시지 영역 배경 */}
        <div className="bg-[#9EADBB] min-h-[500px] p-4">
          
          {/* 알림톡 메시지 카드 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            
            {/* 상단 Kakao알림톡 배지 */}
            <div className="bg-[#FFE500] px-3 py-1.5 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#3C1E1E] flex items-center justify-center">
                <svg className="w-3 h-3 text-[#FFE500]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 5.58 2 10c0 2.96 2.01 5.54 5 6.74V22l4.5-3.5c.83.14 1.69.22 2.5.22 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-800">Kakao알림톡</span>
            </div>

            {/* 메시지 본문 */}
            <div className="p-4">
              
              {/* 강조 표기형 (노란색 하이라이트) */}
              {template.emphasizeType === 'TEXT' && (template.emphasizeTitle || template.emphasizeSubTitle) && (
                <div className="bg-[#FFE500] rounded-lg p-3 mb-3">
                  {template.emphasizeTitle && (
                    <div className="font-bold text-gray-900 text-sm mb-1">{template.emphasizeTitle}</div>
                  )}
                  {template.emphasizeSubTitle && (
                    <div className="text-gray-800 text-xs leading-relaxed">{template.emphasizeSubTitle}</div>
                  )}
                </div>
              )}

              {/* 이미지형 */}
              {template.emphasizeType === 'IMAGE' && template.imageUrl && (
                <div className="mb-3 -mx-4 -mt-4">
                  <img 
                    src={template.imageUrl} 
                    alt="Template" 
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              {/* 헤더 (아이템리스트용) */}
              {template.header && template.emphasizeType === 'ITEM_LIST' && (
                <div className="font-bold text-gray-900 text-sm mb-2 pb-2 border-b border-gray-200">
                  {template.header}
                </div>
              )}

              {/* 본문 내용 */}
              <div className="text-gray-800 text-[13px] leading-relaxed whitespace-pre-wrap">
                {template.content.split('\n').map((line, index) => {
                  // 변수 하이라이트 (#{변수명})
                  const parts = line.split(/(#\{[^}]+\})/g);
                  return (
                    <div key={index}>
                      {parts.map((part, i) => {
                        if (part.match(/#\{[^}]+\}/)) {
                          return (
                            <span key={i} className="text-blue-600 font-medium">
                              {part}
                            </span>
                          );
                        }
                        return <span key={i}>{part}</span>;
                      })}
                    </div>
                  );
                })}
              </div>

              {/* 부가정보형 */}
              {template.messageType === 'EX' && template.extra && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-3">
                  <div className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {template.extra}
                  </div>
                </div>
              )}

              {/* 버튼 영역 */}
              {template.buttons && template.buttons.length > 0 && (
                <div className="space-y-2 mt-4">
                  {template.buttons.map((button, index) => {
                    // 첫 번째 버튼은 노란색 (Primary)
                    const isPrimary = index === 0;
                    // 채널추가 버튼은 특별 스타일
                    const isChannelAdd = button.buttonType === 'AC';
                    
                    return (
                      <button
                        key={index}
                        className={`w-full py-3 px-4 rounded-md font-medium text-sm transition-all ${
                          isPrimary || isChannelAdd
                            ? 'bg-[#FFE500] hover:bg-[#FFD700] text-gray-900 border border-[#FFE500]'
                            : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                        }`}
                      >
                        {button.buttonName}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 바로연결 (Quick Replies) */}
              {template.quickReplies && template.quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                  {template.quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors border border-gray-200"
                    >
                      #{reply.name}
                    </button>
                  ))}
                </div>
              )}

              {/* 광고 추가형 표시 */}
              {template.messageType === 'AD' && (
                <div className="text-[10px] text-gray-400 mt-3 pt-2 border-t border-gray-100">
                  (광고) 무료 수신 거부 080-000-0000
                </div>
              )}
            </div>

            {/* 하단 발송 시간 */}
            <div className="px-4 pb-3 flex items-center justify-between text-[11px] text-gray-400">
              <span>오전 10:00</span>
              <span className="text-[#FFE500]">읽음 ✓</span>
            </div>
          </div>

        </div>

        {/* 카카오톡 하단 입력창 */}
        <div className="bg-white px-4 py-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button className="text-gray-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
              </svg>
            </button>
            <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
              <span className="text-gray-400 text-sm">메시지 보내기</span>
            </div>
            <button className="text-gray-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </button>
          </div>
        </div>

      </div>

      {/* 템플릿 정보 (디버깅용) */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-800">메시지 유형:</span>
            <span className="font-medium">
              {template.messageType === 'BA' && '기본형'}
              {template.messageType === 'EX' && '부가정보형'}
              {template.messageType === 'AD' && '채널추가형'}
              {template.messageType === 'MI' && '복합형'}
            </span>
          </div>
          {template.emphasizeType && template.emphasizeType !== 'NONE' && (
            <div className="flex justify-between">
              <span className="font-semibold text-gray-800">강조 유형:</span>
              <span className="font-medium">
                {template.emphasizeType === 'TEXT' && '강조표기형'}
                {template.emphasizeType === 'IMAGE' && '이미지형'}
                {template.emphasizeType === 'ITEM_LIST' && '아이템리스트형'}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-semibold text-gray-800">버튼 수:</span>
            <span className="font-medium">{template.buttons?.length || 0}개</span>
          </div>
          {template.quickReplies && template.quickReplies.length > 0 && (
            <div className="flex justify-between">
              <span className="font-semibold text-gray-800">바로연결:</span>
              <span className="font-medium">{template.quickReplies.length}개</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KakaoTemplatePreview;
