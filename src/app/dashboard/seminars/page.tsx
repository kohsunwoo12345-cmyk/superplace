"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, Search, Filter } from "lucide-react";

interface Seminar {
  id: string;
  title: string;
  description: string;
  mainImage: string;
  instructor: string;
  date: string;
  time: string;
  location: string;
  locationType: string;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
  createdAt: string;
}

export default function SeminarsPage() {
  const router = useRouter();
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSeminars();
  }, [filter]);

  const fetchSeminars = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      let url = "/api/seminars?";
      if (filter === "upcoming") {
        url += "status=upcoming";
      } else if (filter === "completed") {
        url += "status=completed";
      } else if (filter === "cancelled") {
        url += "status=cancelled";
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSeminars(data.seminars || []);
      } else {
        console.error("Failed to fetch seminars");
      }
    } catch (error) {
      console.error("Error fetching seminars:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSeminars = seminars.filter((seminar) => {
    if (searchQuery) {
      return (
        seminar.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seminar.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seminar.instructor.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-green-500">모집중</Badge>;
      case "completed":
        return <Badge className="bg-gray-500">종료</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">취소</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRegistrationStatus = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return "마감";
    if (percentage >= 80) return "마감 임박";
    return "신청 가능";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">세미나</h1>
          <p className="text-gray-600 mt-1">전문가 세미나 및 워크샵</p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="세미나 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
                size="sm"
              >
                전체
              </Button>
              <Button
                variant={filter === "upcoming" ? "default" : "outline"}
                onClick={() => setFilter("upcoming")}
                size="sm"
              >
                진행 예정
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                onClick={() => setFilter("completed")}
                size="sm"
              >
                종료
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Seminars Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSeminars.map((seminar) => (
            <Card
              key={seminar.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/seminars/detail?id=${seminar.id}`)}
            >
              {/* 세미나 이미지 */}
              {seminar.mainImage && (
                <div className="w-full h-48 overflow-hidden">
                  <img
                    src={seminar.mainImage}
                    alt={seminar.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {seminar.title}
                  </CardTitle>
                  {getStatusBadge(seminar.status)}
                </div>
                <CardDescription className="line-clamp-2">
                  {seminar.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(seminar.date).toLocaleDateString("ko-KR")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{seminar.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{seminar.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>
                      {seminar.currentParticipants}/{seminar.maxParticipants}명
                    </span>
                  </div>
                </div>

                {/* 신청률 프로그레스 바 */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-600">신청 현황</span>
                    <span className="font-medium">
                      {getRegistrationStatus(
                        seminar.currentParticipants,
                        seminar.maxParticipants
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        (seminar.currentParticipants / seminar.maxParticipants) *
                          100 >=
                        100
                          ? "bg-red-500"
                          : (seminar.currentParticipants /
                              seminar.maxParticipants) *
                              100 >=
                            80
                          ? "bg-orange-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          (seminar.currentParticipants /
                            seminar.maxParticipants) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* 신청하기 버튼 */}
                <Button
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/seminars/detail?id=${seminar.id}`);
                  }}
                  disabled={
                    seminar.status !== "upcoming" ||
                    seminar.currentParticipants >= seminar.maxParticipants
                  }
                >
                  {seminar.status !== "upcoming"
                    ? "종료된 세미나"
                    : seminar.currentParticipants >= seminar.maxParticipants
                    ? "신청 마감"
                    : "자세히 보기"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredSeminars.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">세미나가 없습니다</h3>
            <p className="text-gray-600">
              {searchQuery
                ? "검색 결과가 없습니다."
                : "등록된 세미나가 없습니다."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
