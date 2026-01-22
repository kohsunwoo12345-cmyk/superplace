"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AssignmentsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">과제 관리</h1>
        <p className="text-gray-600">학생들의 과제를 관리하고 피드백을 제공합니다</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            과제 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">준비 중입니다</h3>
            <p className="text-gray-600 mb-6">
              과제 관리 기능이 곧 추가될 예정입니다.
            </p>
            <Button disabled>
              <Plus className="w-4 h-4 mr-2" />
              과제 추가
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
