"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  GraduationCap,
  User,
  CheckCircle,
  Eye,
  Save,
  Upload,
  Plus,
  Trash2,
  ImageIcon,
  Code,
} from "lucide-react";

interface Student {
  id: number;
  name: string;
  email: string;
  academy_id?: number;
  academyName?: string;
}

interface DataOptions {
  showBasicInfo: boolean;
  showAttendance: boolean;
  showAIChats: boolean;
  showConcepts: boolean;
  showHomework: boolean;
}

interface Folder {
  id: string;
  name: string;
  pagesCount: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  html: string;  // ✅ HTML 속성 추가
  isDefault: boolean;
}

interface CustomFormField {
  id: string;
  type: "text" | "textarea" | "email" | "phone" | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
}

export default function CreateLandingPagePage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customFormFields, setCustomFormFields] = useState<CustomFormField[]>([]);
  const [htmlDirectEditEnabled, setHtmlDirectEditEnabled] = useState(false);
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const [customHtml, setCustomHtml] = useState("");

  const [dataOptions, setDataOptions] = useState<DataOptions>({
    showBasicInfo: true,
    showAttendance: true,
    showAIChats: true,
    showConcepts: true,
    showHomework: true,
  });

  useEffect(() => {
    fetchStudents();
    checkHtmlEditPermission();
  }, []);

  const checkHtmlEditPermission = async () => {
    try {
      const token = localStorage.getItem("token");
      // Get current user info
      const userRes = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) return;
      
      const userData = await userRes.json();
      const directorId = userData.user?.id;
      
      if (!directorId) return;
      
      // Check director limitations
      const limitRes = await fetch(`/api/admin/director-limitations?directorId=${directorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (limitRes.ok) {
        const data = await limitRes.json();
        const hasPermission = data.limitation?.landing_page_html_direct_edit === 1;
        setHtmlDirectEditEnabled(hasPermission);
        console.log('HTML Direct Edit Permission:', hasPermission);
      }
    } catch (error) {
      console.error('Failed to check HTML edit permission:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const [studentsRes, foldersRes, templatesRes] = await Promise.all([
        fetch("/api/admin/users?role=STUDENT", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/landing/folders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/landing/templates", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data.users || []);
      }

      if (foldersRes.ok) {
        const data = await foldersRes.json();
        setFolders(data.folders || []);
      }

      if (templatesRes.ok) {
        const data = await templatesRes.json();
        console.log("📋 Templates API Response:", data);
        console.log("📋 Templates count:", data.templates?.length || 0);
        setTemplates(data.templates || []);
        // 기본 템플릿 자동 선택
        const defaultTemplate = data.templates.find((t: Template) => t.isDefault);
        if (defaultTemplate) {
          console.log("✅ Default template selected:", defaultTemplate);
          setSelectedTemplate(defaultTemplate.id);
        } else {
          console.warn("⚠️ No default template found");
        }
      } else {
        console.error("❌ Templates API failed:", templatesRes.status, templatesRes.statusText);
        const errorData = await templatesRes.json().catch(() => ({}));
        console.error("❌ Error details:", errorData);
      }
    } catch (error) {
      console.error("데이터 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setThumbnail(base64);
        setThumbnailPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const addFormField = (type: CustomFormField["type"]) => {
    const newField: CustomFormField = {
      id: `field_${Date.now()}`,
      type,
      label: "",
      placeholder: "",
      required: false,
    };
    setCustomFormFields([...customFormFields, newField]);
  };

  const updateFormField = (id: string, updates: Partial<CustomFormField>) => {
    setCustomFormFields(
      customFormFields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const removeFormField = (id: string) => {
    setCustomFormFields(customFormFields.filter((field) => field.id !== id));
  };

  const handleCreateLandingPage = async () => {
    // HTML 직접 입력 모드일 때는 제목과 HTML만 필수
    if (showHtmlEditor) {
      if (!title.trim()) {
        alert("제목을 입력해주세요.");
        return;
      }
      if (!customHtml.trim()) {
        alert("HTML 코드를 입력해주세요.");
        return;
      }
    } else {
      // 템플릿 모드일 때는 기존 검증 유지
      if (!selectedStudent) {
        alert("학생을 선택해주세요.");
        return;
      }

      if (!title.trim()) {
        alert("제목을 입력해주세요.");
        return;
      }

      if (!startDate || !endDate) {
        alert("기간을 선택해주세요.");
        return;
      }

      if (!selectedTemplate) {
        alert("템플릿을 선택해주세요.");
        return;
      }
    }

    try {
      setCreating(true);
      const token = localStorage.getItem("token");
      
      const slug = `lp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      // 🆕 선택된 템플릿의 HTML 가져오기
      const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
      const templateHtml = selectedTemplateData?.html || '';
      
      console.log("🔍 Selected template:", {
        id: selectedTemplate,
        name: selectedTemplateData?.name,
        hasHtml: !!templateHtml,
        htmlLength: templateHtml.length
      });
      
      // 디버깅: 전송할 데이터 확인
      console.log("🔍 Sending to API:", {
        studentId: selectedStudent,
        studentIdType: typeof selectedStudent,
        folderId: selectedFolder,
        folderIdType: typeof selectedFolder,
        templateId: selectedTemplate,
        hasTemplateHtml: !!templateHtml,
        templateHtmlLength: templateHtml.length
      });
      
      const response = await fetch("/api/admin/landing-pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          studentId: showHtmlEditor ? null : selectedStudent,  // HTML 모드에서는 student 선택 안 함
          title: title.trim(),
          subtitle: subtitle.trim(),
          thumbnail,
          templateId: showHtmlEditor ? null : selectedTemplate,  // HTML 모드에서는 template 선택 안 함
          templateHtml: showHtmlEditor ? customHtml : templateHtml,  // ✅ HTML 직접 입력 또는 템플릿 HTML
          isCustomHtml: showHtmlEditor,  // ✅ 직접 입력 여부 플래그
          startDate: showHtmlEditor ? null : startDate,  // HTML 모드에서는 날짜 선택 안 함
          endDate: showHtmlEditor ? null : endDate,
          dataOptions: showHtmlEditor ? {} : dataOptions,  // HTML 모드에서는 데이터 옵션 비활성화
          customFormFields: showHtmlEditor ? [] : customFormFields,  // HTML 모드에서는 폼 필드 비활성화
          folderId: selectedFolder || null,
          isActive: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ API Success Response:", result);
        const pageUrl = result.landingPage?.url || result.url || `/lp/${slug}`;
        alert(`랜딩페이지가 생성되었습니다!\n\nURL: ${window.location.origin}${pageUrl}`);
        router.push("/dashboard/admin/landing-pages");
      } else {
        const error = await response.json();
        console.error("❌ API Error Response:", error);
        console.error("❌ Error details:", error.details);
        console.error("❌ Original error:", error.originalError);
        console.error("❌ Stack:", error.stack);
        
        // 오류 메시지 표시
        const errorMessage = error.error || error.message || "랜딩페이지 생성 중 오류가 발생했습니다.";
        alert(`오류: ${errorMessage}\n\n자세한 내용은 콘솔을 확인해주세요.`);
      }
    } catch (error: any) {
      console.error("랜딩페이지 생성 실패:", error);
      alert(`오류: ${error.message || "랜딩페이지 생성 중 오류가 발생했습니다."}\n\n자세한 내용은 콘솔을 확인해주세요.`);
      router.push("/dashboard/admin/landing-pages");
    } finally {
      setCreating(false);
    }
  };

  const handlePreview = () => {
    if (!selectedStudent) {
      alert("학생을 선택해주세요.");
      return;
    }
    alert("미리보기 기능은 저장 후 생성된 URL에서 확인하실 수 있습니다.");
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStudentData = students.find((s) => s.id === selectedStudent);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/admin/landing-pages")}
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-2 text-indigo-700">
                <GraduationCap className="h-10 w-10" />
                ✨ 새 학습 리포트 랜딩페이지 만들기
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                {showHtmlEditor 
                  ? "HTML 코드를 직접 입력하여 랜딩페이지를 만드세요"
                  : "학생을 선택하고 기간, 템플릿, 썸네일, 폼 양식을 설정하세요"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 학생 선택 (HTML 모드에서는 숨김) */}
          {!showHtmlEditor && (
            <div className="space-y-6">
              <Card>
              <CardHeader>
                <CardTitle>1️⃣ 학생 선택</CardTitle>
                <CardDescription>
                  랜딩페이지를 생성할 학생을 선택하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>학생 검색</Label>
                  <Input
                    placeholder="학생 이름 또는 이메일 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredStudents.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      검색 결과가 없습니다.
                    </p>
                  ) : (
                    filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => {
                          setSelectedStudent(student.id);
                          setTitle(`${student.name} 학생의 학습 리포트`);
                        }}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedStudent === student.id
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-indigo-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {student.name}
                            </p>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            {student.academyName && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {student.academyName}
                              </Badge>
                            )}
                          </div>
                          {selectedStudent === student.id && (
                            <CheckCircle className="w-6 h-6 text-indigo-600" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* 오른쪽: 설정 */}
          <div className={`space-y-6 ${showHtmlEditor ? 'lg:col-span-2' : ''}`}>
            {/* 제목 & 부제목 */}
            <Card>
              <CardHeader>
                <CardTitle>2️⃣ 제목 & 부제목</CardTitle>
                <CardDescription>
                  학부모에게 표시될 제목과 부제목을 입력하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>제목 *</Label>
                  <Input
                    placeholder="예: 김철수 학생의 학습 리포트"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label>부제목 (선택)</Label>
                  <Input
                    placeholder="예: 2024년 1월 학습 성과"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    공유 시 미리보기에 표시됩니다
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 썸네일 이미지 */}
            <Card className="border-2 border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <ImageIcon className="w-6 h-6" />
                  3️⃣ 썸네일 이미지
                </CardTitle>
                <CardDescription className="text-green-700">
                  공유 시 미리보기로 표시될 이미지를 업로드하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-4 border-dashed border-green-300 rounded-lg p-6 text-center bg-white">
                  {thumbnailPreview ? (
                    <div className="space-y-4">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail"
                        className="max-w-full h-auto max-h-64 mx-auto rounded-lg shadow-lg"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          setThumbnail("");
                          setThumbnailPreview("");
                        }}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        이미지 제거
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-3">
                        <Upload className="w-12 h-12 text-green-500" />
                        <div>
                          <p className="font-semibold text-green-700">
                            클릭하여 이미지 업로드
                          </p>
                          <p className="text-sm text-gray-500">
                            PNG, JPG, GIF (최대 5MB)
                          </p>
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 데이터 기간 선택 (HTML 모드에서는 숨김) */}
            {!showHtmlEditor && (
            <Card>
              <CardHeader>
                <CardTitle>4️⃣ 데이터 기간 선택</CardTitle>
                <CardDescription>
                  표시할 학습 데이터의 기간을 선택하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>시작일 *</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>종료일 *</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                  />
                </div>
                {startDate && endDate && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      📅 선택된 기간: <strong>{startDate}</strong> ~ <strong>{endDate}</strong>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* 폴더 선택 (HTML 모드에서는 숨김) */}
            {!showHtmlEditor && folders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>5️⃣ 폴더 선택 (선택)</CardTitle>
                  <CardDescription>
                    랜딩페이지를 분류할 폴더를 선택하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <select
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">폴더 없음</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name} ({folder.pagesCount}개)
                      </option>
                    ))}
                  </select>
                </CardContent>
              </Card>
            )}

            {/* HTML 템플릿 선택 또는 직접 입력 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>6️⃣ HTML 템플릿 선택</CardTitle>
                    <CardDescription>
                      {showHtmlEditor 
                        ? "HTML 코드를 직접 입력하여 랜딩페이지를 만드세요" 
                        : "랜딩페이지 레이아웃 템플릿을 선택하세요"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {htmlDirectEditEnabled && (
                      <Button
                        variant={showHtmlEditor ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowHtmlEditor(!showHtmlEditor)}
                      >
                        <Code className="w-4 h-4 mr-2" />
                        {showHtmlEditor ? "템플릿 선택으로" : "HTML 직접 입력"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/dashboard/admin/landing-pages/templates")}
                    >
                      템플릿 관리
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {showHtmlEditor ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium">⚠️ 고급 기능 주의사항</p>
                      <ul className="text-xs text-yellow-700 mt-2 space-y-1">
                        <li>• HTML, CSS, JavaScript 코드를 입력할 수 있습니다</li>
                        <li>• 잘못된 코드 입력 시 페이지가 제대로 표시되지 않을 수 있습니다</li>
                        <li>• 보안에 주의하여 신뢰할 수 있는 코드만 사용하세요</li>
                      </ul>
                    </div>
                    <div>
                      <Label>HTML 코드 입력</Label>
                      <Textarea
                        value={customHtml}
                        onChange={(e) => setCustomHtml(e.target.value)}
                        placeholder="<!DOCTYPE html>&#10;<html>&#10;<head>&#10;  <title>랜딩페이지</title>&#10;</head>&#10;<body>&#10;  <h1>내용을 입력하세요</h1>&#10;</body>&#10;</html>"
                        rows={15}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <p>💡 팁: 변수를 사용하려면 <code className="bg-gray-100 px-2 py-1 rounded">{'{{studentName}}'}</code>, <code className="bg-gray-100 px-2 py-1 rounded">{'{{academyName}}'}</code> 등을 사용하세요</p>
                    </div>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>템플릿이 없습니다.</p>
                    <Button
                      variant="link"
                      onClick={() => router.push("/dashboard/admin/landing-pages/templates")}
                      className="mt-2"
                    >
                      템플릿 만들기 →
                    </Button>
                  </div>
                ) : (
                  templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{template.name}</p>
                          {template.description && (
                            <p className="text-sm text-gray-600">{template.description}</p>
                          )}
                          {template.isDefault && (
                            <Badge variant="default" className="mt-1">
                              기본 템플릿
                            </Badge>
                          )}
                        </div>
                        {selectedTemplate === template.id && (
                          <CheckCircle className="w-6 h-6 text-purple-600" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* 폼 양식 필드 (HTML 모드에서는 숨김) */}
            {!showHtmlEditor && (
            <Card className="border-2 border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  📝 7️⃣ 폼 양식 추가 (선택)
                </CardTitle>
                <CardDescription className="text-blue-700">
                  학부모가 입력할 수 있는 폼 필드를 추가하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 폼 필드 추가 버튼들 */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addFormField("text")}
                    className="border-2 border-blue-300 hover:bg-blue-100"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    텍스트
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addFormField("textarea")}
                    className="border-2 border-blue-300 hover:bg-blue-100"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    긴 텍스트
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addFormField("email")}
                    className="border-2 border-blue-300 hover:bg-blue-100"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    이메일
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addFormField("phone")}
                    className="border-2 border-blue-300 hover:bg-blue-100"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    전화번호
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addFormField("checkbox")}
                    className="border-2 border-blue-300 hover:bg-blue-100 col-span-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    체크박스
                  </Button>
                </div>

                {/* 추가된 폼 필드 목록 */}
                {customFormFields.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <p className="font-semibold text-blue-800">추가된 필드:</p>
                    {customFormFields.map((field) => (
                      <div key={field.id} className="p-4 bg-white border-2 border-blue-200 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-blue-700">
                            {field.type}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFormField(field.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="필드 라벨 (예: 이름, 연락처 등)"
                            value={field.label}
                            onChange={(e) =>
                              updateFormField(field.id, { label: e.target.value })
                            }
                          />
                          <Input
                            placeholder="플레이스홀더 (선택)"
                            value={field.placeholder || ""}
                            onChange={(e) =>
                              updateFormField(field.id, { placeholder: e.target.value })
                            }
                          />
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) =>
                                updateFormField(field.id, { required: e.target.checked })
                              }
                            />
                            <span className="text-sm">필수 입력</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* 표시할 데이터 선택 (HTML 모드에서는 숨김) */}
            {!showHtmlEditor && (
            <Card>
              <CardHeader>
                <CardTitle>8️⃣ 표시할 데이터 선택</CardTitle>
                <CardDescription>
                  랜딩페이지에 표시할 학습 데이터를 선택하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="basicInfo"
                    checked={dataOptions.showBasicInfo}
                    onCheckedChange={(checked) =>
                      setDataOptions({ ...dataOptions, showBasicInfo: !!checked })
                    }
                  />
                  <label htmlFor="basicInfo" className="cursor-pointer">
                    <div className="font-medium">기본 정보</div>
                    <div className="text-sm text-gray-500">
                      학생 이름, 이메일, 소속 학원
                    </div>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attendance"
                    checked={dataOptions.showAttendance}
                    onCheckedChange={(checked) =>
                      setDataOptions({ ...dataOptions, showAttendance: !!checked })
                    }
                  />
                  <label htmlFor="attendance" className="cursor-pointer">
                    <div className="font-medium">출결 현황</div>
                    <div className="text-sm text-gray-500">
                      출석률, 출석/결석/지각 통계
                    </div>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="aiChats"
                    checked={dataOptions.showAIChats}
                    onCheckedChange={(checked) =>
                      setDataOptions({ ...dataOptions, showAIChats: !!checked })
                    }
                  />
                  <label htmlFor="aiChats" className="cursor-pointer">
                    <div className="font-medium">AI 대화 활동</div>
                    <div className="text-sm text-gray-500">
                      AI 챗봇 이용 현황 및 역량 분석
                    </div>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="concepts"
                    checked={dataOptions.showConcepts}
                    onCheckedChange={(checked) =>
                      setDataOptions({ ...dataOptions, showConcepts: !!checked })
                    }
                  />
                  <label htmlFor="concepts" className="cursor-pointer">
                    <div className="font-medium">부족한 개념 분석</div>
                    <div className="text-sm text-gray-500">
                      AI가 분석한 개선 필요 영역
                    </div>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="homework"
                    checked={dataOptions.showHomework}
                    onCheckedChange={(checked) =>
                      setDataOptions({ ...dataOptions, showHomework: !!checked })
                    }
                  />
                  <label htmlFor="homework" className="cursor-pointer">
                    <div className="font-medium">숙제 제출 현황</div>
                    <div className="text-sm text-gray-500">
                      숙제 완료율 및 성적
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
            )}

            {/* 선택된 학생 정보 (HTML 모드에서는 숨김) */}
            {!showHtmlEditor && selectedStudentData && (
              <Card className="border-2 border-indigo-200 bg-indigo-50">
                <CardHeader>
                  <CardTitle className="text-indigo-900">✅ 선택된 학생</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold">이름:</span>{" "}
                      {selectedStudentData.name}
                    </div>
                    <div>
                      <span className="font-semibold">이메일:</span>{" "}
                      {selectedStudentData.email}
                    </div>
                    {selectedStudentData.academyName && (
                      <div>
                        <span className="font-semibold">학원:</span>{" "}
                        {selectedStudentData.academyName}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-3">
              {!showHtmlEditor && (
              <Button
                onClick={handlePreview}
                variant="outline"
                className="flex-1"
                disabled={!selectedStudent}
              >
                <Eye className="w-4 h-4 mr-2" />
                미리보기
              </Button>
              )}
              <Button
                onClick={handleCreateLandingPage}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                disabled={(showHtmlEditor ? !title.trim() || !customHtml.trim() : (!selectedStudent || !title.trim())) || creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    랜딩페이지 생성
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
