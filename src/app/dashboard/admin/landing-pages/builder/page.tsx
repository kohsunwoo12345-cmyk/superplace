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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  QrCode,
  FolderOpen,
  Upload,
  Code,
  RefreshCw,
} from "lucide-react";
import { STUDENT_GROWTH_REPORT_TEMPLATE } from "@/templates/student-growth-report";

interface CustomField {
  id: string;
  type: "text" | "textarea" | "email" | "phone" | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
  order: number;
}

interface PixelScript {
  id: string;
  name: string;
  scriptType: "header" | "body" | "footer";
  scriptCode: string;
}

interface Folder {
  id: string;
  name: string;
  created_at: string;
}

interface LandingPageData {
  title: string;
  subtitle: string;
  description: string;
  template_type: string;
  template_html: string;
  input_data: CustomField[];
  og_title: string;
  og_description: string;
  thumbnail: string;
  folder_id: string;
  show_qr_code: boolean;
  qr_code_position: "top" | "bottom" | "sidebar";
  pixel_scripts: PixelScript[];
}

export default function LandingPageBuilderPage() {
  const router = useRouter();
  const [data, setData] = useState<LandingPageData>({
    title: "",
    subtitle: "",
    description: "",
    template_type: "basic",
    template_html: "",
    input_data: [],
    og_title: "",
    og_description: "",
    thumbnail: "",
    folder_id: "",
    show_qr_code: true,
    qr_code_position: "bottom",
    pixel_scripts: [],
  });
  const [folders, setFolders] = useState<Folder[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedSlug, setGeneratedSlug] = useState("");

  const templateTypes = [
    { value: "basic", label: "기본 템플릿", description: "간단한 폼 입력" },
    { value: "student_report", label: "학생 리포트", description: "학습 데이터 전달" },
    { value: "event", label: "이벤트 페이지", description: "세미나/행사 안내" },
    { value: "custom", label: "커스텀 HTML", description: "자유 편집" },
  ];

  const fieldTypes = [
    { type: "text", label: "텍스트 입력", icon: Type },
    { type: "textarea", label: "긴 텍스트", icon: Type },
    { type: "email", label: "이메일", icon: Mail },
    { type: "phone", label: "전화번호", icon: Phone },
    { type: "checkbox", label: "체크박스", icon: CheckSquare },
  ];

  // 템플릿 HTML 가져오기
  const getTemplateHtml = (templateType: string): string => {
    if (templateType === "student_report") {
      return STUDENT_GROWTH_REPORT_TEMPLATE;
    }
    return "";
  };

  // 템플릿 타입 변경 핸들러
  const handleTemplateTypeChange = (templateType: string) => {
    console.log("🔄 Template type changing to:", templateType);
    const updatedData = { ...data, template_type: templateType };
    
    // 학생 리포트 템플릿인 경우 자동으로 HTML 주입
    if (templateType === "student_report") {
      updatedData.template_html = STUDENT_GROWTH_REPORT_TEMPLATE;
      console.log("✅ Student report template loaded, length:", STUDENT_GROWTH_REPORT_TEMPLATE.length);
      console.log("✅ updatedData.template_html.length:", updatedData.template_html.length);
    } else {
      updatedData.template_html = "";
    }
    
    console.log("📝 setData 호출 전 - updatedData.template_type:", updatedData.template_type);
    console.log("📝 setData 호출 전 - updatedData.template_html.length:", updatedData.template_html.length);
    setData(updatedData);
    
    // setData 호출 후 검증 (비동기이므로 즉시 확인 불가)
    setTimeout(() => {
      console.log("✅ setData 호출 후 - data.template_type:", data.template_type);
      console.log("✅ setData 호출 후 - data.template_html.length:", data.template_html.length);
    }, 100);
  };

  // 폴더 목록 불러오기
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/landing/folders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const result = await response.json();
          setFolders(result.folders || []);
        }
      } catch (error) {
        console.error("폴더 목록 조회 실패:", error);
      }
    };
    fetchFolders();
  }, []);
  
  // 템플릿 HTML 자동 복원 (별도 useEffect)
  useEffect(() => {
    if (data.template_type === "student_report" && !data.template_html) {
      console.log("🔄 Restoring student report template HTML...");
      setData(prev => ({
        ...prev,
        template_html: STUDENT_GROWTH_REPORT_TEMPLATE
      }));
      console.log("✅ Template HTML restored, length:", STUDENT_GROWTH_REPORT_TEMPLATE.length);
    }
  }, [data.template_type]);

  const addCustomField = (type: CustomField["type"]) => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      type,
      label: "",
      placeholder: "",
      required: false,
      order: data.input_data.length,
    };
    setData({
      ...data,
      input_data: [...data.input_data, newField],
    });
  };

  const updateField = (id: string, updates: Partial<CustomField>) => {
    setData({
      ...data,
      input_data: data.input_data.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      ),
    });
  };

  const removeField = (id: string) => {
    setData({
      ...data,
      input_data: data.input_data.filter((field) => field.id !== id),
    });
  };

  const addPixelScript = () => {
    const newScript: PixelScript = {
      id: `script_${Date.now()}`,
      name: "",
      scriptType: "header",
      scriptCode: "",
    };
    setData({
      ...data,
      pixel_scripts: [...data.pixel_scripts, newScript],
    });
  };

  const updatePixelScript = (id: string, updates: Partial<PixelScript>) => {
    setData({
      ...data,
      pixel_scripts: data.pixel_scripts.map((script) =>
        script.id === id ? { ...script, ...updates } : script
      ),
    });
  };

  const removePixelScript = (id: string) => {
    setData({
      ...data,
      pixel_scripts: data.pixel_scripts.filter((script) => script.id !== id),
    });
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setThumbnailPreview(base64);
        setData({ ...data, thumbnail: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearCache = () => {
    if (confirm("캐시를 초기화하시겠습니까?")) {
      localStorage.removeItem("landing_page_draft");
      alert("캐시가 초기화되었습니다.");
    }
  };

  const handleSave = async () => {
    if (!data.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    console.log("💾 handleSave 시작");
    console.log("   data.template_type:", data.template_type);
    console.log("   data.template_html.length:", data.template_html?.length || 0);
    console.log("   data.template_html empty?:", !data.template_html);

    // 🔥 중요: 학생 리포트 템플릿인데 HTML이 비어있으면 자동 복원
    let finalTemplateHtml = data.template_html;
    if (data.template_type === "student_report" && !finalTemplateHtml) {
      console.warn("⚠️ template_html이 비어있습니다! 자동 복원 중...");
      finalTemplateHtml = STUDENT_GROWTH_REPORT_TEMPLATE;
      setData(prev => ({ ...prev, template_html: finalTemplateHtml }));
      console.log("✅ Template HTML auto-restored before save, length:", finalTemplateHtml.length);
    } else if (data.template_type === "student_report") {
      console.log("✅ template_html이 이미 존재합니다, length:", finalTemplateHtml.length);
    }

    // 자동 slug 생성
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const slug = `lp_${timestamp}_${random}`;
    setGeneratedSlug(slug);

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      const payload = {
        slug,
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        templateType: data.template_type,
        templateHtml: finalTemplateHtml,  // 🔥 복원된 HTML 사용
        inputData: data.input_data,
        ogTitle: data.og_title,
        ogDescription: data.og_description,
        thumbnail: data.thumbnail,
        folderId: data.folder_id,
        showQrCode: data.show_qr_code,
        qrCodePosition: data.qr_code_position,
        pixelScripts: data.pixel_scripts,
      };
      
      console.log("📤 Sending to API:", {
        slug,
        title: data.title,
        templateType: data.template_type,
        templateHtmlLength: finalTemplateHtml?.length || 0,
        hasTemplateHtml: !!finalTemplateHtml,
      });
      
      const response = await fetch("/api/admin/landing-pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        const pageUrl = result.landingPage?.url || result.url || `/lp/${slug}`;
        alert(`랜딩페이지가 생성되었습니다!\n\nURL: ${window.location.origin}${pageUrl}`);
        localStorage.removeItem("landing_page_draft");
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
      const qrCodeHtml = data.show_qr_code
        ? `<div style="text-align: center; margin: 20px 0;">
             <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + "/landing/preview")}" alt="QR Code" />
             <p style="font-size: 12px; color: #666;">스캔하여 접속하세요</p>
           </div>`
        : "";

      const thumbnailHtml = data.thumbnail
        ? `<img src="${data.thumbnail}" alt="Thumbnail" style="max-width: 100%; height: auto; margin-bottom: 20px;" />`
        : "";

      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.title}</title>
          <meta property="og:title" content="${data.og_title || data.title}" />
          <meta property="og:description" content="${data.og_description || data.description}" />
          <meta property="og:image" content="${data.thumbnail}" />
          <style>
            body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 20px; background: #f9fafb; }
            .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            h1 { color: #111827; font-size: 32px; margin-bottom: 8px; }
            .subtitle { color: #6b7280; font-size: 18px; margin-bottom: 20px; }
            .description { color: #374151; margin-bottom: 30px; line-height: 1.6; }
            .field { margin-bottom: 20px; }
            label { display: block; font-weight: 600; margin-bottom: 8px; color: #374151; }
            input, textarea { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
            input:focus, textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
            textarea { min-height: 100px; resize: vertical; }
            button { background: #3b82f6; color: white; padding: 12px 32px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600; width: 100%; }
            button:hover { background: #2563eb; }
            .required { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="container">
            ${data.qr_code_position === "top" ? qrCodeHtml : ""}
            ${thumbnailHtml}
            <h1>${data.title}</h1>
            ${data.subtitle ? `<div class="subtitle">${data.subtitle}</div>` : ""}
            <div class="description">${data.description}</div>
            <form>
              ${data.input_data
                .map(
                  (field) => `
                <div class="field">
                  <label>${field.label}${field.required ? '<span class="required">*</span>' : ""}</label>
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
            ${data.qr_code_position === "bottom" ? qrCodeHtml : ""}
          </div>
        </body>
        </html>
      `);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                뒤로가기
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-indigo-700">🎨 랜딩페이지 빌더</h1>
                <p className="text-gray-600 mt-2 text-lg">
                  썸네일, 폼양식, HTML 템플릿을 자유롭게 편집하세요
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearCache}>
                <RefreshCw className="w-4 h-4 mr-2" />
                캐시 초기화
              </Button>
              <Button variant="outline" onClick={handlePreview} size="lg">
                <Eye className="w-4 h-4 mr-2" />
                미리보기
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700" size="lg">
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
        </div>

        {/* 안내 배너 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-3">✨ 랜딩페이지 제작 가이드</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded p-3">
              <p className="font-semibold mb-1">1️⃣ 썸네일 & 제목 설정</p>
              <p className="text-sm">이미지 업로드 + 제목/부제목 입력</p>
            </div>
            <div className="bg-white/10 rounded p-3">
              <p className="font-semibold mb-1">2️⃣ 폼 양식 추가</p>
              <p className="text-sm">오른쪽에서 필드 추가 버튼 클릭</p>
            </div>
            <div className="bg-white/10 rounded p-3">
              <p className="font-semibold mb-1">3️⃣ HTML 템플릿 편집</p>
              <p className="text-sm">커스텀 템플릿 선택 시 코드 편집 가능</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 편집 */}
          <div className="space-y-6">
            {/* 템플릿 타입 선택 */}
            <Card className="border-2 border-indigo-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Code className="w-6 h-6 text-indigo-600" />
                  템플릿 선택
                </CardTitle>
                <CardDescription className="text-base">
                  용도에 맞는 템플릿을 선택하세요. <strong>커스텀 선택 시 HTML 편집 가능!</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  {templateTypes.map((template) => (
                    <button
                      key={template.value}
                      onClick={() => handleTemplateTypeChange(template.value)}
                      className={`p-6 border-3 rounded-xl text-left transition-all hover:border-indigo-400 hover:shadow-lg ${
                        data.template_type === template.value
                          ? "border-indigo-600 bg-indigo-50 shadow-lg scale-105"
                          : "border-gray-300"
                      }`}
                    >
                      <div className="font-bold text-base mb-2 flex items-center gap-2">
                        {template.value === "custom" && <Code className="w-5 h-5 text-purple-600" />}
                        {template.label}
                      </div>
                      <div className="text-sm text-gray-600">{template.description}</div>
                      {template.value === "custom" && (
                        <div className="mt-2 text-xs text-purple-600 font-semibold">
                          ⚡ HTML 코드 직접 편집 가능
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>제목 *</Label>
                  <Input
                    value={data.title}
                    onChange={(e) => setData({ ...data, title: e.target.value })}
                    placeholder="랜딩페이지 제목"
                  />
                </div>
                <div>
                  <Label>부제목</Label>
                  <Input
                    value={data.subtitle}
                    onChange={(e) => setData({ ...data, subtitle: e.target.value })}
                    placeholder="짧은 부제목 (선택사항)"
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
                <div>
                  <Label>폴더 선택</Label>
                  <Select
                    value={data.folder_id}
                    onValueChange={(value) => setData({ ...data, folder_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="폴더를 선택하세요 (선택사항)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">미분류</SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <FolderOpen className="inline w-4 h-4 mr-2" />
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 썸네일 업로드 */}
            <Card className="border-2 border-green-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-green-600" />
                  썸네일 이미지 (제목 이미지)
                </CardTitle>
                <CardDescription className="text-base">
                  <strong>대표 이미지를 업로드하세요</strong> - 랜딩페이지 상단에 표시됩니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <Label htmlFor="thumbnail" className="text-lg font-semibold">이미지 업로드</Label>
                  <div className="mt-3">
                    <label
                      htmlFor="thumbnail"
                      className={`flex items-center justify-center w-full h-48 border-4 border-dashed rounded-2xl cursor-pointer transition-all ${
                        thumbnailPreview 
                          ? "border-green-400 bg-green-50" 
                          : "border-gray-300 hover:border-green-400 hover:bg-green-50"
                      }`}
                    >
                      {thumbnailPreview ? (
                        <div className="relative w-full h-full p-2">
                          <img
                            src={thumbnailPreview}
                            alt="Thumbnail Preview"
                            className="w-full h-full object-contain rounded"
                          />
                          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            ✓ 업로드됨
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                          <p className="text-lg font-semibold text-gray-700">클릭하여 썸네일 업로드</p>
                          <p className="text-sm text-gray-500 mt-2">JPG, PNG 권장 (최대 5MB)</p>
                          <p className="text-xs text-indigo-600 mt-3 font-semibold">
                            💡 랜딩페이지 상단에 큰 이미지로 표시됩니다
                          </p>
                        </div>
                      )}
                    </label>
                    <input
                      id="thumbnail"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleThumbnailUpload}
                    />
                  </div>
                  {thumbnailPreview && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setThumbnailPreview("");
                        setData({ ...data, thumbnail: "" });
                      }}
                      className="mt-3 w-full border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      이미지 제거
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* HTML 템플릿 편집 - 항상 표시 */}
            <Card className="border-2 border-purple-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Code className="w-6 h-6 text-purple-600" />
                  🎨 HTML 템플릿 편집
                </CardTitle>
                <CardDescription className="text-base">
                  <strong>커스텀 HTML 코드를 직접 편집하세요</strong>
                  {data.template_type !== "custom" && (
                    <span className="block mt-2 text-amber-600 font-semibold">
                      ⚠️ 현재는 "{templateTypes.find(t => t.value === data.template_type)?.label}" 템플릿이 적용됩니다.
                      HTML 편집을 활성화하려면 위에서 "커스텀 HTML" 템플릿을 선택하세요.
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea
                  value={data.template_html}
                  onChange={(e) => setData({ ...data, template_html: e.target.value })}
                  placeholder="<div>...</div>"
                  rows={20}
                  className="font-mono text-sm"
                  disabled={data.template_type !== "custom"}
                />
                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-xs text-purple-800">
                    💡 <strong>팁:</strong> HTML 편집을 활성화하려면 상단에서 <strong>"커스텀 HTML" 템플릿</strong>을 선택하세요.
                    폼 필드는 오른쪽 "입력 폼 필드" 섹션에서 추가할 수 있습니다.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* QR 코드 설정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR 코드 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>QR 코드 표시</Label>
                  <input
                    type="checkbox"
                    checked={data.show_qr_code}
                    onChange={(e) => setData({ ...data, show_qr_code: e.target.checked })}
                    className="rounded"
                  />
                </div>
                {data.show_qr_code && (
                  <div>
                    <Label>QR 코드 위치</Label>
                    <Select
                      value={data.qr_code_position}
                      onValueChange={(value: any) => setData({ ...data, qr_code_position: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">상단</SelectItem>
                        <SelectItem value="bottom">하단</SelectItem>
                        <SelectItem value="sidebar">사이드바</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO & 소셜 미디어</CardTitle>
                <CardDescription>검색 엔진 최적화 및 소셜 공유 설정</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>OG 제목</Label>
                  <Input
                    value={data.og_title}
                    onChange={(e) => setData({ ...data, og_title: e.target.value })}
                    placeholder={data.title || "소셜 미디어 공유 시 표시될 제목"}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    비워두면 페이지 제목이 사용됩니다
                  </p>
                </div>
                <div>
                  <Label>OG 설명</Label>
                  <Textarea
                    value={data.og_description}
                    onChange={(e) => setData({ ...data, og_description: e.target.value })}
                    placeholder={data.description || "소셜 미디어 공유 시 표시될 설명"}
                    rows={2}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    비워두면 페이지 설명이 사용됩니다
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 커스텀 필드 */}
          <div className="space-y-6">
            <Card className="border-2 border-blue-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">📝 입력 폼 필드</CardTitle>
                    <CardDescription className="mt-1 text-base">
                      <strong>신청자가 입력할 폼 항목을 추가하세요</strong>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">{data.input_data.length}개 필드</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 필드 타입 선택 - 더 큰 버튼 */}
                <div>
                  <Label className="mb-3 block text-lg font-semibold">🔽 필드 추가하기</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {fieldTypes.map(({ type, label, icon: Icon }) => (
                      <Button
                        key={type}
                        variant="outline"
                        size="lg"
                        onClick={() => addCustomField(type as CustomField["type"])}
                        className="justify-start h-14 border-2 hover:border-blue-400 hover:bg-blue-50 font-semibold"
                      >
                        <Icon className="w-5 h-5 mr-2" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 필드 목록 */}
                <div className="space-y-3 mt-6">
                  {data.input_data.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                      <Plus className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">
                        필드를 추가하여 폼을 구성하세요
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        위의 버튼을 클릭하여 시작하세요
                      </p>
                    </div>
                  ) : (
                    data.input_data.map((field, index) => (
                      <Card key={field.id} className="p-4 border-l-4 border-l-indigo-500">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-gray-400" />
                              <Badge variant="outline" className="capitalize">
                                {field.type}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                필드 #{index + 1}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeField(field.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div>
                            <Label className="text-xs">필드 라벨 *</Label>
                            <Input
                              placeholder="예: 학생 이름, 연락처 등"
                              value={field.label}
                              onChange={(e) => updateField(field.id, { label: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">플레이스홀더</Label>
                            <Input
                              placeholder="예: 홍길동, 010-1234-5678"
                              value={field.placeholder}
                              onChange={(e) =>
                                updateField(field.id, { placeholder: e.target.value })
                              }
                              className="mt-1"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) =>
                                updateField(field.id, { required: e.target.checked })
                              }
                              className="rounded"
                              id={`required-${field.id}`}
                            />
                            <label
                              htmlFor={`required-${field.id}`}
                              className="text-sm cursor-pointer"
                            >
                              필수 입력 항목
                            </label>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>

                {data.input_data.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      💡 <strong>팁:</strong> 필드는 신청자에게 표시되는 순서대로 정렬됩니다.
                      드래그하여 순서를 변경할 수 있습니다 (향후 업데이트 예정).
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 미리보기 카드 */}
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  빠른 미리보기
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">템플릿:</span>
                    <Badge>
                      {templateTypes.find((t) => t.value === data.template_type)?.label ||
                        "기본"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">입력 필드:</span>
                    <span className="font-semibold">{data.input_data.length}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">QR 코드:</span>
                    <span className={data.show_qr_code ? "text-green-600" : "text-gray-400"}>
                      {data.show_qr_code ? "표시" : "숨김"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">썸네일:</span>
                    <span className={data.thumbnail ? "text-green-600" : "text-gray-400"}>
                      {data.thumbnail ? "업로드됨" : "없음"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">폴더:</span>
                    <span className="text-gray-800">
                      {folders.find((f) => f.id === data.folder_id)?.name || "미분류"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">픽셀 스크립트:</span>
                    <span className={data.pixel_scripts.length > 0 ? "text-green-600" : "text-gray-400"}>
                      {data.pixel_scripts.length}개
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handlePreview}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  전체 미리보기 열기
                </Button>
              </CardContent>
            </Card>

            {/* 픽셀 스크립트 관리 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>추적 픽셀 스크립트</CardTitle>
                    <CardDescription className="mt-1">
                      당근 비즈니스, Facebook 픽셀 등 추적 스크립트 추가
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{data.pixel_scripts.length}개</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPixelScript}
                  className="w-full"
                >
                  <Code className="w-4 h-4 mr-2" />
                  픽셀 스크립트 추가
                </Button>

                {data.pixel_scripts.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <Code className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">
                      추적 스크립트를 추가하세요
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      예: 당근 비즈니스 픽셀, Facebook Pixel
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.pixel_scripts.map((script, index) => (
                      <Card key={script.id} className="p-4 border-l-4 border-l-purple-500">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="capitalize">
                              스크립트 #{index + 1}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePixelScript(script.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div>
                            <Label className="text-xs">스크립트 이름 *</Label>
                            <Input
                              placeholder="예: 당근 비즈니스 픽셀, Facebook Pixel"
                              value={script.name}
                              onChange={(e) =>
                                updatePixelScript(script.id, { name: e.target.value })
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">위치 *</Label>
                            <Select
                              value={script.scriptType}
                              onValueChange={(value: any) =>
                                updatePixelScript(script.id, { scriptType: value })
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="header">&lt;head&gt; 영역</SelectItem>
                                <SelectItem value="body">&lt;body&gt; 시작</SelectItem>
                                <SelectItem value="footer">&lt;body&gt; 끝</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">스크립트 코드 *</Label>
                            <Textarea
                              placeholder="<script>...</script>"
                              value={script.scriptCode}
                              onChange={(e) =>
                                updatePixelScript(script.id, {
                                  scriptCode: e.target.value,
                                })
                              }
                              rows={6}
                              className="mt-1 font-mono text-xs"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              💡 팁: 플랫폼에서 제공하는 전체 스크립트 코드를 붙여넣으세요
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {data.pixel_scripts.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      ⚠️ <strong>주의:</strong> 스크립트 코드는 신중하게 입력하세요.
                      잘못된 코드는 페이지 작동에 영향을 줄 수 있습니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
