"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GradesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">성적 관리</h1>
        <p className="text-gray-600">학생들의 성적을 입력하고 분석합니다</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            성적 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">준비 중입니다</h3>
            <p className="text-gray-600 mb-6">
              성적 관리 기능이 곧 추가될 예정입니다.
            </p>
            <Button disabled>
              <FileText className="w-4 h-4 mr-2" />
              성적 입력
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
