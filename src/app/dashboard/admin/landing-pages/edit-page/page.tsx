"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";

interface LandingPage {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  template_type: string;
  content_json: string;
  html_content: string;
  thumbnail_url?: string;
  og_title?: string;
  og_description?: string;
  qr_code_url?: string;
  status: string;
}

export default function EditLandingPagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [status, setStatus] = useState("active");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (id) {
      fetchLandingPage();
    } else {
      alert("페이지 ID가 필요합니다.");
      router.push("/dashboard/admin/landing-pages");
    }
  }, [id]);

  const fetchLandingPage = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/landing-pages/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const page = data.landingPage;
        setLandingPage(page);
        setTitle(page.title || "");
        setSubtitle(page.subtitle || "");
        setHtmlContent(page.html_content || "");
        setOgTitle(page.og_title || page.title || "");
        setOgDescription(page.og_description || "");
        setStatus(page.status || "active");
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error("❌ API 응답 오류:", response.status, errorData);
        alert(`랜딩페이지를 불러올 수 없습니다.\n\n상태: ${response.status}\n오류: ${errorData.error || 'Unknown error'}`);
        router.push("/dashboard/admin/landing-pages");
      }
    } catch (error) {
      console.error("랜딩페이지 조회 실패:", error);
      alert("랜딩페이지를 불러오는 중 오류가 발생했습니다.");
      router.push("/dashboard/admin/landing-pages");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      // HTML 업데이트 (title, subtitle 자동 교체)
      let updatedHtml = htmlContent;
      if (landingPage) {
        // 기존 제목을 새 제목으로 교체
        updatedHtml = updatedHtml.replace(
          new RegExp(`<title>${landingPage.title}</title>`, 'g'),
          `<title>${title}</title>`
        );
        updatedHtml = updatedHtml.replace(
          new RegExp(`<h1>${landingPage.title}</h1>`, 'g'),
          `<h1>${title}</h1>`
        );
        
        // 부제 교체 (있는 경우)
        if (landingPage.subtitle) {
          updatedHtml = updatedHtml.replace(
            new RegExp(`<p class="subtitle">${landingPage.subtitle}</p>`, 'g'),
            subtitle ? `<p class="subtitle">${subtitle}</p>` : ''
          );
        }
      }

      const response = await fetch(`/api/admin/landing-pages/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim(),
          html_content: updatedHtml,
          og_title: ogTitle.trim() || title.trim(),
          og_description: ogDescription.trim(),
          status,
        }),
      });

      if (response.ok) {
        alert("랜딩페이지가 수정되었습니다!");
        router.push("/dashboard/admin/landing-pages");
      } else {
        const error = await response.json();
        alert(`수정 실패: ${error.error || "알 수 없는 오류"}`);
      }
    } catch (error: any) {
      console.error("랜딩페이지 수정 실패:", error);
      alert(`오류: ${error.message || "랜딩페이지 수정 중 오류가 발생했습니다."}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!landingPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">랜딩페이지를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/admin/landing-pages")}
                size="lg"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                목록으로
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  랜딩페이지 수정
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  프리뷰를 보면서 수정할 수 있습니다
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    프리뷰 숨기기
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    프리뷰 보기
                  </>
                )}
              </Button>
              <Button
                onClick={() => window.open(`/lp/${landingPage.slug}`, '_blank')}
                variant="outline"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                새 탭에서 보기
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    저장하기
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 수정 폼 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">제목 <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="랜딩페이지 제목"
                  />
                </div>

                <div>
                  <Label htmlFor="subtitle">부제목</Label>
                  <Input
                    id="subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="부제목 (선택사항)"
                  />
                </div>

                <div>
                  <Label htmlFor="status">상태</Label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ogTitle">OG 제목</Label>
                  <Input
                    id="ogTitle"
                    value={ogTitle}
                    onChange={(e) => setOgTitle(e.target.value)}
                    placeholder="소셜 미디어 공유 시 표시될 제목"
                  />
                </div>

                <div>
                  <Label htmlFor="ogDescription">OG 설명</Label>
                  <Input
                    id="ogDescription"
                    value={ogDescription}
                    onChange={(e) => setOgDescription(e.target.value)}
                    placeholder="소셜 미디어 공유 시 표시될 설명"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>HTML 편집</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="htmlContent">HTML 코드</Label>
                  <textarea
                    id="htmlContent"
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    rows={20}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                    placeholder="HTML 코드를 입력하세요..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ HTML을 직접 수정할 수 있습니다. 변경사항은 프리뷰에서 확인하세요.
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    💡 사용 가능한 변수: {'{{'}{'{'}studentName{'}'}{'}'}, {'{{'}{'{'}period{'}'}{'}'}, {'{{'}{'{'}attendanceRate{'}'}{'}'}, {'{{'}{'{'}viewCount{'}'}{'}'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 프리뷰 */}
          {showPreview && (
            <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>실시간 프리뷰</CardTitle>
                    <Badge variant="secondary">
                      {landingPage.slug}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-5rem)] overflow-hidden">
                  <iframe
                    srcDoc={htmlContent}
                    className="w-full h-full border-0"
                    title="Landing Page Preview"
                    sandbox="allow-same-origin allow-scripts"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
