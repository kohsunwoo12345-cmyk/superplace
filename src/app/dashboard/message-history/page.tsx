"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  History,
  Send,
  MessageSquare,
  Phone,
  Search,
  Filter,
  Download,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Users,
  Link as LinkIcon,
} from "lucide-react";

interface MessageHistory {
  id: string;
  messageType: string;
  senderNumber: string;
  recipientCount: number;
  recipients: any[];
  messageTitle?: string;
  messageContent: string;
  pointsUsed: number;
  successCount: number;
  failCount: number;
  status: string;
  sentAt?: string;
  scheduledAt?: string;
  createdAt: string;
}

export default function MessageHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<MessageHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<MessageHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedMessage, setSelectedMessage] = useState<MessageHistory | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [history, searchQuery, filterType, filterStatus]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/messages/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("발송 이력 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...history];

    // 발송 유형 필터
    if (filterType !== "ALL") {
      filtered = filtered.filter((h) => h.messageType === filterType);
    }

    // 상태 필터
    if (filterStatus !== "ALL") {
      filtered = filtered.filter((h) => h.status === filterStatus);
    }

    // 검색
    if (searchQuery) {
      filtered = filtered.filter(
        (h) =>
          h.messageContent?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.senderNumber?.includes(searchQuery)
      );
    }

    setFilteredHistory(filtered);
  };

  const handleViewDetail = (message: MessageHistory) => {
    setSelectedMessage(message);
    setDetailOpen(true);
  };

  const handleExportCSV = () => {
    const csvHeader = "발송일시,유형,발신번호,수신자수,성공,실패,포인트,상태\n";
    const csvRows = filteredHistory
      .map(
        (h) =>
          `${h.sentAt || h.createdAt},${h.messageType},${h.senderNumber},${h.recipientCount},${h.successCount},${h.failCount},${h.pointsUsed},${h.status}`
      )
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `message_history_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            완료
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-500">
            <XCircle className="w-3 h-3 mr-1" />
            실패
          </Badge>
        );
      case "SENDING":
        return (
          <Badge className="bg-blue-500">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            발송중
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-500">
            <Clock className="w-3 h-3 mr-1" />
            대기
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMessageTypeBadge = (type: string) => {
    if (type === "SMS") {
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-700">
          <Phone className="w-3 h-3 mr-1" />
          SMS
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
          <MessageSquare className="w-3 h-3 mr-1" />
          카카오
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 상단 메뉴 */}
      <div className="bg-white border-b shadow-sm mb-6 -mx-6 -mt-6 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/admin/sms")}
            className="whitespace-nowrap"
          >
            <Send className="w-4 h-4 mr-1" />
            대시보드
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/message-send")}
            className="whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            메시지 발송
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/message-history")}
            className="whitespace-nowrap bg-teal-50 text-teal-700"
          >
            <History className="w-4 h-4 mr-1" />
            발송 이력
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="h-8 w-8 text-teal-600" />
              발송 이력
            </h1>
            <p className="text-gray-600 mt-1">
              문자 및 카카오톡 발송 내역을 조회하고 관리하세요
            </p>
          </div>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            CSV 내보내기
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                총 발송 건수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-600">
                {history.reduce((sum, h) => sum + h.recipientCount, 0)}건
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                성공률
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {history.length > 0
                  ? Math.round(
                      (history.reduce((sum, h) => sum + h.successCount, 0) /
                        history.reduce((sum, h) => sum + h.recipientCount, 0)) *
                        100
                    )
                  : 0}
                %
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                사용 포인트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {history.reduce((sum, h) => sum + h.pointsUsed, 0)}P
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                이번 달 발송
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {
                  history.filter((h) => {
                    const date = new Date(h.sentAt || h.createdAt);
                    const now = new Date();
                    return (
                      date.getMonth() === now.getMonth() &&
                      date.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
                건
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="메시지 내용 또는 발신번호 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="발송 유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="KAKAO">카카오톡</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  <SelectItem value="COMPLETED">완료</SelectItem>
                  <SelectItem value="FAILED">실패</SelectItem>
                  <SelectItem value="SENDING">발송중</SelectItem>
                  <SelectItem value="PENDING">대기</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 발송 이력 목록 */}
        <div className="space-y-3">
          {filteredHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <History className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">발송 이력이 없습니다</p>
                <Button
                  onClick={() => router.push("/dashboard/message-send")}
                  className="mt-4 bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  메시지 발송하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredHistory.map((message) => (
              <Card key={message.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      {/* 첫 번째 줄: 유형, 상태, 날짜 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {getMessageTypeBadge(message.messageType)}
                        {getStatusBadge(message.status)}
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(message.sentAt || message.createdAt).toLocaleString(
                            "ko-KR"
                          )}
                        </div>
                      </div>

                      {/* 두 번째 줄: 메시지 제목 (카카오) 또는 내용 미리보기 */}
                      <div className="font-medium text-lg">
                        {message.messageTitle || "메시지 발송"}
                      </div>

                      {/* 세 번째 줄: 메시지 내용 미리보기 */}
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {message.messageContent}
                      </div>

                      {/* 네 번째 줄: 통계 정보 */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{message.senderNumber}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            수신자 {message.recipientCount}명
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-600">
                            성공 {message.successCount}
                          </span>
                        </div>
                        {message.failCount > 0 && (
                          <div className="flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-red-600">
                              실패 {message.failCount}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">
                            {message.pointsUsed}P 사용
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 상세보기 버튼 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(message)}
                      className="ml-4"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      상세
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* 상세보기 다이얼로그 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>발송 상세 정보</DialogTitle>
            <DialogDescription>
              {selectedMessage?.sentAt &&
                new Date(selectedMessage.sentAt).toLocaleString("ko-KR")}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">기본 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">발송 유형</div>
                      <div className="mt-1">
                        {getMessageTypeBadge(selectedMessage.messageType)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">발신번호</div>
                      <div className="mt-1 font-medium">
                        {selectedMessage.senderNumber}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">수신자</div>
                      <div className="mt-1 font-medium">
                        {selectedMessage.recipientCount}명
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">사용 포인트</div>
                      <div className="mt-1 font-medium text-red-600">
                        {selectedMessage.pointsUsed}P
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">성공</div>
                      <div className="mt-1 font-medium text-green-600">
                        {selectedMessage.successCount}건
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">실패</div>
                      <div className="mt-1 font-medium text-red-600">
                        {selectedMessage.failCount}건
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 메시지 내용 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">메시지 내용</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedMessage.messageTitle && (
                    <div className="font-semibold text-lg mb-3">
                      {selectedMessage.messageTitle}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded border">
                    {selectedMessage.messageContent}
                  </div>
                </CardContent>
              </Card>

              {/* 수신자 목록 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    수신자 목록 ({selectedMessage.recipients?.length || 0}명)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {selectedMessage.recipients?.map((recipient: any, index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded border flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{recipient.studentName}</div>
                          <div className="text-sm text-gray-600">
                            {recipient.parentPhone}
                          </div>
                          {recipient.landingPageUrl && (
                            <div className="text-xs text-teal-600 mt-1 flex items-center gap-1">
                              <LinkIcon className="w-3 h-3" />
                              <a
                                href={recipient.landingPageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline truncate"
                              >
                                {recipient.landingPageUrl}
                              </a>
                            </div>
                          )}
                        </div>
                        {recipient.status === "success" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : recipient.status === "failed" ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
