"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, Eye, MessageSquare, Sparkles, Loader2 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Mock data
const mockData = [
  { name: "월", 조회수: 4000, 참여: 2400, 전환: 240 },
  { name: "화", 조회수: 3000, 참여: 1398, 전환: 221 },
  { name: "수", 조회수: 2000, 참여: 9800, 전환: 290 },
  { name: "목", 조회수: 2780, 참여: 3908, 전환: 200 },
  { name: "금", 조회수: 1890, 참여: 4800, 전환: 181 },
  { name: "토", 조회수: 2390, 참여: 3800, 전환: 250 },
  { name: "일", 조회수: 3490, 참여: 4300, 전환: 210 },
];

export default function AnalyticsPage() {
  const [platform, setPlatform] = useState("all");
  const [timeframe, setTimeframe] = useState("7days");
  const [insights, setInsights] = useState<string[] | null>(null);
  const [recommendations, setRecommendations] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/analytics/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          timeframe,
          metrics: {
            총조회수: 19550,
            총참여: 30206,
            전환수: 1592,
            평균참여율: 15.4,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error("Failed to generate insights:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateInsights();
  }, [platform, timeframe]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">분석</h1>
        <p className="text-muted-foreground mt-2">
          통합 마케팅 성과를 확인하고 AI 인사이트를 받으세요
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 플랫폼</SelectItem>
            <SelectItem value="naver-blog">네이버 블로그</SelectItem>
            <SelectItem value="naver-place">네이버 플레이스</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="karrot">당근마켓</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">최근 7일</SelectItem>
            <SelectItem value="30days">최근 30일</SelectItem>
            <SelectItem value="90days">최근 90일</SelectItem>
            <SelectItem value="1year">최근 1년</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 조회수</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">19,550</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> 지난 주 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 참여</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30,206</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.1%</span> 지난 주 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전환수</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,592</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18.2%</span> 지난 주 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 참여율</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15.4%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">-2.3%</span> 지난 주 대비
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>일별 조회수 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="조회수" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>참여 & 전환</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="참여" fill="#8884d8" />
                <Bar dataKey="전환" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI 인사이트
              </CardTitle>
              <CardDescription>
                AI가 분석한 주요 인사이트와 추천사항
              </CardDescription>
            </div>
            <Button onClick={generateInsights} disabled={loading} size="sm">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  새로고침
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {insights && insights.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">📊 주요 인사이트</h4>
              <ul className="space-y-2">
                {insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendations && recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">💡 추천사항</h4>
              <ul className="space-y-2">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!insights && !recommendations && (
            <p className="text-sm text-muted-foreground text-center py-4">
              분석 중입니다...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
