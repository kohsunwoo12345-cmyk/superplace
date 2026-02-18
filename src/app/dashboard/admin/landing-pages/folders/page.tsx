"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  FolderOpen,
  FolderPlus,
  Edit2,
  Trash2,
  FileText,
  Loader2,
} from "lucide-react";

interface Folder {
  id: string;
  name: string;
  description: string | null;
  pagesCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function FoldersPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/landing/folders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error("폴더 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (folder?: Folder) => {
    if (folder) {
      setEditingFolder(folder);
      setFormData({
        name: folder.name,
        description: folder.description || "",
      });
    } else {
      setEditingFolder(null);
      setFormData({ name: "", description: "" });
    }
    setDialogOpen(true);
  };

  const handleSaveFolder = async () => {
    if (!formData.name.trim()) {
      alert("폴더 이름을 입력해주세요.");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const url = "/api/landing/folders";
      const method = editingFolder ? "PUT" : "POST";
      const body = editingFolder
        ? { ...formData, id: editingFolder.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        alert(editingFolder ? "폴더가 수정되었습니다." : "폴더가 생성되었습니다.");
        setDialogOpen(false);
        fetchFolders();
      } else {
        throw new Error("저장 실패");
      }
    } catch (error) {
      console.error("폴더 저장 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFolder = async (id: string, name: string, pagesCount: number) => {
    if (pagesCount > 0) {
      alert(`"${name}" 폴더에 ${pagesCount}개의 랜딩페이지가 있어 삭제할 수 없습니다.`);
      return;
    }

    if (!confirm(`"${name}" 폴더를 삭제하시겠습니까?`)) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/landing/folders?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("폴더가 삭제되었습니다.");
        fetchFolders();
      } else {
        throw new Error("삭제 실패");
      }
    } catch (error) {
      console.error("폴더 삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FolderOpen className="h-8 w-8 text-indigo-600" />
                폴더 관리
              </h1>
              <p className="text-gray-600 mt-1">
                랜딩페이지를 폴더별로 분류하여 관리하세요
              </p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                새 폴더 만들기
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingFolder ? "폴더 수정" : "새 폴더 만들기"}
                </DialogTitle>
                <DialogDescription>
                  랜딩페이지를 분류할 폴더를 {editingFolder ? "수정" : "생성"}하세요
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">폴더 이름 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="예: 2024년 세미나, 학생 리포트 등"
                  />
                </div>
                <div>
                  <Label htmlFor="description">설명 (선택)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="폴더에 대한 간단한 설명"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={saving}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSaveFolder}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      저장 중...
                    </>
                  ) : editingFolder ? (
                    "수정하기"
                  ) : (
                    "생성하기"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 통계 */}
        <Card>
          <CardHeader>
            <CardTitle>폴더 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">총 폴더</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">
                  {folders.length}개
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">총 랜딩페이지</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {folders.reduce((sum, f) => sum + f.pagesCount, 0)}개
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">빈 폴더</p>
                <p className="text-3xl font-bold text-gray-600 mt-1">
                  {folders.filter((f) => f.pagesCount === 0).length}개
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 폴더 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FolderOpen className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">아직 생성된 폴더가 없습니다.</p>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  첫 폴더 만들기
                </Button>
              </CardContent>
            </Card>
          ) : (
            folders.map((folder) => (
              <Card
                key={folder.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-indigo-600" />
                        {folder.name}
                      </CardTitle>
                      {folder.description && (
                        <CardDescription className="mt-2">
                          {folder.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        <FileText className="w-4 h-4" />
                        랜딩페이지
                      </span>
                      <Badge variant={folder.pagesCount > 0 ? "default" : "secondary"}>
                        {folder.pagesCount}개
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      생성일: {new Date(folder.createdAt).toLocaleDateString("ko-KR")}
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(folder)}
                        className="flex-1"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDeleteFolder(folder.id, folder.name, folder.pagesCount)
                        }
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
