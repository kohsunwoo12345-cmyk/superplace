"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Search, Globe, Youtube, ExternalLink } from "lucide-react";

export default function GoogleTrendsPage() {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSearch = async () => {
    if (!keyword) {
      alert("키워드를 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tools/google-trends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword, category }),
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

  const openGoogleTrends = () => {
    const url = `https://trends.google.co.kr/trends/explore?q=${encodeURIComponent(keyword)}&hl=ko`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">구글 트렌드 분석</h1>
        <p className="text-gray-600 mt-1">
          유튜브 및 구글 검색 트렌드를 분석합니다
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Search Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>키워드 검색</CardTitle>
            <CardDescription>분석할 키워드를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">키워드</Label>
              <Input
                id="keyword"
                placeholder="예: 디지털 마케팅"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="youtube">유튜브</SelectItem>
                  <SelectItem value="web">웹 검색</SelectItem>
                  <SelectItem value="news">뉴스</SelectItem>
                  <SelectItem value="shopping">쇼핑</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSearch}
              disabled={loading}
              className="w-full"
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? "분석 중..." : "트렌드 분석"}
            </Button>

            <Button
              onClick={openGoogleTrends}
              variant="outline"
              className="w-full"
              disabled={!keyword}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              구글 트렌드에서 보기
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {!results ? (
            <Card>
              <CardContent className="text-center py-12">
                <Globe className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">키워드를 입력하고 검색하세요</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    트렌드 개요
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{results.trendScore}</div>
                      <div className="text-sm text-gray-600 mt-1">트렌드 지수</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{results.interest}</div>
                      <div className="text-sm text-gray-600 mt-1">관심도</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">{results.growth}%</div>
                      <div className="text-sm text-gray-600 mt-1">성장률</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-3xl font-bold text-orange-600">{results.competitionLevel}</div>
                      <div className="text-sm text-gray-600 mt-1">경쟁도</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>검색 트렌드 (최근 12개월)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.trendData.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="text-sm text-gray-600 w-16">{item.month}</div>
                        <div className="flex-1">
                          <div className="bg-gray-200 rounded-full h-8 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full flex items-center justify-end pr-2 text-white text-sm font-medium"
                              style={{ width: `${item.value}%` }}
                            >
                              {item.value}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Related Keywords */}
              <Card>
                <CardHeader>
                  <CardTitle>관련 검색어</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {results.relatedKeywords.map((kw: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setKeyword(kw)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>AI 인사이트</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.insights.map((insight: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* YouTube Specific */}
              {category === 'youtube' && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Youtube className="h-5 w-5 text-red-600" />
                      유튜브 콘텐츠 전략
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p>• 추천 영상 길이: {results.youtubeRecommendations?.videoLength || '8-12분'}</p>
                      <p>• 최적 업로드 시간: {results.youtubeRecommendations?.uploadTime || '저녁 7-9시'}</p>
                      <p>• 추천 썸네일 스타일: {results.youtubeRecommendations?.thumbnailStyle || '대비가 강한 텍스트 + 감정 표현'}</p>
                      <p>• 예상 조회수 범위: {results.youtubeRecommendations?.expectedViews || '5,000-50,000 (첫 달)'}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
