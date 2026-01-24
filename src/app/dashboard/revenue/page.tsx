'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Package,
  Users,
  BarChart3,
  Download,
  Filter,
} from 'lucide-react';

interface RevenueSummary {
  totalRevenue: number;
  paymentCount: number;
  avgPayment: number;
  currency: string;
}

interface ProductRevenue {
  productId: string;
  productName: string;
  plan: string;
  revenue: number;
  count: number;
}

interface PaymentMethodRevenue {
  method: string;
  revenue: number;
  count: number;
}

interface MonthlyTrend {
  month: string;
  revenue: number;
  count: number;
}

interface Payment {
  id: string;
  productName: string;
  plan: string;
  amount: number;
  paymentMethod: string | null;
  paidAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  academy: {
    id: string;
    name: string;
  };
}

interface RevenueStats {
  summary: RevenueSummary;
  byProduct: ProductRevenue[];
  byPaymentMethod: PaymentMethodRevenue[];
  monthlyTrend: MonthlyTrend[];
  recentPayments: Payment[];
}

export default function RevenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = session?.user?.role;
      if (userRole !== 'SUPER_ADMIN' && userRole !== 'DIRECTOR') {
        router.push('/dashboard');
      } else {
        fetchRevenueStats();
      }
    }
  }, [status, session, period]);

  const fetchRevenueStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/revenue/stats?period=${period}`, {
        credentials: 'include',
      });

      if (!res.ok) throw new Error('매출 통계를 불러올 수 없습니다.');

      const data = await res.json();
      setStats(data.data);
    } catch (error) {
      console.error('매출 통계 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul',
    });
  };

  const getPlanBadgeColor = (plan: string) => {
    const colors: Record<string, string> = {
      FREE: 'bg-gray-100 text-gray-800',
      BASIC: 'bg-blue-100 text-blue-800',
      PRO: 'bg-purple-100 text-purple-800',
      ENTERPRISE: 'bg-red-100 text-red-800',
    };
    return colors[plan] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentMethodName = (method: string | null) => {
    const methods: Record<string, string> = {
      CARD: '카드',
      BANK_TRANSFER: '계좌이체',
      VIRTUAL_ACCOUNT: '가상계좌',
      KAKAO_PAY: '카카오페이',
      NAVER_PAY: '네이버페이',
    };
    return methods[method || ''] || method || '미확인';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>매출 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-7 w-7" />
            매출 통계
          </h1>
          <p className="text-muted-foreground mt-1">
            실시간 매출 및 결제 현황을 확인하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">오늘</SelectItem>
              <SelectItem value="week">최근 7일</SelectItem>
              <SelectItem value="month">이번 달</SelectItem>
              <SelectItem value="year">올해</SelectItem>
              <SelectItem value="all">전체</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <p className="text-2xl font-bold">
                {formatCurrency(stats.summary.totalRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">결제 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <p className="text-2xl font-bold">{stats.summary.paymentCount}건</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">평균 결제 금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <p className="text-2xl font-bold">
                {formatCurrency(stats.summary.avgPayment)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 메뉴 */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent">
            <Calendar className="h-4 w-4 mr-2" />
            최근 결제
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            상품별
          </TabsTrigger>
          <TabsTrigger value="methods">
            <CreditCard className="h-4 w-4 mr-2" />
            결제 수단별
          </TabsTrigger>
        </TabsList>

        {/* 최근 결제 탭 */}
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>최근 결제 내역</CardTitle>
              <CardDescription>최근 10건의 결제 내역</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentPayments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>결제 내역이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentPayments.map((payment) => (
                    <Card key={payment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{payment.productName}</span>
                              <Badge className={getPlanBadgeColor(payment.plan)}>
                                {payment.plan}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {payment.user.name || payment.user.email}
                              </div>
                              <div>{payment.academy.name}</div>
                              <div>
                                {getPaymentMethodName(payment.paymentMethod)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDateTime(payment.paidAt)}
                              </div>
                            </div>

                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(payment.amount)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 상품별 탭 */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>상품별 매출</CardTitle>
              <CardDescription>상품별 매출 통계</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.byProduct.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>상품별 매출 데이터가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.byProduct.map((item, index) => (
                    <Card key={item.productId} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.productName}</span>
                                <Badge className={getPlanBadgeColor(item.plan)}>
                                  {item.plan}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {item.count}건 판매
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(item.revenue)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 결제 수단별 탭 */}
        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>결제 수단별 통계</CardTitle>
              <CardDescription>결제 수단별 매출 분석</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.byPaymentMethod.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>결제 수단별 데이터가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.byPaymentMethod.map((item) => (
                    <Card key={item.method} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-8 w-8 text-blue-600" />
                            <div>
                              <p className="font-medium">
                                {getPaymentMethodName(item.method)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {item.count}건
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(item.revenue)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {((item.revenue / stats.summary.totalRevenue) * 100).toFixed(
                                1
                              )}
                              %
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 월별 추이 */}
      {stats.monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              월별 매출 추이
            </CardTitle>
            <CardDescription>최근 12개월 매출 동향</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.monthlyTrend.map((item) => (
                <div
                  key={item.month}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{item.month}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.count}건
                    </span>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrency(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
