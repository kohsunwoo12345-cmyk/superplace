"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  Filter,
  Building2,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface RevenueStats {
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  growth: number;
  transactionCount: number;
}

interface Transaction {
  id: number;
  academyId: string;
  academyName: string;
  amount: number;
  type: string;
  description?: string;
  status: string;
  paymentMethod?: string;
  createdAt: string;
  paidAt?: string;
}

interface AcademyStats {
  academyId: string;
  academyName: string;
  totalAmount: number;
  transactionCount: number;
}

interface MonthlyTrend {
  month: string;
  total: number;
  count: number;
}

interface TypeStats {
  type: string;
  total: number;
  count: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function RevenuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    growth: 0,
    transactionCount: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [academyStats, setAcademyStats] = useState<AcademyStats[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [typeStats, setTypeStats] = useState<TypeStats[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    const role = userData.role?.toUpperCase();

    // 관리자만 접근 가능
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      alert("관리자만 접근할 수 있습니다.");
      router.push("/dashboard");
      return;
    }

    fetchRevenueData();
  }, [router, period]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/revenue?period=${period}`);
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || {});
        setTransactions(data.transactions || []);
        setAcademyStats(data.academyStats || []);
        setMonthlyTrend(data.monthlyTrend || []);
        setTypeStats(data.typeStats || []);
      }
    } catch (error) {
      console.error("매출 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = async () => {
    if (!confirm("샘플 매출 데이터를 생성하시겠습니까?")) return;

    try {
      const response = await fetch("/api/admin/revenue", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || "샘플 데이터가 생성되었습니다.");
        fetchRevenueData();
      } else {
        alert("샘플 데이터 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("샘플 데이터 생성 실패:", error);
      alert("샘플 데이터 생성 중 오류가 발생했습니다.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // 차트 데이터 준비
  const monthlyChartData = monthlyTrend.map(item => ({
    month: item.month,
    매출: item.total,
    거래수: item.count,
  }));

  const pieChartData = typeStats.map(item => ({
    name: item.type,
    value: item.total,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-green-600" />
            매출 관리
          </h1>
          <p className="text-gray-600 mt-1">전체 매출 현황 및 거래 내역</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateSampleData}>
            <Filter className="w-4 h-4 mr-2" />
            샘플 데이터 생성
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {["day", "week", "month", "year"].map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            onClick={() => setPeriod(p)}
          >
            {p === "day" && "일별"}
            {p === "week" && "주별"}
            {p === "month" && "월별"}
            {p === "year" && "연별"}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 매출</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-sm text-gray-500 mt-2">누적 매출</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">이번 달 매출</CardTitle>
            <Calendar className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(stats.thisMonthRevenue)}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {new Date().getFullYear()}년 {new Date().getMonth() + 1}월
            </p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${stats.growth >= 0 ? 'border-purple-100 bg-gradient-to-br from-purple-50' : 'border-red-100 bg-gradient-to-br from-red-50'} to-white`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">성장률</CardTitle>
            {stats.growth >= 0 ? (
              <TrendingUp className="h-5 w-5 text-purple-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.growth >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              {stats.growth >= 0 ? '+' : ''}{stats.growth}%
            </div>
            <p className="text-sm text-gray-500 mt-2">전월 대비</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">거래 건수</CardTitle>
            <CreditCard className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats.transactionCount}건
            </div>
            <p className="text-sm text-gray-500 mt-2">전체 거래</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        {monthlyChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>월별 매출 추이</CardTitle>
              <CardDescription>최근 12개월 매출 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="매출" 
                    stroke="#10B981" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Type Distribution Chart */}
        {pieChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>유형별 매출 분포</CardTitle>
              <CardDescription>결제 유형별 매출 비중</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Academies */}
      {academyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>학원별 매출 순위</CardTitle>
            <CardDescription>상위 10개 학원</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {academyStats.map((academy, index) => (
                <div key={academy.academyId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-white
                      ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{academy.academyName || '알 수 없음'}</p>
                      <p className="text-sm text-gray-500">{academy.transactionCount}건 거래</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(academy.totalAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>최근 거래 내역</CardTitle>
          <CardDescription>최근 20개 결제 및 매출 내역</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">학원명</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">금액</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">유형</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">날짜</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            {transaction.academyName || '알 수 없음'}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-green-600">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">
                            {transaction.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                          >
                            {transaction.status === 'completed' ? '완료' : transaction.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-center">
                <Button variant="outline">더 보기</Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">거래 내역이 없습니다.</p>
              <p className="text-sm text-gray-500 mb-4">
                샘플 데이터를 생성하여 매출 관리 기능을 테스트해보세요.
              </p>
              <Button onClick={generateSampleData}>
                샘플 데이터 생성
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
