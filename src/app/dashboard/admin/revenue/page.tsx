"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download, Filter } from "lucide-react";

export default function RevenuePage() {
  const [period, setPeriod] = useState("month");

  // 더미 데이터
  const revenueStats = {
    total: 12500000,
    thisMonth: 2300000,
    growth: 15.3,
    transactions: 145,
  };

  const recentTransactions = [
    { id: 1, academy: "A학원", amount: 150000, date: "2026-02-05", type: "구독료" },
    { id: 2, academy: "B학원", amount: 200000, date: "2026-02-04", type: "추가 기능" },
    { id: 3, academy: "C학원", amount: 150000, date: "2026-02-03", type: "구독료" },
    { id: 4, academy: "D학원", amount: 300000, date: "2026-02-02", type: "프리미엄" },
    { id: 5, academy: "E학원", amount: 150000, date: "2026-02-01", type: "구독료" },
  ];

  return (
    <div className="space-y-6">
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
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            필터
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
        <Card className="border-2 border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 매출</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {revenueStats.total.toLocaleString()}원
            </div>
            <p className="text-sm text-gray-500 mt-2">누적 매출</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">이번 달 매출</CardTitle>
            <Calendar className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {revenueStats.thisMonth.toLocaleString()}원
            </div>
            <p className="text-sm text-gray-500 mt-2">2026년 2월</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">성장률</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              +{revenueStats.growth}%
            </div>
            <p className="text-sm text-gray-500 mt-2">전월 대비</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">거래 건수</CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {revenueStats.transactions}건
            </div>
            <p className="text-sm text-gray-500 mt-2">이번 달</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>최근 거래 내역</CardTitle>
          <CardDescription>최근 결제 및 매출 내역</CardDescription>
        </CardHeader>
        <CardContent>
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
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{transaction.academy}</td>
                    <td className="py-3 px-4 font-semibold text-green-600">
                      {transaction.amount.toLocaleString()}원
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        {transaction.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{transaction.date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                        완료
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline">더 보기</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
