'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Phone, Calendar, MapPin } from 'lucide-react';

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
  const getButtonIcon = (buttonType: string) => {
    switch (buttonType) {
      case 'WL':
      case 'AL':
        return <ExternalLink className="w-3 h-3" />;
      case 'DS':
        return <Phone className="w-3 h-3" />;
      case 'BK':
        return <Calendar className="w-3 h-3" />;
      case 'MD':
        return <MapPin className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getButtonTypeLabel = (buttonType: string) => {
    const labels: Record<string, string> = {
      WL: '웹링크',
      AL: '앱링크',
      DS: '배송조회',
      BK: '봇키워드',
      MD: '메시지전달',
      BC: '상담톡전환',
      BT: '봇전환',
      AC: '채널추가',
    };
    return labels[buttonType] || buttonType;
  };

  return (
    <div className={`max-w-sm mx-auto ${className}`}>
      {/* 카카오톡 헤더 */}
      <div className="bg-[#9EADBB] px-4 py-3 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <span className="text-lg">💛</span>
            </div>
            <div>
              <div className="text-white font-semibold text-sm">
                {template.name || '템플릿 이름'}
              </div>
              <div className="text-white/70 text-xs">알림톡</div>
            </div>
          </div>
          <div className="text-white/50 text-xs">오전 10:00</div>
        </div>
      </div>

      {/* 메시지 본문 */}
      <div className="bg-white px-4 py-4 space-y-3">
        {/* 강조 표기형 (TEXT) */}
        {template.emphasizeType === 'TEXT' && (template.emphasizeTitle || template.emphasizeSubTitle) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
            {template.emphasizeTitle && (
              <div className="font-bold text-gray-900 text-base mb-1">{template.emphasizeTitle}</div>
            )}
            {template.emphasizeSubTitle && (
              <div className="text-gray-700 text-sm">{template.emphasizeSubTitle}</div>
            )}
          </div>
        )}

        {/* 이미지형 */}
        {template.emphasizeType === 'IMAGE' && template.imageUrl && (
          <div className="mb-3 -mx-4">
            <img 
              src={template.imageUrl} 
              alt="Template" 
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* 헤더 (아이템리스트용) */}
        {template.header && template.emphasizeType === 'ITEM_LIST' && (
          <div className="font-semibold text-gray-900 text-sm mb-2">{template.header}</div>
        )}

        {/* 본문 내용 */}
        <div className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
          {template.content}
        </div>

        {/* 부가정보형 */}
        {template.messageType === 'EX' && template.extra && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-3">
            <div className="text-xs text-gray-600 whitespace-pre-wrap">{template.extra}</div>
          </div>
        )}

        {/* 버튼 영역 */}
        {template.buttons && template.buttons.length > 0 && (
          <div className="space-y-2 mt-4">
            {template.buttons.map((button, index) => (
              <button
                key={index}
                className={`w-full py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                  index === 0
                    ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                    : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {getButtonIcon(button.buttonType)}
                <span>{button.buttonName}</span>
              </button>
            ))}
          </div>
        )}

        {/* 바로연결 (Quick Replies) */}
        {template.quickReplies && template.quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
            {template.quickReplies.map((reply, index) => (
              <button
                key={index}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
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

      {/* 카카오톡 하단 */}
      <div className="bg-[#9EADBB] px-4 py-2 rounded-b-2xl">
        <div className="text-white/50 text-[10px] text-center">
          알림톡 메시지
        </div>
      </div>

      {/* 템플릿 정보 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="font-medium">메시지 유형:</span>
            <span>
              {template.messageType === 'BA' && '기본형'}
              {template.messageType === 'EX' && '부가정보형'}
              {template.messageType === 'AD' && '광고추가형'}
              {template.messageType === 'MI' && '복합형'}
            </span>
          </div>
          {template.emphasizeType && template.emphasizeType !== 'NONE' && (
            <div className="flex justify-between">
              <span className="font-medium">강조 유형:</span>
              <span>
                {template.emphasizeType === 'TEXT' && '강조표기형'}
                {template.emphasizeType === 'IMAGE' && '이미지형'}
                {template.emphasizeType === 'ITEM_LIST' && '아이템리스트형'}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-medium">버튼 수:</span>
            <span>{template.buttons?.length || 0}개</span>
          </div>
          {template.quickReplies && template.quickReplies.length > 0 && (
            <div className="flex justify-between">
              <span className="font-medium">바로연결:</span>
              <span>{template.quickReplies.length}개</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KakaoTemplatePreview;
