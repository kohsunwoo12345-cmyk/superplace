"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ArrowLeft,
  Save,
  X,
} from "lucide-react";

interface Template {
  id: number;
  title: string;
  content: string;
  folder_id?: number;
  created_at: string;
}

interface Folder {
  id: number;
  name: string;
  template_count: number;
}

export default function SMSTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ title: "", content: "", folder_id: null as number | null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [templatesRes, foldersRes] = await Promise.all([
        fetch("/api/admin/sms/templates", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/sms/folders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data.templates || []);
      }

      if (foldersRes.ok) {
        const data = await foldersRes.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.title.trim() || !newTemplate.content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/sms/templates", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTemplate),
      });

      if (response.ok) {
        alert("템플릿이 생성되었습니다!");
        setShowCreateModal(false);
        setNewTemplate({ title: "", content: "", folder_id: null });
        fetchData();
      }
    } catch (error) {
      console.error("템플릿 생성 실패:", error);
      alert("생성 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/sms/templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editingTemplate.title,
          content: editingTemplate.content,
          folder_id: editingTemplate.folder_id,
        }),
      });

      if (response.ok) {
        alert("템플릿이 수정되었습니다!");
        setEditingTemplate(null);
        fetchData();
      }
    } catch (error) {
      console.error("템플릿 수정 실패:", error);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/sms/templates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("템플릿이 삭제되었습니다!");
        fetchData();
      }
    } catch (error) {
      console.error("템플릿 삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FileText className="h-8 w-8 text-blue-600" />
                SMS 템플릿 관리
              </h1>
              <p className="text-gray-600 mt-1">자주 사용하는 메시지를 템플릿으로 저장하세요</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            새 템플릿
          </Button>
        </div>

        {/* 템플릿 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">생성된 템플릿이 없습니다.</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  첫 템플릿 만들기
                </Button>
              </CardContent>
            </Card>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  <CardDescription>
                    {new Date(template.created_at).toLocaleDateString("ko-KR")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 line-clamp-4 whitespace-pre-wrap">
                      {template.content}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 생성 모달 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>새 템플릿 만들기</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>템플릿 제목</Label>
                  <Input
                    placeholder="예: 학습 리포트 발송"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label>메시지 내용</Label>
                  <Textarea
                    placeholder="메시지 내용을 입력하세요..."
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    rows={8}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {new Blob([newTemplate.content]).size}바이트
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateTemplate} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    취소
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 수정 모달 */}
        {editingTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>템플릿 수정</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>템플릿 제목</Label>
                  <Input
                    value={editingTemplate.title}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>메시지 내용</Label>
                  <Textarea
                    value={editingTemplate.content}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, content: e.target.value })
                    }
                    rows={8}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {new Blob([editingTemplate.content]).size}바이트
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleUpdateTemplate} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                  <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                    취소
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
