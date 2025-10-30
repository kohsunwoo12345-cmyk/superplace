"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Calendar, BarChart3 } from "lucide-react";

export default function NaverKeywordsPage() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      alert("키워드를 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tools/naver-keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword }),
      });

      if (!response.ok) {
        throw new Error("검색 실패");
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error:", error);
      alert("검색 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">네이버 키워드 분석</h1>
        <p className="text-gray-600 mt-1">
          키워드의 월간 검색량, 연간 트렌드를 분석합니다
        </p>
      </div>

      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle>키워드 검색</CardTitle>
          <CardDescription>분석하고 싶은 키워드를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="예: 학원 마케팅, 입시 컨설팅"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "검색 중..." : "검색"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                월간 검색량
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {results.monthlySearchVolume?.toLocaleString() || "N/A"}
              </div>
              <p className="text-sm text-gray-600 mt-1">지난 달 기준</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                연간 검색량
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {results.yearlySearchVolume?.toLocaleString() || "N/A"}
              </div>
              <p className="text-sm text-gray-600 mt-1">최근 12개월 합계</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                경쟁 강도
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {results.competition || "중간"}
              </div>
              <p className="text-sm text-gray-600 mt-1">광고 경쟁률</p>
            </CardContent>
          </Card>
        </div>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>연관 키워드</CardTitle>
            <CardDescription>추천 키워드 및 검색량</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.relatedKeywords?.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <span className="font-medium">{item.keyword}</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">
                      {item.searchVolume?.toLocaleString() || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500">월간 검색량</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
