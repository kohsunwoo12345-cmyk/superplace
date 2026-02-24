'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, CheckCircle, BookOpen, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface KakaoChannel {
  searchId: string;
  phoneNumber: string;
  categoryCode: string;
  pfId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function KakaoChannelPage() {
  const [channels, setChannels] = useState<KakaoChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/kakao/channels/list');
      const data = await response.json();
      if (data.success) {
        setChannels(data.channels);
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">카카오톡 채널 관리</h1>
          <p className="text-gray-600 mt-2">알림톡 발송을 위한 카카오 채널을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/kakao-business-guide" target="_blank">
            <Button variant="outline">
              <BookOpen className="w-4 h-4 mr-2" />
              연동 가이드
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </Link>
          <Link href="/dashboard/kakao-channel/register">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              채널 추가
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">채널 목록을 불러오는 중...</p>
        </div>
      ) : channels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">등록된 채널이 없습니다</h3>
            <p className="text-gray-600 mb-4">
              카카오톡 채널을 등록하여 알림톡을 발송할 수 있습니다
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/dashboard/kakao-business-guide" target="_blank">
                <Button variant="outline">
                  <BookOpen className="w-4 h-4 mr-2" />
                  연동 가이드
                </Button>
              </Link>
              <Link href="/dashboard/kakao-channel/register">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  첫 채널 등록하기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <Card key={channel.pfId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">@{channel.searchId}</CardTitle>
                    <CardDescription>{channel.phoneNumber}</CardDescription>
                  </div>
                  {channel.status === 'active' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">pfId:</span>
                    <span className="font-mono text-xs">{channel.pfId.substring(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">카테고리:</span>
                    <span>{channel.categoryCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">등록일:</span>
                    <span>{new Date(channel.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link href={`/dashboard/kakao-alimtalk?pfId=${channel.pfId}`}>
                    <Button className="w-full" variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      알림톡 보내기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
