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
  Code,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Loader2,
  FileCode,
  Copy,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  html: string;
  variables: string[]; // {{studentName}}, {{period}}, {{attendanceRate}} 등
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    html: "",
  });
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("토큰이 없습니다");
        alert("로그인이 필요합니다.");
        return;
      }
      
      // 토큰 형식 확인
      console.log("📍 Current token:", token);
      console.log("📍 Token separator check:", {
        hasPipe: token.includes('|'),
        hasDot: token.includes('.'),
        pipeCount: (token.match(/\|/g) || []).length,
        dotCount: (token.match(/\./g) || []).length
      });
      
      // 구 토큰(. 구분자)이면 경고
      if (!token.includes('|') && token.includes('.')) {
        console.warn("⚠️ Old token format detected (dot separator). Please re-login!");
        alert("토큰 형식이 업데이트되었습니다.\n다시 로그인해주세요.");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/landing/templates", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      console.log("템플릿 목록 조회 응답:", data);

      if (response.ok && data.success) {
        setTemplates(data.templates || []);
        
        // 메시지가 있으면 표시
        if (data.message) {
          alert(data.message);
        }
      } else {
        console.error("템플릿 목록 조회 실패:", data);
        alert(`템플릿 목록을 불러오지 못했습니다.\n\n오류: ${data.error || data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("템플릿 목록 조회 실패:", error);
      alert(`템플릿 목록을 불러오지 못했습니다.\n\n상세: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template?: Template) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description,
        html: template.html,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: "",
        description: "",
        html: DEFAULT_TEMPLATE,
      });
    }
    setDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!formData.name.trim()) {
      alert("템플릿 이름을 입력해주세요.");
      return;
    }

    if (!formData.html.trim()) {
      alert("HTML 코드를 입력해주세요.");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const url = "/api/landing/templates";
      const method = editingTemplate ? "PUT" : "POST";
      const body = editingTemplate
        ? { ...formData, id: editingTemplate.id }
        : formData;

      console.log("템플릿 저장 요청:", { method, body });

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      console.log("템플릿 저장 응답:", result);

      if (response.ok && result.success) {
        alert(editingTemplate ? "템플릿이 수정되었습니다. ✅" : "템플릿이 생성되었습니다. ✅");
        setDialogOpen(false);
        setFormData({ name: "", description: "", html: "" });
        setEditingTemplate(null);
        await fetchTemplates();
      } else {
        const errorMsg = result.error || result.message || "저장 실패";
        console.error("저장 실패 상세:", result);
        alert(`저장 중 오류가 발생했습니다.\n\n오류: ${errorMsg}`);
      }
    } catch (error) {
      console.error("템플릿 저장 실패:", error);
      alert(`저장 중 오류가 발생했습니다.\n\n상세: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string, name: string, usageCount: number) => {
    if (usageCount > 0) {
      alert(`"${name}" 템플릿은 ${usageCount}개의 랜딩페이지에서 사용 중이어서 삭제할 수 없습니다.`);
      return;
    }

    if (!confirm(`"${name}" 템플릿을 삭제하시겠습니까?`)) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/landing/templates?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      console.log("템플릿 삭제 응답:", result);

      if (response.ok && result.success) {
        alert("템플릿이 삭제되었습니다. ✅");
        await fetchTemplates();
      } else {
        const errorMsg = result.error || result.message || "삭제 실패";
        alert(`삭제 중 오류가 발생했습니다.\n\n오류: ${errorMsg}`);
      }
    } catch (error) {
      console.error("템플릿 삭제 실패:", error);
      alert(`삭제 중 오류가 발생했습니다.\n\n상세: ${error.message || error}`);
    }
  };

  const handlePreview = (html: string) => {
    // 변수를 샘플 데이터로 치환
    let previewHtml = html
      .replace(/\{\{studentName\}\}/g, "김철수")
      .replace(/\{\{period\}\}/g, "2024-01-01 ~ 2024-01-31")
      .replace(/\{\{attendanceRate\}\}/g, "95%")
      .replace(/\{\{totalDays\}\}/g, "20일")
      .replace(/\{\{presentDays\}\}/g, "19일")
      .replace(/\{\{aiChatCount\}\}/g, "45회")
      .replace(/\{\{homeworkRate\}\}/g, "90%");

    setPreviewHtml(previewHtml);
    setPreviewOpen(true);
  };

  const handleDuplicate = (template: Template) => {
    setEditingTemplate(null);
    setFormData({
      name: `${template.name} (복사본)`,
      description: template.description,
      html: template.html,
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="lg" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                뒤로가기
              </Button>
              <div>
                <h1 className="text-4xl font-bold flex items-center gap-3 text-purple-700">
                  <FileCode className="h-10 w-10" />
                  📄 HTML 템플릿 관리
                </h1>
                <p className="text-gray-600 mt-3 text-lg">
                  학생 학습 리포트 랜딩페이지의 기본 HTML 템플릿을 관리하세요
                </p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  ✨ 새 템플릿 만들기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? "템플릿 수정" : "새 템플릿 만들기"}
                  </DialogTitle>
                  <DialogDescription>
                    학생 학습 데이터를 표시할 HTML 템플릿을 {editingTemplate ? "수정" : "생성"}하세요
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">템플릿 이름 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="예: 기본 학습 리포트, 월간 리포트 등"
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
                      placeholder="템플릿에 대한 간단한 설명"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="html">HTML 코드 *</Label>
                    <Textarea
                      id="html"
                      value={formData.html}
                      onChange={(e) =>
                        setFormData({ ...formData, html: e.target.value })
                      }
                      placeholder="HTML 코드 입력..."
                      rows={20}
                      className="font-mono text-sm"
                    />
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-semibold text-blue-800 mb-2">
                        💡 사용 가능한 변수:
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                        <code>{"{{studentName}}"}</code>
                        <code>{"{{period}}"}</code>
                        <code>{"{{attendanceRate}}"}</code>
                        <code>{"{{totalDays}}"}</code>
                        <code>{"{{presentDays}}"}</code>
                        <code>{"{{absentDays}}"}</code>
                        <code>{"{{tardyDays}}"}</code>
                        <code>{"{{aiChatCount}}"}</code>
                        <code>{"{{homeworkRate}}"}</code>
                        <code>{"{{homeworkCompleted}}"}</code>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => handlePreview(formData.html)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    미리보기
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={saving}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSaveTemplate}
                    disabled={saving}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        저장 중...
                      </>
                    ) : editingTemplate ? (
                      "수정하기"
                    ) : (
                      "생성하기"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 가이드 배너 */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-3">🎨 템플릿 제작 가이드</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded p-3">
              <p className="font-semibold mb-1">1️⃣ HTML 작성</p>
              <p className="text-sm">기본 레이아웃과 스타일 정의</p>
            </div>
            <div className="bg-white/10 rounded p-3">
              <p className="font-semibold mb-1">2️⃣ 변수 삽입</p>
              <p className="text-sm">{"{{studentName}}"} 등 변수 사용</p>
            </div>
            <div className="bg-white/10 rounded p-3">
              <p className="font-semibold mb-1">3️⃣ 미리보기</p>
              <p className="text-sm">샘플 데이터로 확인 후 저장</p>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                총 템플릿
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {templates.length}개
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                기본 템플릿
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">
                {templates.filter((t) => t.isDefault).length}개
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                총 사용 횟수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {templates.reduce((sum, t) => sum + t.usageCount, 0)}회
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 템플릿 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileCode className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">아직 생성된 템플릿이 없습니다.</p>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  첫 템플릿 만들기
                </Button>
              </CardContent>
            </Card>
          ) : (
            templates.map((template) => (
              <Card
                key={template.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="flex items-center gap-2">
                          <Code className="w-5 h-5 text-purple-600" />
                          {template.name}
                        </CardTitle>
                        {template.isDefault && (
                          <Badge variant="default">기본</Badge>
                        )}
                      </div>
                      {template.description && (
                        <CardDescription className="mt-2">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">사용 횟수</span>
                      <Badge variant={template.usageCount > 0 ? "default" : "secondary"}>
                        {template.usageCount}회
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      생성일: {new Date(template.createdAt).toLocaleDateString("ko-KR")}
                    </div>
                    <div className="flex gap-2 pt-2 border-t flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(template.html)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        미리보기
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(template)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        복사
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(template)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDeleteTemplate(template.id, template.name, template.usageCount)
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

      {/* 미리보기 다이얼로그 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>템플릿 미리보기</DialogTitle>
            <DialogDescription>
              샘플 데이터로 렌더링된 템플릿을 확인하세요
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-6 bg-white">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 기본 템플릿
const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{studentName}} 학생의 학습 리포트</title>
  <style>
    body {
      font-family: 'Noto Sans KR', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f9fafb;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #4F46E5;
      font-size: 32px;
      margin-bottom: 10px;
    }
    .period {
      color: #6B7280;
      font-size: 16px;
      margin-bottom: 30px;
    }
    .section {
      margin: 30px 0;
      padding: 20px;
      background: #F3F4F6;
      border-radius: 8px;
    }
    .section h2 {
      color: #374151;
      font-size: 20px;
      margin-bottom: 15px;
    }
    .stat {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    .stat:last-child {
      border-bottom: none;
    }
    .stat-label {
      color: #6B7280;
    }
    .stat-value {
      font-weight: 600;
      color: #111827;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>{{studentName}} 학생의 학습 리포트</h1>
    <div class="period">📅 기간: {{period}}</div>
    
    <div class="section">
      <h2>📊 출결 현황</h2>
      <div class="stat">
        <span class="stat-label">전체 수업일</span>
        <span class="stat-value">{{totalDays}}</span>
      </div>
      <div class="stat">
        <span class="stat-label">출석</span>
        <span class="stat-value">{{presentDays}}</span>
      </div>
      <div class="stat">
        <span class="stat-label">출석률</span>
        <span class="stat-value">{{attendanceRate}}</span>
      </div>
    </div>
    
    <div class="section">
      <h2>💬 AI 대화 활동</h2>
      <div class="stat">
        <span class="stat-label">총 대화 횟수</span>
        <span class="stat-value">{{aiChatCount}}회</span>
      </div>
    </div>
    
    <div class="section">
      <h2>📝 숙제 제출 현황</h2>
      <div class="stat">
        <span class="stat-label">숙제 완료율</span>
        <span class="stat-value">{{homeworkRate}}</span>
      </div>
      <div class="stat">
        <span class="stat-label">완료한 숙제</span>
        <span class="stat-value">{{homeworkCompleted}}개</span>
      </div>
    </div>
  </div>
</body>
</html>`;
