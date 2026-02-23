"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Check,
  X,
  Clock,
  Phone,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
} from "lucide-react";

interface KakaoChannelRequest {
  id: string;
  userId: string;
  phoneNumber: string;
  channelName: string;
  searchChannelId: string;
  businessNumber?: string;
  categoryCode: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  businessFileUrl?: string;
  userName?: string;
  userEmail?: string;
}

export default function KakaoApprovalsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<KakaoChannelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/kakao-channels/requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm("이 카카오 채널 신청을 승인하시겠습니까?")) {
      return;
    }

    setProcessing(requestId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/kakao-channels/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      if (response.ok) {
        alert("카카오 채널 신청이 승인되었습니다.");
        loadRequests();
      } else {
        const error = await response.json();
        alert(`승인 실패: ${error.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("승인 중 오류가 발생했습니다");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt("거부 사유를 입력하세요:");
    if (!reason) return;

    setProcessing(requestId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/kakao-channels/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, reason }),
      });

      if (response.ok) {
        alert("카카오 채널 신청이 거부되었습니다.");
        loadRequests();
      } else {
        const error = await response.json();
        alert(`거부 실패: ${error.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("거부 중 오류가 발생했습니다");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            승인됨
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-500">
            <Clock className="w-3 h-3 mr-1" />
            대기중
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-500">
            <AlertCircle className="w-3 h-3 mr-1" />
            거부됨
          </Badge>
        );
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const processedRequests = requests.filter((r) => r.status !== "PENDING");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-yellow-600" />
            카카오 채널 승인 관리
          </h1>
          <p className="text-gray-600 mt-1">
            카카오 채널 등록 신청을 검토하고 승인/거부합니다
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/admin")}>
          대시보드로 돌아가기
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              대기중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {pendingRequests.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">승인 대기 신청</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              승인됨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {requests.filter((r) => r.status === "APPROVED").length}
            </div>
            <p className="text-xs text-gray-500 mt-1">승인된 채널</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {requests.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">총 신청 건수</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              승인 대기 중 ({pendingRequests.length}건)
            </CardTitle>
            <CardDescription>
              검토가 필요한 카카오 채널 신청 목록입니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-yellow-600" />
                      <div>
                        <h3 className="font-semibold text-lg">
                          {request.channelName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {request.searchChannelId}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{request.phoneNumber}</span>
                      </div>
                      {request.businessNumber && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span>{request.businessNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span>카테고리: {request.categoryCode}</span>
                      </div>
                    </div>

                    {request.userName && (
                      <div className="text-sm text-gray-600">
                        신청자: {request.userName} ({request.userEmail})
                      </div>
                    )}

                    {request.businessFileUrl && (
                      <div>
                        <a
                          href={request.businessFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          사업자등록증 보기
                        </a>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      신청일: {new Date(request.createdAt).toLocaleString("ko-KR")}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request.id)}
                      disabled={processing === request.id}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {processing === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          승인
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(request.id)}
                      disabled={processing === request.id}
                    >
                      <X className="w-4 h-4 mr-1" />
                      거부
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>처리 완료 ({processedRequests.length}건)</CardTitle>
            <CardDescription>승인 또는 거부된 신청 내역입니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {processedRequests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{request.channelName}</p>
                      <p className="text-sm text-gray-500">
                        {request.phoneNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(request.status)}
                    <span className="text-xs text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {requests.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">등록된 카카오 채널 신청이 없습니다</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
