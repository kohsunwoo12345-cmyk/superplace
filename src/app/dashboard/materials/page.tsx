"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  FileText,
  Upload,
  Plus,
  Link as LinkIcon,
  Video,
  FileQuestion,
  Edit,
  Trash2,
  Eye,
  Clock,
  User,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  isPublished: boolean;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  _count: {
    progress: number;
  };
}

export default function MaterialsPage() {
  const { data: session } = useSession();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");

  // 폼 상태
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    grade: "",
    category: "",
    contentType: "link",
    contentUrl: "",
    content: "",
    duration: "",
    difficulty: "MEDIUM",
    tags: [] as string[],
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [selectedSubject, selectedGrade, materials]);

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

    if (selectedSubject !== "all") {
      filtered = filtered.filter((m) => m.subject === selectedSubject);
    }

    if (selectedGrade !== "all") {
      filtered = filtered.filter((m) => m.grade === selectedGrade);
    }

    setFilteredMaterials(filtered);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "학습 자료 생성에 실패했습니다.");
        return;
      }

      alert("학습 자료가 생성되었습니다!");
      setIsCreateOpen(false);
      setFormData({
        title: "",
        description: "",
        subject: "",
        grade: "",
        category: "",
        contentType: "link",
        contentUrl: "",
        content: "",
        duration: "",
        difficulty: "MEDIUM",
        tags: [],
      });
      fetchMaterials();
    } catch (error) {
      console.error("❌ 학습 자료 생성 오류:", error);
      alert("학습 자료 생성 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 학습 자료를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/materials?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "삭제에 실패했습니다.");
        return;
      }

      alert("학습 자료가 삭제되었습니다.");
      fetchMaterials();
    } catch (error) {
      console.error("❌ 삭제 오류:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "link":
        return <LinkIcon className="h-4 w-4" />;
      case "text":
        return <FileQuestion className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
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

  const subjects = ["수학", "영어", "국어", "과학", "사회", "기타"];
  const grades = ["초1", "초2", "초3", "초4", "초5", "초6", "중1", "중2", "중3", "고1", "고2", "고3"];
  const categories = ["강의", "교재", "연습문제", "시험", "참고자료", "기타"];

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">학습 자료</h1>
          <p className="text-gray-600">학생들에게 제공할 학습 자료를 관리합니다</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              자료 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 학습 자료 추가</DialogTitle>
              <DialogDescription>
                학생들이 학습할 수 있는 자료를 추가합니다
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* 제목 */}
              <div>
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="예: 1차 방정식 풀이법"
                  required
                />
              </div>

              {/* 설명 */}
              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="자료에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>

              {/* 과목, 학년, 카테고리 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="subject">과목 *</Label>
                  <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="grade">학년 *</Label>
                  <Select value={formData.grade} onValueChange={(value) => setFormData({ ...formData, grade: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">카테고리 *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 콘텐츠 타입 */}
              <div>
                <Label htmlFor="contentType">콘텐츠 타입 *</Label>
                <Select value={formData.contentType} onValueChange={(value) => setFormData({ ...formData, contentType: value })} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">링크 (외부 URL)</SelectItem>
                    <SelectItem value="video">동영상 URL</SelectItem>
                    <SelectItem value="pdf">PDF 파일 URL</SelectItem>
                    <SelectItem value="text">텍스트 콘텐츠</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* URL 또는 콘텐츠 */}
              {formData.contentType !== "text" ? (
                <div>
                  <Label htmlFor="contentUrl">URL *</Label>
                  <Input
                    id="contentUrl"
                    type="url"
                    value={formData.contentUrl}
                    onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                    placeholder="https://example.com/video.mp4"
                    required
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="content">텍스트 콘텐츠 *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="학습 내용을 입력하세요"
                    rows={6}
                    required
                  />
                </div>
              )}

              {/* 난이도, 예상 학습 시간 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">난이도</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">쉬움</SelectItem>
                      <SelectItem value="MEDIUM">보통</SelectItem>
                      <SelectItem value="HARD">어려움</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">예상 학습 시간 (분)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="30"
                    min="1"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  취소
                </Button>
                <Button type="submit">
                  <Upload className="w-4 h-4 mr-2" />
                  추가하기
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 필터 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>과목</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label>학년</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <p className="text-gray-600">등록된 학습 자료가 없습니다.</p>
                <p className="text-sm text-gray-500 mt-2">
                  '자료 추가' 버튼을 클릭하여 첫 자료를 추가해보세요.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredMaterials.map((material) => (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getContentTypeIcon(material.contentType)}
                    <CardTitle className="text-lg">{material.title}</CardTitle>
                  </div>
                  <Badge className={getDifficultyColor(material.difficulty)}>
                    {material.difficulty === "EASY" && "쉬움"}
                    {material.difficulty === "MEDIUM" && "보통"}
                    {material.difficulty === "HARD" && "어려움"}
                  </Badge>
                </div>
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
                      <span>{material.viewCount}회 조회</span>
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
                    <span>{material.createdBy.name}</span>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2 pt-2">
                    {material.contentUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(material.contentUrl!, "_blank")}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        보기
                      </Button>
                    )}
                    {(session?.user?.id === material.createdBy.id || session?.user?.role === "SUPER_ADMIN") && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(material.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
