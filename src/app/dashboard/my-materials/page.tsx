"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  FileText,
  Link as LinkIcon,
  Video,
  FileQuestion,
  Eye,
  Clock,
  User,
  Filter,
  Search,
  CheckCircle,
  PlayCircle,
  Download,
  ExternalLink,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Material {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  grade: string;
  category: string;
  contentType: string;
  contentUrl: string | null;
  content: string | null;
  duration: number | null;
  difficulty: string;
  viewCount: number;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  progress?: {
    status: string;
    progress: number;
    timeSpent: number;
    completedAt: string | null;
  };
}

export default function MyMaterialsPage() {
  const { data: session } = useSession();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [searchQuery, selectedSubject, selectedGrade, selectedStatus, materials]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/materials");

      if (!response.ok) {
        throw new Error("Failed to fetch materials");
      }

      const data = await response.json();
      setMaterials(data.materials || []);
      setFilteredMaterials(data.materials || []);
    } catch (error) {
      console.error("❌ 학습 자료 조회 오류:", error);
      alert("학습 자료를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const filterMaterials = () => {
    let filtered = [...materials];

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query) ||
          m.subject.toLowerCase().includes(query)
      );
    }

    // 과목 필터
    if (selectedSubject !== "all") {
      filtered = filtered.filter((m) => m.subject === selectedSubject);
    }

    // 학년 필터
    if (selectedGrade !== "all") {
      filtered = filtered.filter((m) => m.grade === selectedGrade);
    }

    // 진행 상태 필터
    if (selectedStatus !== "all") {
      filtered = filtered.filter((m) => {
        if (selectedStatus === "completed") {
          return m.progress?.status === "COMPLETED";
        } else if (selectedStatus === "in_progress") {
          return m.progress?.status === "IN_PROGRESS";
        } else if (selectedStatus === "not_started") {
          return !m.progress || m.progress.status === "NOT_STARTED";
        }
        return true;
      });
    }

    setFilteredMaterials(filtered);
  };

  const handleView = async (material: Material) => {
    // 조회수 증가
    try {
      await fetch(`/api/materials/${material.id}/view`, {
        method: "POST",
      });
    } catch (error) {
      console.error("조회수 업데이트 오류:", error);
    }

    // 자료 열기
    if (material.contentUrl) {
      window.open(material.contentUrl, "_blank");
    } else if (material.content) {
      // 텍스트 콘텐츠는 모달로 표시 (추후 구현)
      alert(material.content);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5 text-red-500" />;
      case "pdf":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "link":
        return <LinkIcon className="h-5 w-5 text-purple-500" />;
      case "text":
        return <FileQuestion className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "HARD":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getProgressBadge = (material: Material) => {
    if (!material.progress) {
      return <Badge variant="outline">미학습</Badge>;
    }

    switch (material.progress.status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            완료
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue-500">
            <PlayCircle className="h-3 w-3 mr-1" />
            학습 중 ({material.progress.progress}%)
          </Badge>
        );
      default:
        return <Badge variant="outline">미학습</Badge>;
    }
  };

  const subjects = ["수학", "영어", "국어", "과학", "사회", "기타"];
  const grades = ["초1", "초2", "초3", "초4", "초5", "초6", "중1", "중2", "중3", "고1", "고2", "고3"];

  // 통계 계산
  const stats = {
    total: materials.length,
    completed: materials.filter((m) => m.progress?.status === "COMPLETED").length,
    inProgress: materials.filter((m) => m.progress?.status === "IN_PROGRESS").length,
    notStarted: materials.filter((m) => !m.progress || m.progress.status === "NOT_STARTED").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">학습 자료를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📚 내 학습 자료</h1>
        <p className="text-gray-600">선생님이 제공한 학습 자료를 확인하고 학습하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 자료</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}개</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}개</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">학습 중</CardTitle>
            <PlayCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}개</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">미학습</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.notStarted}개</div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            검색 및 필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="자료 제목, 설명, 과목으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 필터 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="과목 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 과목</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="학년 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 학년</SelectItem>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="진행 상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 상태</SelectItem>
                    <SelectItem value="completed">완료</SelectItem>
                    <SelectItem value="in_progress">학습 중</SelectItem>
                    <SelectItem value="not_started">미학습</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 자료 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchQuery || selectedSubject !== "all" || selectedGrade !== "all" || selectedStatus !== "all"
                    ? "검색 결과가 없습니다."
                    : "아직 등록된 학습 자료가 없습니다."}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredMaterials.map((material) => (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getContentTypeIcon(material.contentType)}
                    <Badge className={getDifficultyColor(material.difficulty)}>
                      {material.difficulty === "EASY" && "쉬움"}
                      {material.difficulty === "MEDIUM" && "보통"}
                      {material.difficulty === "HARD" && "어려움"}
                    </Badge>
                  </div>
                  {getProgressBadge(material)}
                </div>
                <CardTitle className="text-lg">{material.title}</CardTitle>
                <CardDescription>{material.description || "설명이 없습니다"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* 정보 */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{material.subject}</Badge>
                    <Badge variant="outline">{material.grade}</Badge>
                    <Badge variant="outline">{material.category}</Badge>
                  </div>

                  {/* 통계 */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{material.viewCount}회</span>
                    </div>
                    {material.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{material.duration}분</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <User className="h-4 w-4" />
                    <span>{material.createdBy.name} 선생님</span>
                  </div>

                  {/* 진행률 표시 */}
                  {material.progress && material.progress.status === "IN_PROGRESS" && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>학습 진행률</span>
                        <span>{material.progress.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${material.progress.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <Button
                    className="w-full"
                    onClick={() => handleView(material)}
                  >
                    {material.progress?.status === "COMPLETED" ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        다시 보기
                      </>
                    ) : material.progress?.status === "IN_PROGRESS" ? (
                      <>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        이어서 학습
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        학습 시작
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
