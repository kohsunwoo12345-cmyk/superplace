"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Video, Download, Search, Filter, ArrowLeft } from "lucide-react";

export default function StudentMaterialsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/student-login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
      // TODO: Fetch materials from API
      setMaterials([
        {
          id: 1,
          subject: "수학",
          title: "중등 수학 개념 정리",
          type: "PDF",
          date: "2026-02-20",
          size: "2.5MB"
        },
        {
          id: 2,
          subject: "영어",
          title: "영문법 기초 동영상 강의",
          type: "Video",
          date: "2026-02-18",
          size: "150MB"
        },
        {
          id: 3,
          subject: "과학",
          title: "물리 실험 자료",
          type: "PDF",
          date: "2026-02-15",
          size: "5.2MB"
        }
      ]);
    } catch (e) {
      router.push("/student-login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로
          </Button>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            학습 자료
          </h1>
          <p className="text-gray-600">다양한 학습 자료를 확인하고 다운로드하세요</p>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="자료 검색..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                필터
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {material.type === "PDF" ? (
                      <FileText className="h-8 w-8 text-red-500" />
                    ) : material.type === "Video" ? (
                      <Video className="h-8 w-8 text-blue-500" />
                    ) : (
                      <BookOpen className="h-8 w-8 text-green-500" />
                    )}
                    <div>
                      <span className="text-xs font-semibold text-gray-500">{material.subject}</span>
                      <CardTitle className="text-base">{material.title}</CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>형식:</span>
                    <span className="font-semibold">{material.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>업로드:</span>
                    <span>{material.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>크기:</span>
                    <span>{material.size}</span>
                  </div>
                </div>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  다운로드
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {materials.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">아직 등록된 학습 자료가 없습니다.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
