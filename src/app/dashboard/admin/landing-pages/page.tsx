"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileText,
  Calendar,
  User,
  ExternalLink,
  Copy,
  Trash2,
  Loader2,
  GraduationCap,
  Check,
} from "lucide-react";

interface LandingPage {
  id: string;
  studentId: number;
  studentName: string;
  title: string;
  url: string;
  createdAt: string;
  viewCount: number;
  isActive: boolean;
}

export default function LandingPagesPage() {
  const router = useRouter();
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLandingPages();
  }, []);

  const fetchLandingPages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/landing-pages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLandingPages(data.landingPages || []);
      }
    } catch (error) {
      console.error("랜딩페이지 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = (url: string, id: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteLandingPage = async (id: string) => {
    if (!confirm("이 랜딩페이지를 삭제하시겠습니까?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/landing-pages/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("랜딩페이지가 삭제되었습니다.");
        fetchLandingPages();
      } else {
        throw new Error("삭제 실패");
      }
    } catch (error) {
      console.error("랜딩페이지 삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              학습 리포트 랜딩페이지 관리
            </h1>
            <p className="text-gray-600 mt-1">
              학생의 학습 데이터를 학부모에게 공유할 수 있는 랜딩페이지를 제작하고 관리합니다
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/admin/landing-pages/create")}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 랜딩페이지 만들기
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                총 랜딩페이지
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">
                {landingPages.length}개
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                활성 페이지
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {landingPages.filter((lp) => lp.isActive).length}개
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                총 조회수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {landingPages.reduce((sum, lp) => sum + lp.viewCount, 0)}회
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 랜딩페이지 목록 */}
        <div className="space-y-4">
          {landingPages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">아직 생성된 랜딩페이지가 없습니다.</p>
                <Button
                  onClick={() => router.push("/dashboard/admin/landing-pages/create")}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  첫 랜딩페이지 만들기
                </Button>
              </CardContent>
            </Card>
          ) : (
            landingPages.map((page) => (
              <Card key={page.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{page.title}</CardTitle>
                        <Badge variant={page.isActive ? "default" : "secondary"}>
                          {page.isActive ? "활성" : "비활성"}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {page.studentName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(page.createdAt).toLocaleDateString("ko-KR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          조회 {page.viewCount}회
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-lg px-4 py-2 font-mono text-sm overflow-x-auto">
                      {window.location.origin}{page.url}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyUrl(page.url, page.id)}
                    >
                      {copiedId === page.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(page.url, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteLandingPage(page.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
