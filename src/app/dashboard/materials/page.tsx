"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MaterialsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">학습 자료</h1>
        <p className="text-gray-600">학생들에게 제공할 학습 자료를 관리합니다</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            학습 자료 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">준비 중입니다</h3>
            <p className="text-gray-600 mb-6">
              학습 자료 관리 기능이 곧 추가될 예정입니다.
            </p>
            <Button disabled>
              <Upload className="w-4 h-4 mr-2" />
              자료 업로드
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
