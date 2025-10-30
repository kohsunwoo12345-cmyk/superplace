"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Sparkles, Calendar, TrendingUp, Users, Eye } from "lucide-react";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("monthly");
  const [platform, setPlatform] = useState("all");

  const reports = [
    {
      id: 1,
      title: "2024년 12월 월간 리포트",
      type: "월간",
      date: "2024-12-01",
      platforms: ["네이버", "Instagram", "YouTube"],
      summary: "전체 조회수 45.2K, 참여율 18.5%, 전환 1,892건",
    },
    {
      id: 2,
      title: "2024년 11월 월간 리포트",
      type: "월간",
      date: "2024-11-01",
      platforms: ["전체"],
      summary: "전체 조회수 38.1K, 참여율 16.2%, 전환 1,534건",
    },
    {
      id: 3,
      title: "2024 Q4 분기 리포트",
      type: "분기",
      date: "2024-10-01",
      platforms: ["전체"],
      summary: "분기 조회수 128.3K, 참여율 17.1%, 전환 5,234건",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">리포트</h1>
        <p className="text-muted-foreground mt-2">
          자동 생성된 마케팅 리포트를 확인하고 다운로드하세요
        </p>
      </div>

      {/* Generate Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI 리포트 생성
          </CardTitle>
          <CardDescription>
            설정에 따라 AI가 자동으로 마케팅 리포트를 생성합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">리포트 유형</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">주간 리포트</SelectItem>
                  <SelectItem value="monthly">월간 리포트</SelectItem>
                  <SelectItem value="quarterly">분기 리포트</SelectItem>
                  <SelectItem value="yearly">연간 리포트</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">플랫폼</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 플랫폼</SelectItem>
                  <SelectItem value="naver">네이버</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="karrot">당근마켓</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full" size="lg">
            <Sparkles className="mr-2 h-4 w-4" />
            AI 리포트 생성하기
          </Button>
        </CardContent>
      </Card>

      {/* Report List */}
      <Card>
        <CardHeader>
          <CardTitle>생성된 리포트</CardTitle>
          <CardDescription>
            지난 리포트 목록 및 다운로드
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="border rounded-lg p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{report.title}</h3>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {report.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {report.summary}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(report.date).toLocaleDateString("ko-KR")}
                      </span>
                      <span>
                        플랫폼: {report.platforms.join(", ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              이번 달 리포트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">1</span>
              <span className="text-sm text-muted-foreground">개</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 생성 리포트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{reports.length}</span>
              <span className="text-sm text-muted-foreground">개</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              다음 리포트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">2025년 1월 1일</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
