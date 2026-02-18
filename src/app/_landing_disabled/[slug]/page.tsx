"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface CustomField {
  id: string;
  type: "text" | "textarea" | "email" | "phone" | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
  order: number;
}

interface LandingPageData {
  id: number;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  template_type: string;
  template_html?: string;
  input_data: CustomField[];
  og_title?: string;
  og_description?: string;
  thumbnail?: string;
  show_qr_code: boolean;
  qr_code_position: string;
  qr_code_url?: string;
  created_at: string;
}

export default function LandingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [landingPage, setLandingPage] = useState<LandingPageData | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (slug) {
      fetchLandingPage();
    }
  }, [slug]);

  const fetchLandingPage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/landing/${slug}`);
      if (response.ok) {
        const result = await response.json();
        setLandingPage(result.page);
      } else {
        setError("랜딩페이지를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("랜딩페이지 조회 오류:", error);
      setError("랜딩페이지를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 필드 검증
    const missingFields = landingPage?.input_data
      .filter((field) => field.required && !formData[field.id])
      .map((field) => field.label);

    if (missingFields && missingFields.length > 0) {
      alert(`다음 필수 항목을 입력해주세요:\n${missingFields.join(", ")}`);
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/landing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          data: formData,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const error = await response.json();
        throw new Error(error.error || "제출 실패");
      }
    } catch (error: any) {
      console.error("폼 제출 오류:", error);
      alert(error.message || "제출 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateFormData = (fieldId: string, value: any) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-600">랜딩페이지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !landingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push("/")} variant="outline">
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">신청이 완료되었습니다!</h1>
            <p className="text-gray-600 mb-6">
              소중한 신청 감사드립니다. 빠른 시일 내에 연락드리겠습니다.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              다시 신청하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const QRCodeSection = () => {
    if (!landingPage.show_qr_code || !landingPage.qr_code_url) return null;
    return (
      <div className="text-center my-6">
        <img
          src={landingPage.qr_code_url}
          alt="QR Code"
          className="mx-auto w-48 h-48 border-4 border-gray-200 rounded-lg shadow-sm"
        />
        <p className="text-sm text-gray-500 mt-2">QR 코드를 스캔하여 접속하세요</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-3xl mx-auto p-6 py-12">
        <Card className="shadow-xl">
          <CardContent className="p-8 md:p-12">
            {/* QR 코드 - 상단 */}
            {landingPage.qr_code_position === "top" && <QRCodeSection />}

            {/* 썸네일 이미지 */}
            {landingPage.thumbnail && (
              <div className="mb-8">
                <img
                  src={landingPage.thumbnail}
                  alt={landingPage.title}
                  className="w-full h-auto rounded-lg shadow-md"
                />
              </div>
            )}

            {/* 제목 및 설명 */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                {landingPage.title}
              </h1>
              {landingPage.subtitle && (
                <p className="text-xl text-gray-600 mb-4">{landingPage.subtitle}</p>
              )}
              {landingPage.description && (
                <p className="text-gray-700 leading-relaxed">{landingPage.description}</p>
              )}
            </div>

            {/* 커스텀 HTML (template_type이 custom인 경우) */}
            {landingPage.template_type === "custom" && landingPage.template_html && (
              <div
                className="my-8 prose max-w-none"
                dangerouslySetInnerHTML={{ __html: landingPage.template_html }}
              />
            )}

            {/* 입력 폼 */}
            <form onSubmit={handleSubmit} className="space-y-6 mt-10">
              <div className="border-t-2 border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">신청서 작성</h2>

                {landingPage.input_data.map((field) => (
                  <div key={field.id} className="mb-5">
                    <Label className="text-base font-semibold mb-2 block">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        placeholder={field.placeholder || ""}
                        required={field.required}
                        value={formData[field.id] || ""}
                        onChange={(e) => updateFormData(field.id, e.target.value)}
                        rows={4}
                        className="text-base"
                      />
                    ) : field.type === "checkbox" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          required={field.required}
                          checked={formData[field.id] || false}
                          onChange={(e) => updateFormData(field.id, e.target.checked)}
                          className="w-5 h-5 rounded"
                        />
                        <span className="text-sm text-gray-600">{field.placeholder}</span>
                      </div>
                    ) : (
                      <Input
                        type={field.type}
                        placeholder={field.placeholder || ""}
                        required={field.required}
                        value={formData[field.id] || ""}
                        onChange={(e) => updateFormData(field.id, e.target.value)}
                        className="text-base"
                      />
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    제출 중...
                  </>
                ) : (
                  "신청하기"
                )}
              </Button>
            </form>

            {/* QR 코드 - 하단 */}
            {landingPage.qr_code_position === "bottom" && <QRCodeSection />}
          </CardContent>
        </Card>

        {/* 푸터 */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} 슈퍼플레이스 스터디. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
