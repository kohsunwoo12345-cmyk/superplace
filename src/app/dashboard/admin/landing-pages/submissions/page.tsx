"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Search,
  Users,
  Calendar,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";

interface Submission {
  id: number;
  slug: string;
  data: Record<string, any>;
  submitted_at: string;
  ip_address: string;
  user_agent: string;
}

export default function SubmissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams?.get("slug");

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, [slug]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = slug
        ? `/api/landing/submit?slug=${slug}`
        : "/api/landing/submit";
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setSubmissions(result.submissions || []);
      }
    } catch (error) {
      console.error("신청자 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (submissions.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    // CSV 헤더 생성
    const headers = ["ID", "제출일시", "IP 주소"];
    const dataKeys = Object.keys(submissions[0].data);
    headers.push(...dataKeys);

    // CSV 본문 생성
    const rows = submissions.map((sub) => {
      const row = [
        sub.id,
        new Date(sub.submitted_at).toLocaleString("ko-KR"),
        sub.ip_address,
      ];
      dataKeys.forEach((key) => {
        row.push(sub.data[key] || "");
      });
      return row.join(",");
    });

    // CSV 다운로드
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `submissions_${slug || "all"}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const searchLower = searchTerm.toLowerCase();
    return Object.values(sub.data).some(
      (value) =>
        value && value.toString().toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            <div>
              <h1 className="text-3xl font-bold">신청자 관리</h1>
              <p className="text-gray-600 mt-1">
                {slug
                  ? `${slug} 페이지의 신청자 목록`
                  : "전체 랜딩페이지 신청자 목록"}
              </p>
            </div>
          </div>
          <Button
            onClick={downloadCSV}
            disabled={submissions.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV 다운로드
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 신청자</p>
                  <p className="text-3xl font-bold text-indigo-600 mt-1">
                    {submissions.length}
                  </p>
                </div>
                <Users className="w-10 h-10 text-indigo-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">오늘 신청</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {
                      submissions.filter((sub) => {
                        const today = new Date().toDateString();
                        const subDate = new Date(sub.submitted_at).toDateString();
                        return today === subDate;
                      }).length
                    }
                  </p>
                </div>
                <Calendar className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">최근 신청</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {submissions.length > 0
                      ? new Date(
                          submissions[submissions.length - 1].submitted_at
                        ).toLocaleString("ko-KR")
                      : "없음"}
                  </p>
                </div>
                <Mail className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="신청자 정보 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* 신청자 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>신청자 목록</CardTitle>
            <CardDescription>
              총 {filteredSubmissions.length}명의 신청자
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">
                  {searchTerm
                    ? "검색 결과가 없습니다."
                    : "아직 신청자가 없습니다."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((submission) => (
                  <Card key={submission.id} className="border-l-4 border-l-indigo-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                              #{submission.id}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(submission.submitted_at).toLocaleString("ko-KR")}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            IP: {submission.ip_address}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(submission.data).map(([key, value]) => (
                          <div key={key} className="border-l-2 border-gray-200 pl-3">
                            <p className="text-xs text-gray-500 mb-1">{key}</p>
                            <p className="font-medium text-gray-900">
                              {typeof value === "boolean"
                                ? value
                                  ? "예"
                                  : "아니오"
                                : value || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
