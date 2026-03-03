"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar as CalendarIcon, 
  Download, 
  Filter,
  Building2,
  CreditCard,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
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
  pointRevenue?: number;
  botRevenue?: number;
  regularRevenue?: number;
  vatInfo?: {
    totalVAT: number;
    pointVAT: number;
    botVAT: number;
    totalNetRevenue: number;
    pointNetRevenue: number;
    botNetRevenue: number;
  };
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
  transactionId?: string;
  createdAt: string;
  paidAt?: string;
}

interface AcademyStats {
  academyId: string;
  academyName: string;
  totalAmount: number;
  transactionCount: number;
  pointAmount?: number;
  botAmount?: number;
  subscriptionAmount?: number;
  otherAmount?: number;
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

interface DailyRevenue {
  date: string;
  total: number;
  count: number;
  transactions: Transaction[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function RevenuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  
  // 날짜 범위
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // 검색
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSearch, setTempSearch] = useState("");
  
  // 달력
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyRevenue, setDailyRevenue] = useState<Map<string, DailyRevenue>>(new Map());
  
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

    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      alert("관리자만 접근할 수 있습니다.");
      router.push("/dashboard");
      return;
    }

    fetchRevenueData();
  }, [router, period, startDate, endDate, searchTerm]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(searchTerm && { search: searchTerm }),
      });
      
      const response = await fetch(`/api/admin/revenue?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          ...data.stats,
          vatInfo: data.vatInfo
        });
        setTransactions(data.transactions || []);
        setAcademyStats(data.academyStats || []);
        setMonthlyTrend(data.monthlyTrend || []);
        setTypeStats(data.typeStats || []);
        
        // 날짜별 매출 맵 생성
        const dailyMap = new Map<string, DailyRevenue>();
        (data.transactions || []).forEach((tx: Transaction) => {
          const date = tx.createdAt.split(' ')[0] || tx.createdAt.split('T')[0];
          if (!dailyMap.has(date)) {
            dailyMap.set(date, { date, total: 0, count: 0, transactions: [] });
          }
          const daily = dailyMap.get(date)!;
          daily.total += tx.amount;
          daily.count += 1;
          daily.transactions.push(tx);
        });
        setDailyRevenue(dailyMap);
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
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSearch = () => {
    setSearchTerm(tempSearch);
  };

  const clearSearch = () => {
    setTempSearch("");
    setSearchTerm("");
  };

  const clearDateRange = () => {
    setStartDate("");
    setEndDate("");
  };

  // 달력 관련 함수
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    
    // 이전 달의 빈 칸
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // 현재 달의 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const selectedDayData = selectedDate ? dailyRevenue.get(selectedDate) : null;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">💰 매출 관리</h1>
        <p className="text-gray-600">전체 매출 현황과 거래 내역을 관리합니다</p>
      </div>

      {/* 필터 섹션 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            필터 및 검색
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 시작 날짜 */}
            <div>
              <label className="block text-sm font-medium mb-2">시작 날짜</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="시작 날짜"
              />
            </div>

            {/* 종료 날짜 */}
            <div>
              <label className="block text-sm font-medium mb-2">종료 날짜</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="종료 날짜"
              />
            </div>

            {/* 검색 */}
            <div>
              <label className="block text-sm font-medium mb-2">학원/거래ID 검색</label>
              <div className="flex gap-2">
                <Input
                  value={tempSearch}
                  onChange={(e) => setTempSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="학원명, 학원ID, 거래ID"
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 필터 초기화 */}
            <div className="flex items-end gap-2">
              {(startDate || endDate) && (
                <Button onClick={clearDateRange} variant="outline" size="sm">
                  날짜 초기화
                </Button>
              )}
              {searchTerm && (
                <Button onClick={clearSearch} variant="outline" size="sm">
                  검색 초기화
                </Button>
              )}
            </div>
          </div>

          {/* 활성 필터 표시 */}
          <div className="flex flex-wrap gap-2 mt-4">
            {startDate && (
              <Badge variant="secondary">
                시작: {startDate}
              </Badge>
            )}
            {endDate && (
              <Badge variant="secondary">
                종료: {endDate}
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="secondary">
                검색: {searchTerm}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* 총 매출 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">총 매출 (누적)</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">전체 기간</p>
          </CardContent>
        </Card>

        {/* 이번 달 매출 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">이번 달 매출</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.thisMonthRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">현재 월</p>
          </CardContent>
        </Card>

        {/* 성장률 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">성장률 (전월 대비)</CardTitle>
            {stats.growth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.growth >= 0 ? '+' : ''}{stats.growth}%
            </div>
            <p className="text-xs text-gray-500 mt-1">전월 대비</p>
          </CardContent>
        </Card>

        {/* 거래 건수 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">거래 건수</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.transactionCount}건</div>
            <p className="text-xs text-gray-500 mt-1">전체 거래</p>
          </CardContent>
        </Card>
      </div>

      {/* 세부 매출 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* 포인트 충전 매출 */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">💰 포인트 충전 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(stats.pointRevenue || 0)}
            </div>
            <p className="text-xs text-gray-600 mt-1">포인트 충전 총액</p>
            {stats.vatInfo && (
              <div className="mt-2 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">VAT (10%):</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(stats.vatInfo.pointVAT || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="text-gray-600">순 매출:</span>
                  <span className="font-semibold text-amber-700">
                    {formatCurrency(stats.vatInfo.pointNetRevenue || 0)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI 쇼핑몰 매출 */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">🛒 AI 쇼핑몰 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.botRevenue || 0)}
            </div>
            <p className="text-xs text-gray-600 mt-1">AI 봇 구독 총액</p>
            {stats.vatInfo && (
              <div className="mt-2 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">VAT (10%):</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(stats.vatInfo.botVAT || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="text-gray-600">순 매출:</span>
                  <span className="font-semibold text-blue-700">
                    {formatCurrency(stats.vatInfo.botNetRevenue || 0)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 기타 매출 */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">📊 기타 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.regularRevenue || 0)}
            </div>
            <p className="text-xs text-gray-600 mt-1">일반 매출 (수업료 등)</p>
            {stats.vatInfo && (
              <div className="mt-2 text-xs space-y-1">
                <div className="flex justify-between border-t pt-1">
                  <span className="text-gray-600">전체 VAT:</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(stats.vatInfo.totalVAT || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="text-gray-600">전체 순 매출:</span>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(stats.vatInfo.totalNetRevenue || 0)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 월별 매출 추이 */}
        <Card>
          <CardHeader>
            <CardTitle>월별 매출 추이</CardTitle>
            <CardDescription>최근 12개월 매출 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  labelFormatter={(label) => `월: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3B82F6" 
                  name="매출" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 유형별 매출 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>유형별 매출 분포</CardTitle>
            <CardDescription>결제 유형별 매출 비율</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.type}: ${formatCurrency(entry.total)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {typeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 학원별 매출 순위 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            학원별 매출 순위 (상위 10개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {academyStats.slice(0, 10).map((academy, index) => (
              <div key={academy.academyId} className="p-4 bg-gray-50 rounded-lg border hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl ${index < 3 ? 'font-bold' : ''}`}>
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `${index + 1}.`}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{academy.academyName}</div>
                      <div className="text-sm text-gray-500">
                        {academy.transactionCount}건 거래 · ID: {academy.academyId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">
                      {formatCurrency(academy.totalAmount)}
                    </div>
                  </div>
                </div>
                {/* 매출 유형별 상세 */}
                {(academy.pointAmount || academy.botAmount || academy.subscriptionAmount || academy.otherAmount) ? (
                  <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {academy.pointAmount ? (
                      <div className="bg-amber-50 p-2 rounded">
                        <div className="text-xs text-gray-600">포인트 충전</div>
                        <div className="font-semibold text-amber-700">{formatCurrency(academy.pointAmount)}</div>
                      </div>
                    ) : null}
                    {academy.botAmount ? (
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs text-gray-600">AI 쇼핑몰</div>
                        <div className="font-semibold text-blue-700">{formatCurrency(academy.botAmount)}</div>
                      </div>
                    ) : null}
                    {academy.subscriptionAmount ? (
                      <div className="bg-purple-50 p-2 rounded">
                        <div className="text-xs text-gray-600">일반 구독</div>
                        <div className="font-semibold text-purple-700">{formatCurrency(academy.subscriptionAmount)}</div>
                      </div>
                    ) : null}
                    {academy.otherAmount ? (
                      <div className="bg-green-50 p-2 rounded">
                        <div className="text-xs text-gray-600">기타 매출</div>
                        <div className="font-semibold text-green-700">{formatCurrency(academy.otherAmount)}</div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 뷰 모드 전환 버튼 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">거래 내역</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode("list")}
            variant={viewMode === "list" ? "default" : "outline"}
          >
            목록 보기
          </Button>
          <Button
            onClick={() => setViewMode("calendar")}
            variant={viewMode === "calendar" ? "default" : "outline"}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            달력 보기
          </Button>
        </div>
      </div>

      {/* 목록 뷰 */}
      {viewMode === "list" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>최근 거래 내역</CardTitle>
                <CardDescription>최근 20개 결제 및 매출 내역</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={generateSampleData}>
                  샘플 데이터 생성
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  내보내기
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">학원명</th>
                    <th className="text-left p-3">거래ID</th>
                    <th className="text-right p-3">금액</th>
                    <th className="text-center p-3">유형</th>
                    <th className="text-center p-3">결제수단</th>
                    <th className="text-center p-3">날짜</th>
                    <th className="text-center p-3">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{transaction.academyName || transaction.academyId}</td>
                      <td className="p-3 text-sm text-gray-600">{transaction.transactionId || '-'}</td>
                      <td className="p-3 text-right font-bold text-blue-600">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline">{transaction.type}</Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="secondary">{transaction.paymentMethod || '카드'}</Badge>
                      </td>
                      <td className="p-3 text-center text-sm">{formatDate(transaction.createdAt)}</td>
                      <td className="p-3 text-center">
                        <Badge 
                          variant={transaction.status === "completed" ? "default" : "secondary"}
                          className={transaction.status === "completed" ? "bg-green-500" : ""}
                        >
                          {transaction.status === "completed" ? "완료" : transaction.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  거래 내역이 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 달력 뷰 */}
      {viewMode === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 달력 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={goToPreviousMonth} size="sm" variant="outline">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button onClick={goToNextMonth} size="sm" variant="outline">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {/* 요일 헤더 */}
                {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                  <div key={day} className="text-center font-semibold p-2 text-sm">
                    {day}
                  </div>
                ))}

                {/* 날짜 */}
                {getDaysInMonth(currentMonth).map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="p-2" />;
                  }

                  const dateKey = formatDateKey(date);
                  const dayData = dailyRevenue.get(dateKey);
                  const isSelected = selectedDate === dateKey;
                  const isToday = dateKey === formatDateKey(new Date());

                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDate(dateKey)}
                      className={`
                        p-2 rounded-lg text-center transition-colors min-h-[80px] flex flex-col justify-between
                        ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}
                        ${isToday ? 'ring-2 ring-blue-500' : ''}
                        ${dayData ? 'border-2 border-green-500' : ''}
                      `}
                    >
                      <div className="text-sm font-semibold">{date.getDate()}</div>
                      {dayData && (
                        <div className={`text-xs ${isSelected ? 'text-white' : 'text-green-600'}`}>
                          <div className="font-bold">{dayData.count}건</div>
                          <div>{formatCurrency(dayData.total)}</div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 선택된 날짜의 거래 내역 */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? formatDate(selectedDate) : '날짜를 선택하세요'}
              </CardTitle>
              {selectedDayData && (
                <CardDescription>
                  총 {selectedDayData.count}건 · {formatCurrency(selectedDayData.total)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {selectedDayData ? (
                <div className="space-y-3">
                  {selectedDayData.transactions.map((tx) => (
                    <div key={tx.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold">{tx.academyName || tx.academyId}</div>
                        <Badge variant="outline">{tx.type}</Badge>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(tx.amount)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {tx.paymentMethod || '카드'} · {new Date(tx.createdAt).toLocaleTimeString('ko-KR')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  달력에서 날짜를 선택하면<br />해당 날짜의 거래 내역을 볼 수 있습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
