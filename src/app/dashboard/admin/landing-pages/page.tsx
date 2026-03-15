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
  FileCode,
  Edit,
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
  folderName?: string;
}

interface Folder {
  id: string;
  name: string;
  pagesCount: number;
}

export default function LandingPagesPage() {
  const router = useRouter();
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    // 사용자 역할 확인
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUserRole(userData.role || "");
      } catch (error) {
        console.error("사용자 정보 파싱 실패:", error);
      }
    }
    fetchLandingPages();
    fetchFolders();
  }, []);

  const fetchLandingPages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      console.log('🔍 Fetching landing pages with token:', token ? 'exists' : 'missing');
      
      const response = await fetch("/api/admin/landing-pages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📊 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Landing pages data:', data);
        console.log('📋 Landing pages count:', data.landingPages?.length || 0);
        setLandingPages(data.landingPages || []);
      } else {
        console.error('❌ Response not OK:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error data:', errorData);
      }
    } catch (error) {
      console.error("랜딩페이지 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/landing/folders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error("폴더 목록 조회 실패:", error);
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
    // 카카오 공유 디버거로 이동
    window.open("https://developers.kakao.com/tool/debugger/sharing", "_blank");
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

  // 폴더별 필터링
  const filteredPages = selectedFolder === "all"
    ? landingPages
    : selectedFolder === "no-folder"
    ? landingPages.filter((page) => !page.folder_id)
    : landingPages.filter((page) => page.folder_id === selectedFolder);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3 text-indigo-700">
                <GraduationCap className="h-10 w-10" />
                📋 랜딩페이지 관리
              </h1>
              <p className="text-gray-600 mt-3 text-lg">
                학생의 학습 데이터를 학부모에게 공유하거나 이벤트/세미나 신청을 받을 수 있습니다
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                variant="outline"
                size="lg"
                onClick={clearCache}
                className="border-2 hover:border-indigo-400"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                캐시 초기화
              </Button>
              <Button
                onClick={() => router.push("/dashboard/admin/landing-pages/folders")}
                variant="outline"
                size="lg"
                className="border-2 border-green-300 hover:border-green-500 hover:bg-green-50"
              >
                <FolderOpen className="w-5 h-5 mr-2" />
                📁 폴더 관리
              </Button>
              {/* 템플릿 관리는 ADMIN만 표시 */}
              {userRole !== "DIRECTOR" && (
                <Button
                  onClick={() => router.push("/dashboard/admin/landing-pages/templates")}
                  variant="outline"
                  size="lg"
                  className="border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50"
                >
                  <FileCode className="w-5 h-5 mr-2" />
                  📄 HTML 템플릿 관리
                </Button>
              )}
              <Button
                onClick={() => router.push("/dashboard/admin/landing-pages/create")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                ✨ 새 학습 리포트 만들기
              </Button>
            </div>
          </div>
        </div>

        {/* 빠른 가이드 배너 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-3">🚀 빠른 시작 가이드</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white/10 rounded p-3">
              <p className="font-semibold mb-1">1️⃣ HTML 템플릿</p>
              <p className="text-sm">"📄 HTML 템플릿 관리"에서 템플릿 제작</p>
            </div>
            <div className="bg-white/10 rounded p-3">
              <p className="font-semibold mb-1">2️⃣ 랜딩페이지 생성</p>
              <p className="text-sm">학생 선택, 기간 설정, 템플릿 선택</p>
            </div>
            <div className="bg-white/10 rounded p-3">
              <p className="font-semibold mb-1">3️⃣ 데이터 자동 삽입</p>
              <p className="text-sm">선택 기간의 학습 데이터 표시</p>
            </div>
            <div className="bg-white/10 rounded p-3">
              <p className="font-semibold mb-1">4️⃣ URL 공유</p>
              <p className="text-sm">생성된 링크 복사 및 공유</p>
            </div>
            <div className="bg-white/10 rounded p-3">
              <p className="font-semibold mb-1">5️⃣ 데이터 확인</p>
              <p className="text-sm">조회수 및 신청자 보기</p>
            </div>
          </div>
        </div>

        {/* 폴더 필터 */}
        {folders.length > 0 && (
          <Card className="border-2 border-green-300 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <FolderOpen className="w-5 h-5" />
                📁 폴더별 필터
              </CardTitle>
              <CardDescription className="text-green-700">
                각 사용자가 제작한 랜딩페이지를 폴더별로 분류하여 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedFolder === "all" ? "default" : "outline"}
                  onClick={() => setSelectedFolder("all")}
                  className={selectedFolder === "all" ? "bg-green-600 hover:bg-green-700" : "border-green-300 hover:bg-green-100"}
                >
                  전체 ({landingPages.length})
                </Button>
                <Button
                  variant={selectedFolder === "no-folder" ? "default" : "outline"}
                  onClick={() => setSelectedFolder("no-folder")}
                  className={selectedFolder === "no-folder" ? "bg-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"}
                >
                  미분류 ({landingPages.filter((p) => !p.folder_id).length})
                </Button>
                {folders.map((folder) => (
                  <Button
                    key={folder.id}
                    variant={selectedFolder === folder.id ? "default" : "outline"}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={selectedFolder === folder.id ? "bg-indigo-600 hover:bg-indigo-700" : "border-indigo-300 hover:bg-indigo-100"}
                  >
                    📂 {folder.name} ({landingPages.filter((p) => p.folder_id === folder.id).length})
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
          {/* 디버그 정보 표시 */}
          {landingPages.length === 0 && !loading && (
            <Card className="border-2 border-yellow-300 bg-yellow-50">
              <CardContent className="py-4">
                <p className="text-yellow-800 font-semibold mb-2">🔍 디버그 정보</p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 로딩 상태: {loading ? '로딩 중' : '완료'}</li>
                  <li>• 전체 랜딩페이지 수: {landingPages.length}개</li>
                  <li>• 필터링된 페이지 수: {filteredPages.length}개</li>
                  <li>• 토큰 존재: {typeof window !== 'undefined' && localStorage.getItem('token') ? '있음' : '없음'}</li>
                  <li className="font-bold text-yellow-900 mt-2">
                    💡 데이터가 보이지 않는다면 브라우저 콘솔(F12)을 열어 에러를 확인하거나, 
                    "캐시 초기화" 버튼을 클릭 후 다시 로그인해주세요.
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
          
          {filteredPages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">
                  {selectedFolder === "all"
                    ? "아직 생성된 랜딩페이지가 없습니다."
                    : "이 폴더에 랜딩페이지가 없습니다."}
                </p>
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
            <>
              {/* 필터 결과 표시 */}
              <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
                <p className="text-gray-700 font-semibold">
                  {selectedFolder === "all"
                    ? `전체 ${filteredPages.length}개`
                    : selectedFolder === "no-folder"
                    ? `미분류 ${filteredPages.length}개`
                    : `${folders.find((f) => f.id === selectedFolder)?.name || ""} 폴더 ${filteredPages.length}개`}
                </p>
                <p className="text-sm text-gray-500">
                  총 조회수: <strong className="text-blue-600">{filteredPages.reduce((sum, p) => sum + p.viewCount, 0)}회</strong>
                </p>
              </div>

              {filteredPages.map((page) => (
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
                        <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 border-2 border-blue-300 rounded-full text-blue-800 font-semibold">
                          <FileText className="w-4 h-4" />
                          👁️ 조회 {page.viewCount}회
                        </span>
                        {page.submissions !== undefined && (
                          <span className="flex items-center gap-1 px-3 py-1 bg-purple-100 border-2 border-purple-300 rounded-full text-purple-800 font-semibold">
                            <Users className="w-4 h-4" />
                            📝 신청 {page.submissions}명
                          </span>
                        )}
                        {page.folderName && (
                          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 border-2 border-green-300 rounded-full text-green-800 font-semibold">
                            <FolderOpen className="w-4 h-4" />
                            📁 {page.folderName}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg px-4 py-3 font-mono text-sm overflow-x-auto">
                        <span className="text-gray-500 mr-2">🔗</span>
                        {window.location.origin}{page.url}
                      </div>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => copyUrl(page.url, page.id)}
                        className="border-2 hover:border-blue-400 hover:bg-blue-50"
                      >
                        {copiedId === page.id ? (
                          <>
                            <Check className="w-5 h-5 mr-2 text-green-600" />
                            복사됨!
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5 mr-2" />
                            URL 복사
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => window.open(page.url, "_blank")}
                        className="border-2 border-green-300 hover:border-green-500 hover:bg-green-50"
                      >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        새 탭에서 열기
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button
                        variant="default"
                        size="lg"
                        onClick={() =>
                          router.push(
                            `/dashboard/admin/landing-pages/submissions?slug=${page.slug}`
                          )
                        }
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Users className="w-5 h-5 mr-2" />
                        📊 신청자 보기 ({page.submissions || 0}명)
                      </Button>
                      {page.qr_code_url && (
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => downloadQRCode(page.qr_code_url!, page.title)}
                          className="border-2 border-green-300 hover:border-green-500 hover:bg-green-50"
                        >
                          <Download className="w-5 h-5 mr-2" />
                          QR 코드 다운로드
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => router.push(`/dashboard/admin/landing-pages/edit-page?id=${page.id}`)}
                        className="border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                      >
                        <Edit className="w-5 h-5 mr-2" />
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => deleteLandingPage(page.id)}
                        className="text-red-600 hover:bg-red-50 border-2 border-red-300 hover:border-red-500 ml-auto"
                      >
                        <Trash2 className="w-5 h-5 mr-2" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
