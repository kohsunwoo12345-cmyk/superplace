"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wand2, Download, Eye, Copy } from "lucide-react";

export default function LandingPageGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    targetAudience: "",
    mainService: "",
    colors: "",
  });
  const [generatedCode, setGeneratedCode] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async () => {
    if (!formData.businessName || !formData.mainService) {
      alert("사업명과 주요 서비스를 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tools/landing-page-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("생성 실패");
      }

      const data = await response.json();
      setGeneratedCode(data.htmlCode);
      setShowPreview(true);
    } catch (error) {
      console.error("Error:", error);
      alert("랜딩페이지 생성 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    alert("HTML 코드가 클립보드에 복사되었습니다!");
  };

  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.businessName.replace(/\s+/g, "-")}-landing-page.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI 랜딩페이지 생성기</h1>
        <p className="text-gray-600 mt-1">
          간단한 정보 입력만으로 전문적인 랜딩페이지를 생성합니다
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>정보 입력</CardTitle>
            <CardDescription>비즈니스 정보를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">사업명 *</Label>
              <Input
                id="businessName"
                placeholder="예: 슈퍼플레이스 마케팅"
                value={formData.businessName}
                onChange={(e) =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">업종</Label>
              <Input
                id="businessType"
                placeholder="예: 디지털 마케팅, 교육, 컨설팅"
                value={formData.businessType}
                onChange={(e) =>
                  setFormData({ ...formData, businessType: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">타겟 고객</Label>
              <Input
                id="targetAudience"
                placeholder="예: 학원 원장님, 소상공인"
                value={formData.targetAudience}
                onChange={(e) =>
                  setFormData({ ...formData, targetAudience: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainService">주요 서비스 *</Label>
              <Input
                id="mainService"
                placeholder="예: 통합 마케팅 솔루션"
                value={formData.mainService}
                onChange={(e) =>
                  setFormData({ ...formData, mainService: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="colors">브랜드 컬러</Label>
              <Input
                id="colors"
                placeholder="예: 파란색, #3B82F6"
                value={formData.colors}
                onChange={(e) =>
                  setFormData({ ...formData, colors: e.target.value })
                }
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {loading ? "생성 중..." : "랜딩페이지 생성"}
            </Button>
          </CardContent>
        </Card>

        {/* Preview/Code */}
        <Card>
          <CardHeader>
            <CardTitle>미리보기 & 코드</CardTitle>
            <CardDescription>생성된 랜딩페이지를 확인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            {!generatedCode ? (
              <div className="text-center py-12 text-gray-500">
                <Wand2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>정보를 입력하고 생성 버튼을 클릭하세요</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? "코드 보기" : "미리보기"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    복사
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    다운로드
                  </Button>
                </div>

                {showPreview ? (
                  <div className="border rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={generatedCode}
                      className="w-full h-[600px]"
                      title="Landing Page Preview"
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-gray-50 overflow-auto max-h-[600px]">
                    <pre className="text-xs">
                      <code>{generatedCode}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
