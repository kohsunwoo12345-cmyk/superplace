"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Heart,
  MessageCircle,
  ArrowUpRight,
  Plus,
} from "lucide-react";

export default function DashboardPage() {
  // Mock data - in production, this would come from your API
  const stats = [
    {
      title: "총 조회수",
      value: "124,582",
      change: "+12.5%",
      trend: "up",
      icon: Eye,
    },
    {
      title: "총 참여도",
      value: "8,432",
      change: "+8.2%",
      trend: "up",
      icon: Heart,
    },
    {
      title: "댓글/리뷰",
      value: "1,234",
      change: "+23.1%",
      trend: "up",
      icon: MessageCircle,
    },
    {
      title: "신규 팔로워",
      value: "892",
      change: "-4.3%",
      trend: "down",
      icon: Users,
    },
  ];

  const platforms = [
    {
      name: "네이버 블로그",
      posts: 15,
      views: 45200,
      engagement: 1234,
      connected: true,
    },
    {
      name: "네이버 플레이스",
      reviews: 89,
      rating: 4.8,
      views: 12340,
      connected: true,
    },
    {
      name: "인스타그램",
      posts: 42,
      followers: 8520,
      engagement: 2341,
      connected: false,
    },
    {
      name: "유튜브",
      videos: 23,
      views: 156700,
      subscribers: 3450,
      connected: true,
    },
    {
      name: "틱톡",
      videos: 18,
      views: 234500,
      likes: 45600,
      connected: false,
    },
    {
      name: "당근마켓",
      products: 12,
      views: 8900,
      chats: 234,
      connected: true,
    },
  ];

  const recentActivity = [
    {
      platform: "네이버 블로그",
      action: "새 게시글 발행",
      title: "2024년 마케팅 트렌드 분석",
      time: "5분 전",
    },
    {
      platform: "인스타그램",
      action: "댓글 작성됨",
      title: "새로운 제품 출시 공지",
      time: "1시간 전",
    },
    {
      platform: "유튜브",
      action: "새 영상 업로드",
      title: "브랜드 소개 영상",
      time: "3시간 전",
    },
    {
      platform: "네이버 플레이스",
      action: "새 리뷰 등록",
      title: "★★★★★ 매우 만족합니다",
      time: "5시간 전",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">대시보드</h1>
          <p className="text-gray-600 mt-1">
            모든 플랫폼의 통합 성과를 확인하세요
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          플랫폼 연결
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-sm mt-1">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span
                  className={
                    stat.trend === "up" ? "text-green-500" : "text-red-500"
                  }
                >
                  {stat.change}
                </span>
                <span className="text-gray-500 ml-1">지난 주 대비</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>플랫폼 현황</CardTitle>
            <CardDescription>연결된 플랫폼의 주요 지표</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platforms.map((platform) => (
                <div
                  key={platform.name}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{platform.name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          platform.connected
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {platform.connected ? "연결됨" : "미연결"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {Object.entries(platform)
                        .filter(
                          ([key]) =>
                            key !== "name" && key !== "connected"
                        )
                        .slice(0, 2)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" • ")}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>실시간 플랫폼 활동 내역</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary">
                        {activity.platform}
                      </span>
                      <span className="text-xs text-gray-500">
                        {activity.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {activity.action}
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {activity.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 시작</CardTitle>
          <CardDescription>자주 사용하는 기능에 빠르게 접근하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <Plus className="h-6 w-6" />
              <span>플랫폼 연결</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <MessageCircle className="h-6 w-6" />
              <span>댓글 관리</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              <span>분석 보기</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <Eye className="h-6 w-6" />
              <span>리포트 생성</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
