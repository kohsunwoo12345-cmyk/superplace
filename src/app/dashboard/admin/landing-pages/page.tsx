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
  Users,
  QrCode,
  RefreshCw,
  Download,
  FolderOpen,
} from "lucide-react";

interface LandingPage {
  id: string;
  slug: string;
  studentId?: number;
  studentName?: string;
  title: string;
  subtitle?: string;
  url: string;
  createdAt: string;
  viewCount: number;
  submissions?: number;
  isActive: boolean;
  qr_code_url?: string;
  folder_id?: string;
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

  const downloadQRCode = (qr_code_url: string, title: string) => {
    if (!qr_code_url) {
      alert("QR 코드 URL이 없습니다.");
      return;
    }
    // QR 코드 다운로드
    const link = document.createElement("a");
    link.href = qr_code_url;
    link.download = `qr_${title}_${Date.now()}.png`;
    link.click();
  };

  const clearCache = () => {
    if (confirm("모든 캐시를 초기화하시겠습니까?")) {
      localStorage.removeItem("landing_pages_cache");
      alert("캐시가 초기화되었습니다.");
      fetchLandingPages();
    }
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
              랜딩페이지 관리
            </h1>
            <p className="text-gray-600 mt-1">
              학생의 학습 데이터를 학부모에게 공유하거나 이벤트/세미나 신청을 받을 수 있습니다
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCache}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              캐시 초기화
            </Button>
            <Button
              onClick={() => router.push("/dashboard/admin/landing-pages/folders")}
              variant="outline"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              폴더 관리
            </Button>
            <Button
              onClick={() => router.push("/dashboard/admin/landing-pages/builder")}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              새 랜딩페이지 만들기
            </Button>
          </div>
        </div>

        {/* 탭 메뉴 제거 - 헤더 버튼으로 통합 */}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                총 신청자
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {landingPages.reduce((sum, lp) => sum + (lp.submissions || 0), 0)}명
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
                      <CardDescription className="flex items-center gap-4 text-sm flex-wrap">
                        {page.studentName && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {page.studentName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(page.createdAt).toLocaleDateString("ko-KR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          조회 {page.viewCount}회
                        </span>
                        {page.submissions !== undefined && (
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            신청 {page.submissions}명
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
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
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/dashboard/admin/landing-pages/submissions?slug=${page.slug}`
                          )
                        }
                      >
                        <Users className="w-4 h-4 mr-1" />
                        신청자 보기
                      </Button>
                      {page.qr_code_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadQRCode(page.qr_code_url!, page.title)}
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          QR 다운로드
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteLandingPage(page.id)}
                        className="text-red-600 hover:bg-red-50 ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
