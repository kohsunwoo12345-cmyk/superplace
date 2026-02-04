"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Search,
  Mail,
  User,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Inquiry {
  id: string;
  subject: string;
  message: string;
  userName: string;
  userEmail: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  response?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminInquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [response, setResponse] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setCurrentUser(userData);

    fetchInquiries();
  }, [router]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/inquiries");
      if (response.ok) {
        const data = await response.json();
        setInquiries(data.inquiries || []);
      }
    } catch (error) {
      console.error("문의 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedInquiry || !response) {
      alert("답변을 입력하세요.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/inquiries/${selectedInquiry.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });

      if (res.ok) {
        alert("답변이 전송되었습니다.");
        setSelectedInquiry(null);
        setResponse("");
        fetchInquiries();
      }
    } catch (error) {
      console.error("답변 전송 실패:", error);
    }
  };

  const handleUpdateStatus = async (inquiryId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchInquiries();
      }
    } catch (error) {
      console.error("상태 변경 실패:", error);
    }
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.userName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "ALL" || inquiry.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: inquiries.length,
    pending: inquiries.filter((i) => i.status === "PENDING").length,
    inProgress: inquiries.filter((i) => i.status === "IN_PROGRESS").length,
    resolved: inquiries.filter((i) => i.status === "RESOLVED").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-500">대기</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500">처리중</Badge>;
      case "RESOLVED":
        return <Badge className="bg-green-500">완료</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-orange-600" />
            문의 관리
          </h1>
          <p className="text-gray-600 mt-1">
            사용자 문의를 확인하고 답변합니다
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/admin")}>
          대시보드로
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={selectedStatus === "ALL" ? "border-2 border-blue-500" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 문의
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-600" />
              <span className="text-2xl font-bold">{stats.total}건</span>
            </div>
            <Button
              variant={selectedStatus === "ALL" ? "default" : "outline"}
              size="sm"
              className="w-full mt-2"
              onClick={() => setSelectedStatus("ALL")}
            >
              전체 보기
            </Button>
          </CardContent>
        </Card>

        <Card className={selectedStatus === "PENDING" ? "border-2 border-yellow-500" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              대기중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-2xl font-bold">{stats.pending}건</span>
            </div>
            <Button
              variant={selectedStatus === "PENDING" ? "default" : "outline"}
              size="sm"
              className="w-full mt-2"
              onClick={() => setSelectedStatus("PENDING")}
            >
              대기중만
            </Button>
          </CardContent>
        </Card>

        <Card className={selectedStatus === "IN_PROGRESS" ? "border-2 border-blue-500" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              처리중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold">{stats.inProgress}건</span>
            </div>
            <Button
              variant={selectedStatus === "IN_PROGRESS" ? "default" : "outline"}
              size="sm"
              className="w-full mt-2"
              onClick={() => setSelectedStatus("IN_PROGRESS")}
            >
              처리중만
            </Button>
          </CardContent>
        </Card>

        <Card className={selectedStatus === "RESOLVED" ? "border-2 border-green-500" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold">{stats.resolved}건</span>
            </div>
            <Button
              variant={selectedStatus === "RESOLVED" ? "default" : "outline"}
              size="sm"
              className="w-full mt-2"
              onClick={() => setSelectedStatus("RESOLVED")}
            >
              완료만
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="제목, 내용, 사용자 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 문의 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              문의 목록 ({filteredInquiries.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredInquiries.map((inquiry) => (
                <Card
                  key={inquiry.id}
                  className={`cursor-pointer transition-shadow ${
                    selectedInquiry?.id === inquiry.id
                      ? "border-2 border-blue-500 shadow-lg"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => {
                    setSelectedInquiry(inquiry);
                    setResponse(inquiry.response || "");
                  }}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{inquiry.subject}</h3>
                      {getStatusBadge(inquiry.status)}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {inquiry.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{inquiry.userName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredInquiries.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">검색 결과가 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 문의 상세 및 답변 */}
        <Card>
          <CardHeader>
            <CardTitle>문의 상세</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedInquiry ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">
                      {selectedInquiry.subject}
                    </h3>
                    {getStatusBadge(selectedInquiry.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{selectedInquiry.userName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span>{selectedInquiry.userEmail}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedInquiry.message}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selectedInquiry.status === "IN_PROGRESS" ? "default" : "outline"}
                    onClick={() => handleUpdateStatus(selectedInquiry.id, "IN_PROGRESS")}
                  >
                    처리중으로 변경
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedInquiry.status === "RESOLVED" ? "default" : "outline"}
                    onClick={() => handleUpdateStatus(selectedInquiry.id, "RESOLVED")}
                  >
                    완료로 변경
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    답변 작성
                  </label>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="답변을 입력하세요..."
                    rows={8}
                  />
                  <Button
                    className="w-full mt-2"
                    onClick={handleSubmitResponse}
                  >
                    답변 전송
                  </Button>
                </div>

                {selectedInquiry.response && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      이전 답변:
                    </p>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">
                      {selectedInquiry.response}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  문의를 선택하면 상세 내용을 확인할 수 있습니다
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
