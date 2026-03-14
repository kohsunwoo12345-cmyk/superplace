"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ArrowLeft, 
  CheckCircle,
  AlertCircle,
  User
} from "lucide-react";

interface Seminar {
  id: string;
  title: string;
  description: string;
  detailHtml: string;
  mainImage: string;
  instructor: string;
  date: string;
  time: string;
  location: string;
  locationType: string;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
  formHtml: string;
  useCustomForm: number;
  ctaButtonText: string;
  requiredFields: string[] | string;
  customFields: any[];
  createdAt: string;
}

export default function SeminarDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seminarId = searchParams.get('id');

  const [seminar, setSeminar] = useState<Seminar | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    applicantName: "",
    applicantEmail: "",
    applicantPhone: "",
    academyName: "",
    position: "",
    additionalInfo: "",
  });

  useEffect(() => {
    if (seminarId) {
      fetchSeminarDetail();
    } else {
      router.push("/dashboard/seminars");
    }
  }, [seminarId]);

  const fetchSeminarDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/seminars?id=${seminarId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSeminar(data.seminar);
      } else {
        console.error("Failed to fetch seminar detail");
        router.push("/dashboard/seminars");
      }
    } catch (error) {
      console.error("Error fetching seminar detail:", error);
      router.push("/dashboard/seminars");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seminar) return;

    console.log('🔄 Submitting application...');
    console.log('📝 Form data:', formData);
    console.log('🎯 Seminar ID:', seminar.id);

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("로그인이 필요합니다.");
        router.push("/login");
        return;
      }

      const requestBody = {
        seminarId: seminar.id,
        ...formData,
      };

      console.log('📤 Request body:', requestBody);

      const response = await fetch("/api/seminars/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (response.ok && data.success) {
        alert("세미나 신청이 완료되었습니다!");
        setShowApplicationForm(false);
        setFormData({
          applicantName: "",
          applicantEmail: "",
          applicantPhone: "",
          academyName: "",
          position: "",
          additionalInfo: "",
        });
        fetchSeminarDetail(); // 신청 후 최신 정보 다시 불러오기
      } else {
        console.error('❌ Application failed:', data.error || data.message);
        alert(data.message || data.error || "신청에 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ Error submitting application:", error);
      alert("신청 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-green-500 text-white">모집중</Badge>;
      case "completed":
        return <Badge className="bg-gray-500 text-white">종료</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500 text-white">취소</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!seminar) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold mb-2">세미나를 찾을 수 없습니다</h2>
        <Button onClick={() => router.push("/dashboard/seminars")}>
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const isRegistrationOpen =
    (seminar.status === "upcoming" || seminar.status === "active") &&
    seminar.currentParticipants < seminar.maxParticipants;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.push("/dashboard/seminars")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        목록으로
      </Button>

      {/* Main Image */}
      {seminar.mainImage && (
        <div className="w-full h-96 rounded-xl overflow-hidden">
          <img
            src={seminar.mainImage}
            alt={seminar.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl sm:text-3xl">
                  {seminar.title}
                </CardTitle>
                {getStatusBadge(seminar.status)}
              </div>
              <CardDescription className="text-base">
                {seminar.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs text-gray-600">날짜</p>
                <p className="font-medium">
                  {new Date(seminar.date).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs text-gray-600">시간</p>
                <p className="font-medium">{seminar.time}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs text-gray-600">장소</p>
                <p className="font-medium">{seminar.location}</p>
                <p className="text-xs text-gray-500">{seminar.locationType}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs text-gray-600">강사</p>
                <p className="font-medium">{seminar.instructor}</p>
              </div>
            </div>
          </div>

          {/* 신청하기 버튼 */}
          {isRegistrationOpen && !showApplicationForm && (
            <Button
              className="w-full mt-4"
              size="lg"
              onClick={() => setShowApplicationForm(true)}
            >
              {seminar.ctaButtonText || '세미나 신청하기'}
            </Button>
          )}

          {!isRegistrationOpen && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <p className="font-medium text-gray-700">
                {seminar.status === "cancelled" || seminar.status === "completed"
                  ? "종료된 세미나입니다"
                  : "신청이 마감되었습니다"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 신청 폼 */}
      {showApplicationForm && isRegistrationOpen && (
        <Card>
          <CardHeader>
            <CardTitle>세미나 신청</CardTitle>
            <CardDescription>아래 정보를 입력하여 세미나를 신청해주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitApplication} className="space-y-4">
              {/* 이름 - 항상 필수 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.applicantName}
                  onChange={(e) =>
                    setFormData({ ...formData, applicantName: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="이름을 입력하세요"
                />
              </div>

              {/* 이메일 - 항상 필수 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.applicantEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, applicantEmail: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="email@example.com"
                />
              </div>

              {/* 연락처 - requiredFields에 'phone' 포함 시에만 표시 */}
              {(Array.isArray(seminar.requiredFields) 
                ? seminar.requiredFields.includes('phone')
                : typeof seminar.requiredFields === 'string' 
                  ? JSON.parse(seminar.requiredFields || '[]').includes('phone')
                  : false) && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.applicantPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, applicantPhone: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="010-1234-5678"
                  />
                </div>
              )}

              {/* 학원명 - requiredFields에 'academy' 포함 시에만 표시 */}
              {(Array.isArray(seminar.requiredFields) 
                ? seminar.requiredFields.includes('academy')
                : typeof seminar.requiredFields === 'string' 
                  ? JSON.parse(seminar.requiredFields || '[]').includes('academy')
                  : false) && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    학원명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.academyName}
                    onChange={(e) =>
                      setFormData({ ...formData, academyName: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="소속 학원명"
                  />
                </div>
              )}

              {/* 직책 - requiredFields에 'position' 포함 시에만 표시 */}
              {(Array.isArray(seminar.requiredFields) 
                ? seminar.requiredFields.includes('position')
                : typeof seminar.requiredFields === 'string' 
                  ? JSON.parse(seminar.requiredFields || '[]').includes('position')
                  : false) && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    직책 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="예: 원장, 강사"
                  />
                </div>
              )}

              {/* 커스텀 필드 - customFields 배열에 있는 필드들 표시 */}
              {seminar.customFields && Array.isArray(seminar.customFields) && seminar.customFields.map((field, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium mb-2">
                    {field.label} <span className="text-red-500">*</span>
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      required
                      rows={4}
                      value={formData[`custom_${index}`] || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [`custom_${index}`]: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={`${field.label}을(를) 입력하세요`}
                    />
                  ) : (
                    <input
                      type={field.type}
                      required
                      value={formData[`custom_${index}`] || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [`custom_${index}`]: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={`${field.label}을(를) 입력하세요`}
                    />
                  )}
                </div>
              ))}

              {/* Custom Form HTML */}
              {seminar.useCustomForm === 1 && seminar.formHtml && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-4">추가 정보</h3>
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: seminar.formHtml }}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowApplicationForm(false)}
                  disabled={submitting}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? "신청 중..." : (seminar.ctaButtonText || "신청 완료")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 상세 내용 */}
      <Card>
        <CardHeader>
          <CardTitle>세미나 상세 정보</CardTitle>
        </CardHeader>
        <CardContent>
          {seminar.detailHtml ? (
            <div
              className="prose prose-sm sm:prose lg:prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: seminar.detailHtml }}
            />
          ) : (
            <p className="text-gray-600">{seminar.description}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
