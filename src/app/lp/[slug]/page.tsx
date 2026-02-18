"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Image from "next/image";

interface LandingPageData {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  templateType: string;
  templateHtml?: string;
  inputData: CustomField[];
  thumbnail?: string;
  showQrCode: boolean;
  qrCodePosition: string;
  qrCodeUrl?: string;
  pixelScripts: PixelScript[];
  viewCount: number;
}

interface CustomField {
  id: string;
  type: "text" | "textarea" | "email" | "phone" | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
  order: number;
}

interface PixelScript {
  id: string;
  name: string;
  scriptType: string;
  scriptCode: string;
  isActive: boolean;
}

export default function LandingPageView() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [landingPage, setLandingPage] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (slug) {
      fetchLandingPage();
    }
  }, [slug]);

  useEffect(() => {
    if (landingPage && landingPage.pixelScripts) {
      // Inject pixel scripts
      landingPage.pixelScripts.forEach((script) => {
        if (script.isActive && script.scriptCode) {
          const scriptElement = document.createElement("script");
          scriptElement.innerHTML = script.scriptCode;
          
          if (script.scriptType === "header") {
            document.head.appendChild(scriptElement);
          } else {
            document.body.appendChild(scriptElement);
          }
        }
      });
    }
  }, [landingPage]);

  const fetchLandingPage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/landing/view?slug=${slug}`);

      if (response.ok) {
        const data = await response.json();
        setLandingPage(data.landingPage);
      } else {
        alert("랜딩페이지를 찾을 수 없습니다.");
        router.push("/");
      }
    } catch (error) {
      console.error("랜딩페이지 조회 실패:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    landingPage?.inputData.forEach((field) => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label}을(를) 입력해주세요.`;
      }

      if (field.type === "email" && formData[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.id])) {
          newErrors[field.id] = "올바른 이메일 형식이 아닙니다.";
        }
      }

      if (field.type === "phone" && formData[field.id]) {
        const phoneRegex = /^[0-9-+() ]{8,}$/;
        if (!phoneRegex.test(formData[field.id])) {
          newErrors[field.id] = "올바른 전화번호 형식이 아닙니다.";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
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
        setFormData({});
      } else {
        throw new Error("제출 실패");
      }
    } catch (error) {
      console.error("폼 제출 실패:", error);
      alert("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderQrCode = () => {
    if (!landingPage?.showQrCode || !landingPage?.qrCodeUrl) return null;

    return (
      <div className="text-center py-6">
        <Image
          src={landingPage.qrCodeUrl}
          alt="QR Code"
          width={150}
          height={150}
          className="mx-auto mb-3"
        />
        <p className="text-sm text-gray-600">스캔하여 접속하세요</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!landingPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">페이지를 찾을 수 없습니다</h2>
            <p className="text-gray-600 mb-4">
              요청하신 페이지가 존재하지 않거나 삭제되었습니다.
            </p>
            <Button onClick={() => router.push("/")}>홈으로 돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-3 text-gray-900">신청 완료!</h2>
            <p className="text-gray-600 mb-6 text-lg">
              신청이 성공적으로 접수되었습니다.
              <br />
              곧 연락드리겠습니다.
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setFormData({});
              }}
              variant="outline"
              className="w-full"
            >
              새로운 신청하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl">
          <CardContent className="p-8">
            {landingPage.qrCodePosition === "top" && renderQrCode()}

            {landingPage.thumbnail && (
              <div className="mb-8 rounded-lg overflow-hidden">
                <Image
                  src={landingPage.thumbnail}
                  alt={landingPage.title}
                  width={800}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                {landingPage.title}
              </h1>
              {landingPage.subtitle && (
                <p className="text-xl text-gray-600 mb-4">{landingPage.subtitle}</p>
              )}
              {landingPage.description && (
                <p className="text-gray-700 leading-relaxed">
                  {landingPage.description}
                </p>
              )}
            </div>

            {landingPage.templateType === "custom" && landingPage.templateHtml ? (
              <div
                className="custom-template"
                dangerouslySetInnerHTML={{ __html: landingPage.templateHtml }}
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {landingPage.inputData
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      {field.type === "textarea" ? (
                        <Textarea
                          value={formData[field.id] || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, [field.id]: e.target.value })
                          }
                          placeholder={field.placeholder}
                          rows={4}
                          className="w-full"
                        />
                      ) : field.type === "checkbox" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData[field.id] || false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [field.id]: e.target.checked,
                              })
                            }
                            className="w-5 h-5 rounded"
                          />
                          <span className="text-sm text-gray-600">
                            {field.placeholder || field.label}
                          </span>
                        </div>
                      ) : (
                        <Input
                          type={field.type}
                          value={formData[field.id] || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, [field.id]: e.target.value })
                          }
                          placeholder={field.placeholder}
                          className="w-full"
                        />
                      )}
                      {errors[field.id] && (
                        <p className="text-sm text-red-600">{errors[field.id]}</p>
                      )}
                    </div>
                  ))}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6"
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
            )}

            {landingPage.qrCodePosition === "bottom" && renderQrCode()}

            <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
              <p>조회수: {landingPage.viewCount}회</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
