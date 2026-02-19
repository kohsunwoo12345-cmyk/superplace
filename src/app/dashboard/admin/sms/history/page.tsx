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
  Download,
  Eye,
  Filter,
} from "lucide-react";
import * as XLSX from 'xlsx';

interface SMSLog {
  id: string;
  receiver_name: string;
  receiver_phone: string;
  message: string;
  message_type: "SMS" | "LMS";
  status: "success" | "failed" | "pending";
  cost: number;
  sent_at: string;
  sender_phone: string;
  error_message?: string;
}

export default function SMSHistoryPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<SMSLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;

    return matchesSearch && matchesDate && matchesStatus;
  });

  const totalCost = filteredLogs.reduce((sum, log) => sum + log.cost, 0);
  const successCount = filteredLogs.filter((log) => log.status === "success").length;
  const failedCount = filteredLogs.filter((log) => log.status === "failed").length;
  const pendingCount = filteredLogs.filter((log) => log.status === "pending").length;

  const downloadExcel = () => {
    const excelData = filteredLogs.map((log) => ({
      '발송일시': log.sent_at,
      '수신자': log.receiver_name,
      '전화번호': log.receiver_phone,
      '메시지': log.message,
      '타입': log.message_type,
      '상태': log.status === 'success' ? '성공' : log.status === 'failed' ? '실패' : '대기',
      '비용': `${log.cost}원`,
      '발신번호': log.sender_phone,
      '오류메시지': log.error_message || ''
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '발송이력');
    
    // 컬럼 너비 설정
    const colWidths = [
      { wch: 20 }, // 발송일시
      { wch: 12 }, // 수신자
      { wch: 15 }, // 전화번호
      { wch: 50 }, // 메시지
      { wch: 8 },  // 타입
      { wch: 8 },  // 상태
      { wch: 10 }, // 비용
      { wch: 15 }, // 발신번호
      { wch: 30 }, // 오류메시지
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `SMS발송이력_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const viewDetail = (log: SMSLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

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
        <div className="flex items-center justify-between">
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
          <Button onClick={downloadExcel} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            엑셀 다운로드
          </Button>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <CardTitle className="text-sm text-green-600">성공</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{successCount}건</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-red-600">실패</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{failedCount}건</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-yellow-600">대기</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pendingCount}건</div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체 상태</option>
                  <option value="success">성공</option>
                  <option value="failed">실패</option>
                  <option value="pending">대기</option>
                </select>
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
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <p className="text-sm text-gray-500">
                          {new Date(log.sent_at).toLocaleString("ko-KR")}
                        </p>
                        <p className="text-sm font-semibold">{log.cost}P</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewDetail(log)}
                          className="h-8"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          상세
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 보기 모달 */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">발송 상세 정보</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    발송 상태
                  </label>
                  <div>{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메시지 타입
                  </label>
                  <Badge variant="outline">{selectedLog.message_type}</Badge>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수신자
                </label>
                <p className="text-gray-900">{selectedLog.receiver_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수신 전화번호
                </label>
                <p className="text-gray-900">{selectedLog.receiver_phone}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  발신 전화번호
                </label>
                <p className="text-gray-900">{selectedLog.sender_phone}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  발송 일시
                </label>
                <p className="text-gray-900">
                  {new Date(selectedLog.sent_at).toLocaleString("ko-KR")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메시지 내용
                </label>
                <div className="p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {selectedLog.message}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Blob([selectedLog.message]).size} bytes
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  발송 비용
                </label>
                <p className="text-lg font-semibold text-blue-600">{selectedLog.cost}P</p>
              </div>

              {selectedLog.error_message && (
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">
                    오류 메시지
                  </label>
                  <div className="p-3 bg-red-50 rounded-lg text-red-700">
                    {selectedLog.error_message}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowDetailModal(false)}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
