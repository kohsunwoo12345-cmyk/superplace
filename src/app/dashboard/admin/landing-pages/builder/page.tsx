"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Type,
  Image as ImageIcon,
  Mail,
  Phone,
  CheckSquare,
} from "lucide-react";

interface CustomField {
  id: string;
  type: "text" | "textarea" | "email" | "phone" | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
  order: number;
}

interface LandingPageData {
  title: string;
  description: string;
  template_html: string;
  custom_fields: CustomField[];
  og_title: string;
  og_description: string;
  thumbnail_url: string;
}

export default function LandingPageBuilderPage() {
  const router = useRouter();
  const [data, setData] = useState<LandingPageData>({
    title: "",
    description: "",
    template_html: "",
    custom_fields: [],
    og_title: "",
    og_description: "",
    thumbnail_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fieldTypes = [
    { type: "text", label: "텍스트 입력", icon: Type },
    { type: "textarea", label: "긴 텍스트", icon: Type },
    { type: "email", label: "이메일", icon: Mail },
    { type: "phone", label: "전화번호", icon: Phone },
    { type: "checkbox", label: "체크박스", icon: CheckSquare },
  ];

  const addCustomField = (type: CustomField["type"]) => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      type,
      label: "",
      placeholder: "",
      required: false,
      order: data.custom_fields.length,
    };
    setData({
      ...data,
      custom_fields: [...data.custom_fields, newField],
    });
  };

  const updateField = (id: string, updates: Partial<CustomField>) => {
    setData({
      ...data,
      custom_fields: data.custom_fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      ),
    });
  };

  const removeField = (id: string) => {
    setData({
      ...data,
      custom_fields: data.custom_fields.filter((field) => field.id !== id),
    });
  };

  const handleSave = async () => {
    if (!data.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/landing/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        alert("랜딩페이지가 생성되었습니다!");
        router.push("/dashboard/admin/landing-pages");
      } else {
        const error = await response.json();
        throw new Error(error.error || "생성 실패");
      }
    } catch (error: any) {
      console.error("랜딩페이지 생성 실패:", error);
      alert(error.message || "생성 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    // 미리보기 창 열기
    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.title}</title>
          <style>
            body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            .field { margin-bottom: 15px; }
            label { display: block; font-weight: 600; margin-bottom: 5px; }
            input, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
            textarea { min-height: 100px; }
            button { background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; }
          </style>
        </head>
        <body>
          <h1>${data.title}</h1>
          <p>${data.description}</p>
          <form>
            ${data.custom_fields
              .map(
                (field) => `
              <div class="field">
                <label>${field.label}${field.required ? "*" : ""}</label>
                ${
                  field.type === "textarea"
                    ? `<textarea placeholder="${field.placeholder || ""}" ${field.required ? "required" : ""}></textarea>`
                    : field.type === "checkbox"
                    ? `<input type="checkbox" ${field.required ? "required" : ""}>`
                    : `<input type="${field.type}" placeholder="${field.placeholder || ""}" ${field.required ? "required" : ""}>`
                }
              </div>
            `
              )
              .join("")}
            <button type="submit">제출하기</button>
          </form>
        </body>
        </html>
      `);
    }
  };

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
              <h1 className="text-3xl font-bold">랜딩페이지 빌더</h1>
              <p className="text-gray-600 mt-1">템플릿을 자유롭게 편집하고 커스텀 필드를 추가하세요</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              미리보기
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  저장하기
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 편집 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>제목</Label>
                  <Input
                    value={data.title}
                    onChange={(e) => setData({ ...data, title: e.target.value })}
                    placeholder="랜딩페이지 제목"
                  />
                </div>
                <div>
                  <Label>설명</Label>
                  <Textarea
                    value={data.description}
                    onChange={(e) => setData({ ...data, description: e.target.value })}
                    placeholder="랜딩페이지 설명"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>템플릿 HTML</CardTitle>
                <CardDescription>HTML 코드를 직접 편집할 수 있습니다</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={data.template_html}
                  onChange={(e) => setData({ ...data, template_html: e.target.value })}
                  placeholder="<div>...</div>"
                  rows={15}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>OG 제목</Label>
                  <Input
                    value={data.og_title}
                    onChange={(e) => setData({ ...data, og_title: e.target.value })}
                    placeholder="소셜 미디어 공유 시 표시될 제목"
                  />
                </div>
                <div>
                  <Label>OG 설명</Label>
                  <Textarea
                    value={data.og_description}
                    onChange={(e) => setData({ ...data, og_description: e.target.value })}
                    placeholder="소셜 미디어 공유 시 표시될 설명"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>썸네일 URL</Label>
                  <Input
                    value={data.thumbnail_url}
                    onChange={(e) => setData({ ...data, thumbnail_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 커스텀 필드 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>커스텀 필드</CardTitle>
                  <CardDescription>{data.custom_fields.length}개 필드</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 필드 타입 선택 */}
                <div>
                  <Label className="mb-2 block">필드 추가</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {fieldTypes.map(({ type, label, icon: Icon }) => (
                      <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        onClick={() => addCustomField(type as CustomField["type"])}
                        className="justify-start"
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 필드 목록 */}
                <div className="space-y-3 mt-6">
                  {data.custom_fields.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 text-sm">
                      필드를 추가하여 폼을 구성하세요
                    </p>
                  ) : (
                    data.custom_fields.map((field) => (
                      <Card key={field.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{field.type}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeField(field.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <Input
                            placeholder="필드 라벨"
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                          />
                          <Input
                            placeholder="플레이스홀더"
                            value={field.placeholder}
                            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(field.id, { required: e.target.checked })}
                              className="rounded"
                            />
                            <label className="text-sm">필수 입력</label>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
