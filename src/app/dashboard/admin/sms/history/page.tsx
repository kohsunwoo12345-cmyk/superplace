"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  History,
  Loader2,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface SMSLog {
  id: number;
  receiver_name: string;
  receiver_phone: string;
  message: string;
  message_type: "SMS" | "LMS";
  status: "success" | "failed" | "pending";
  cost: number;
  sent_at: string;
  error_message?: string;
}

export default function SMSHistoryPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/sms/logs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("이력 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />성공</Badge>;
      case "failed":
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />실패</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />대기</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.receiver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.receiver_phone.includes(searchQuery) ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = !dateFilter || log.sent_at.startsWith(dateFilter);

    return matchesSearch && matchesDate;
  });

  const totalCost = filteredLogs.reduce((sum, log) => sum + log.cost, 0);
  const successCount = filteredLogs.filter((log) => log.status === "success").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="h-8 w-8 text-purple-600" />
              SMS 발송 이력
            </h1>
            <p className="text-gray-600 mt-1">과거 발송 내역을 조회합니다</p>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">총 발송</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{filteredLogs.length}건</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">성공률</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {filteredLogs.length > 0
                  ? Math.round((successCount / filteredLogs.length) * 100)
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">총 비용</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalCost}P</div>
            </CardContent>
          </Card>
        </div>

        {/* 필터 */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="이름, 전화번호, 메시지 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 이력 목록 */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {filteredLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-16">발송 이력이 없습니다.</p>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{log.receiver_name}</span>
                          <Badge variant="outline">{log.message_type}</Badge>
                          {getStatusBadge(log.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{log.receiver_phone}</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{log.message}</p>
                        {log.error_message && (
                          <p className="text-sm text-red-600 mt-1">오류: {log.error_message}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-gray-500">
                          {new Date(log.sent_at).toLocaleString("ko-KR")}
                        </p>
                        <p className="text-sm font-semibold mt-1">{log.cost}P</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
