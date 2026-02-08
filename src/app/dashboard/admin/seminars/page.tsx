"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Presentation, Calendar, Users, MapPin, Plus, Edit, Video, FileText } from "lucide-react";

export default function SeminarsPage() {
  const upcomingSeminars = [
    {
      id: 1,
      title: "AI 기반 학습 관리 시스템 활용법",
      date: "2026-02-15",
      time: "14:00-16:00",
      location: "온라인 (Zoom)",
      instructor: "김선생님",
      participants: 45,
      maxParticipants: 100,
      status: "모집중",
    },
    {
      id: 2,
      title: "학생 데이터 분석 및 학습 성과 향상",
      date: "2026-02-20",
      time: "15:00-17:00",
      location: "서울 강남구 본사",
      instructor: "이교수님",
      participants: 32,
      maxParticipants: 50,
      status: "모집중",
    },
    {
      id: 3,
      title: "출석 및 숙제 관리 고급 기능",
      date: "2026-02-25",
      time: "10:00-12:00",
      location: "온라인 (Google Meet)",
      instructor: "박강사님",
      participants: 78,
      maxParticipants: 150,
      status: "모집중",
    },
  ];

  const pastSeminars = [
    {
      id: 4,
      title: "플랫폼 시작하기: 기본 설정",
      date: "2026-01-15",
      participants: 120,
      recording: true,
      materials: true,
    },
    {
      id: 5,
      title: "학부모 소통 전략",
      date: "2026-01-08",
      participants: 95,
      recording: true,
      materials: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Presentation className="h-8 w-8 text-blue-600" />
            교육 세미나
          </h1>
          <p className="text-gray-600 mt-1">교육 프로그램 및 세미나 관리</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          새 세미나 등록
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-2 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">예정된 세미나</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">3개</div>
            <p className="text-sm text-gray-500 mt-2">이번 달</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 참가자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">155명</div>
            <p className="text-sm text-gray-500 mt-2">신청 완료</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">완료된 세미나</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">12개</div>
            <p className="text-sm text-gray-500 mt-2">올해</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">평균 만족도</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">4.8</div>
            <p className="text-sm text-gray-500 mt-2">5점 만점</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Seminars */}
      <Card>
        <CardHeader>
          <CardTitle>예정된 세미나</CardTitle>
          <CardDescription>다가오는 교육 일정</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingSeminars.map((seminar) => (
              <div
                key={seminar.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{seminar.title}</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{seminar.date} {seminar.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{seminar.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>
                          {seminar.participants}/{seminar.maxParticipants}명 ({seminar.instructor})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                      {seminar.status}
                    </span>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      수정
                    </Button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(seminar.participants / seminar.maxParticipants) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round((seminar.participants / seminar.maxParticipants) * 100)}% 신청 완료
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Past Seminars */}
      <Card>
        <CardHeader>
          <CardTitle>지난 세미나</CardTitle>
          <CardDescription>완료된 교육 프로그램</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pastSeminars.map((seminar) => (
              <div
                key={seminar.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-semibold">{seminar.title}</h3>
                  <p className="text-sm text-gray-600">
                    {seminar.date} · {seminar.participants}명 참가
                  </p>
                </div>
                <div className="flex gap-2">
                  {seminar.recording && (
                    <Button variant="outline" size="sm">
                      <Video className="w-4 h-4 mr-1" />
                      녹화본
                    </Button>
                  )}
                  {seminar.materials && (
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-1" />
                      자료
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
