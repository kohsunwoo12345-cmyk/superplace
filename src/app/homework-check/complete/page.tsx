"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home } from "lucide-react";

export default function HomeworkCompletePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl text-green-700">
            오늘도 수고했어요! 🎉
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-lg text-gray-700">
              출석 체크와 숙제 제출이 완료되었습니다
            </p>
            <p className="text-sm text-gray-500">
              선생님께서 결과를 확인하실 거예요
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border-2 border-green-200">
            <p className="text-2xl mb-2">✨</p>
            <p className="font-medium text-gray-700">
              내일도 열심히 공부해요!
            </p>
          </div>

          <Button
            onClick={() => router.push("/")}
            className="w-full"
            size="lg"
          >
            <Home className="w-5 h-5 mr-2" />
            홈으로
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
