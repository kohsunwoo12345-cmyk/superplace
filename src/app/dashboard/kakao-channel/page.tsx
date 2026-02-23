"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Plus, Check, Clock, AlertCircle } from "lucide-react";

interface KakaoChannel {
  channelId: string;
  phoneNumber: string;
  channelName: string;
  status: string;
  createdAt?: string;
}

export default function KakaoChannelDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<KakaoChannel[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);
    loadChannels();
  }, [router]);

  const loadChannels = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/kakao/channels/my", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
      }
    } catch (error) {
      console.error("Failed to load channels:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" />
            승인됨
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            대기중
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            거부됨
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const approvedChannels = channels.filter((c) => c.status === "APPROVED");

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-yellow-600" />
              카카오 채널 관리
            </h1>
            <p className="text-gray-600 mt-2">
              카카오 채널을 등록하고 메시지를 발송하세요
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 채널 등록 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-yellow-200 hover:border-yellow-400"
                onClick={() => router.push("/dashboard/kakao-channel/register")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Plus className="w-5 h-5" />
                카카오 채널 등록
              </CardTitle>
              <CardDescription>
                새로운 카카오톡 채널을 등록 신청합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
                채널 등록하기
              </Button>
            </CardContent>
          </Card>

          {/* 메시지 발송 */}
          <Card className={`hover:shadow-lg transition-shadow ${
            approvedChannels.length > 0 
              ? "cursor-pointer border-2 border-orange-200 hover:border-orange-400" 
              : "opacity-60 cursor-not-allowed border-2 border-gray-200"
          }`}
                onClick={() => {
                  if (approvedChannels.length > 0) {
                    router.push("/dashboard/kakao-channel/send");
                  }
                }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Send className="w-5 h-5" />
                카카오 메시지 발송
              </CardTitle>
              <CardDescription>
                승인된 채널로 카카오톡 메시지를 발송합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={approvedChannels.length === 0}
              >
                {approvedChannels.length > 0 ? "메시지 발송하기" : "승인된 채널 없음"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Channels List */}
        <Card>
          <CardHeader>
            <CardTitle>등록된 채널 목록</CardTitle>
            <CardDescription>
              총 {channels.length}개의 채널이 등록되어 있습니다
              {approvedChannels.length > 0 && ` (승인됨: ${approvedChannels.length}개)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                채널 정보를 불러오는 중...
              </div>
            ) : channels.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  등록된 카카오 채널이 없습니다
                </p>
                <Button
                  onClick={() => router.push("/dashboard/kakao-channel/register")}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  첫 채널 등록하기
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {channels.map((channel) => (
                  <div
                    key={channel.channelId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-yellow-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {channel.channelName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {channel.phoneNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(channel.status)}
                      {channel.status === "APPROVED" && (
                        <Button
                          size="sm"
                          onClick={() => router.push("/dashboard/kakao-channel/send")}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          발송하기
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">💡 도움말</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>• 카카오 채널 등록 신청 후 승인까지 1-2일 정도 소요됩니다</p>
            <p>• 승인된 채널만 메시지 발송이 가능합니다</p>
            <p>• 카카오 메시지는 SMS보다 저렴한 비용으로 발송 가능합니다 (15 포인트/건)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
