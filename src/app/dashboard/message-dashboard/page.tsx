"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, History, UserPlus, Coins } from "lucide-react";

export default function MessageDashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            SMS 문자 발송
          </h1>
          <p className="text-gray-600 mt-2">
            SMS 문자 메시지를 발송하고 관리합니다
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 문자 발송 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200 hover:border-blue-400"
                onClick={() => router.push("/dashboard/message-send")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Send className="w-5 h-5" />
                SMS 문자 발송
              </CardTitle>
              <CardDescription>
                SMS/LMS 문자 메시지를 발송합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                문자 발송하기
              </Button>
              <p className="text-sm text-gray-500 mt-3">
                비용: SMS 40P/건, LMS 95P/건
              </p>
            </CardContent>
          </Card>

          {/* 발송 이력 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-cyan-200 hover:border-cyan-400"
                onClick={() => router.push("/dashboard/message-history")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-700">
                <History className="w-5 h-5" />
                발송 이력
              </CardTitle>
              <CardDescription>
                발송한 문자 메시지 내역을 확인합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white">
                이력 확인하기
              </Button>
            </CardContent>
          </Card>

          {/* 발신번호 등록 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-sky-200 hover:border-sky-400"
                onClick={() => router.push("/dashboard/sender-number-register")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sky-700">
                <UserPlus className="w-5 h-5" />
                발신번호 등록
              </CardTitle>
              <CardDescription>
                문자 발송에 사용할 발신번호를 등록합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white">
                발신번호 등록하기
              </Button>
            </CardContent>
          </Card>

          {/* 포인트 충전 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200 hover:border-green-400"
                onClick={() => router.push("/dashboard/point-charge")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Coins className="w-5 h-5" />
                포인트 충전
              </CardTitle>
              <CardDescription>
                문자 발송을 위한 포인트를 충전합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                포인트 충전하기
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">💡 SMS 문자 발송 안내</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>• <strong>SMS</strong>: 최대 90바이트 (한글 45자) - 40P/건</p>
            <p>• <strong>LMS</strong>: 90바이트 초과 ~ 2,000바이트 (한글 1,000자) - 95P/건</p>
            <p>• 발신번호는 사전에 등록 및 승인되어야 합니다</p>
            <p>• 변수 사용 가능: {`{{학생명}}, {{학부모명}}, {{성적}}, {{URL}}`} 등</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
