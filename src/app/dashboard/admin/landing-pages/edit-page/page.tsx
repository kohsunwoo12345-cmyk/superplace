"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  Code,
} from "lucide-react";

interface LandingPage {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  template_type: string;
  content_json: string;
  html_content: string;
  thumbnail_url?: string;
  og_title?: string;
  og_description?: string;
  qr_code_url?: string;
  status: string;
}

export default function EditLandingPagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [editableContent, setEditableContent] = useState(""); // 프리뷰 내 편집 가능한 컨텐츠
  const [previewKey, setPreviewKey] = useState(0); // 프리뷰 리렌더링용
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [status, setStatus] = useState("active");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showCodeEditor, setShowCodeEditor] = useState(false); // 코드 에디터 표시 여부

  useEffect(() => {
    if (id) {
      fetchLandingPage();
    } else {
      alert("페이지 ID가 필요합니다.");
      router.push("/dashboard/admin/landing-pages");
    }
  }, [id]);

  // HTML에서 편집 가능한 텍스트 컨텐츠 추출
  const extractEditableContent = (html: string): string => {
    // body 태그 내용만 추출
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    return bodyMatch ? bodyMatch[1] : html;
  };

  // 편집된 컨텐츠로 HTML 업데이트
  const updateHtmlWithEditedContent = (originalHtml: string, newContent: string): string => {
    return originalHtml.replace(
      /<body[^>]*>[\s\S]*<\/body>/i,
      `<body>${newContent}</body>`
    );
  };

  // 프리뷰에서 메시지 받기 (텍스트 수정)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TEXT_UPDATE') {
        console.log('📝 텍스트 업데이트 수신:', {
          contentLength: event.data.content?.length || 0,
          contentPreview: event.data.content?.substring(0, 200)
        });
        setEditableContent(event.data.content);
        
        // 🔥 핵심 수정: editableContent가 변경되면 htmlContent도 업데이트
        setHtmlContent(prevHtml => {
          const updatedHtml = updateHtmlWithEditedContent(prevHtml, event.data.content);
          console.log('✅ htmlContent 자동 업데이트:', {
            prevLength: prevHtml.length,
            newLength: updatedHtml.length
          });
          return updatedHtml;
        });
        
        setPreviewKey(prev => prev + 1);
        console.log('✅ editableContent 상태 업데이트 완료');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchLandingPage = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/landing-pages/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const page = data.landingPage;
        setLandingPage(page);
        setTitle(page.title || "");
        setSubtitle(page.subtitle || "");
        setHtmlContent(page.html_content || "");
        setEditableContent(extractEditableContent(page.html_content || ""));
        setOgTitle(page.og_title || page.title || "");
        setOgDescription(page.og_description || "");
        setStatus(page.status || "active");
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error("❌ API 응답 오류:", response.status, errorData);
        alert(`랜딩페이지를 불러올 수 없습니다.\n\n상태: ${response.status}\n오류: ${errorData.error || 'Unknown error'}`);
        router.push("/dashboard/admin/landing-pages");
      }
    } catch (error) {
      console.error("랜딩페이지 조회 실패:", error);
      alert("랜딩페이지를 불러오는 중 오류가 발생했습니다.");
      router.push("/dashboard/admin/landing-pages");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      // 🔥 중요: 저장 전에 iframe에서 최신 내용을 강제로 가져오기
      console.log('🔄 저장 전 iframe에서 최신 내용 요청...');
      
      // iframe에 최신 내용 요청 메시지 전송하고 응답 대기
      let latestHtmlContent = htmlContent;
      const iframe = document.querySelector('iframe[title="Landing Page Preview"]') as HTMLIFrameElement;
      
      if (iframe && iframe.contentWindow) {
        console.log('📤 iframe에 REQUEST_CONTENT 메시지 전송');
        
        // Promise로 응답을 기다림
        const contentPromise = new Promise<string>((resolve) => {
          const handler = (event: MessageEvent) => {
            if (event.data.type === 'TEXT_UPDATE') {
              console.log('📥 iframe으로부터 최신 내용 수신:', {
                contentLength: event.data.content?.length,
                contentPreview: event.data.content?.substring(0, 200)
              });
              window.removeEventListener('message', handler);
              
              // 수신한 내용으로 HTML 업데이트
              const updatedHtml = updateHtmlWithEditedContent(htmlContent, event.data.content);
              console.log('✅ HTML 업데이트 완료:', { 
                originalLength: htmlContent.length, 
                updatedLength: updatedHtml.length 
              });
              resolve(updatedHtml);
            }
          };
          
          window.addEventListener('message', handler);
          
          // 타임아웃 (1초)
          setTimeout(() => {
            window.removeEventListener('message', handler);
            console.warn('⚠️ iframe 응답 타임아웃, 기존 htmlContent 사용');
            resolve(htmlContent);
          }, 1000);
        });
        
        iframe.contentWindow.postMessage({ type: 'REQUEST_CONTENT' }, '*');
        
        // 응답 대기
        latestHtmlContent = await contentPromise;
        console.log('✅ 최신 HTML 적용 완료:', latestHtmlContent.length, '자');
      }
      
      // 디버깅: 저장할 내용 확인 (매우 상세하게)
      console.log('💾 ===== 저장 시작 =====');
      console.log('💾 제목:', title.trim());
      console.log('💾 상태:', status);
      console.log('💾 HTML 전체 길이:', latestHtmlContent.length);
      console.log('💾 HTML 미리보기 (처음 500자):', latestHtmlContent.substring(0, 500));
      console.log('💾 HTML 미리보기 (body 부분):', latestHtmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1]?.substring(0, 300));
      
      const requestBody = {
        title: title.trim(),
        html_content: latestHtmlContent,
        status,
      };
      
      console.log('💾 전송할 데이터:', JSON.stringify(requestBody).substring(0, 500));

      const response = await fetch(`/api/admin/landing-pages/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log('💾 응답 상태:', response.status, response.statusText);
      
      const responseData = await response.json();
      console.log('💾 응답 데이터:', responseData);

      if (response.ok) {
        console.log('✅ 저장 성공!');
        alert("랜딩페이지가 수정되었습니다!");
        router.push("/dashboard/admin/landing-pages");
      } else {
        console.error("❌ Update failed:", responseData);
        const errorMsg = `수정 실패: ${responseData.error || "알 수 없는 오류"}
상세: ${responseData.details || "N/A"}
에러명: ${responseData.errorName || "N/A"}`;
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error("랜딩페이지 수정 실패:", error);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      alert(`오류: ${error.message || "랜딩페이지 수정 중 오류가 발생했습니다."}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!landingPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">랜딩페이지를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/admin/landing-pages")}
                size="lg"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                목록으로
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  랜딩페이지 수정
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  프리뷰에서 텍스트를 클릭하여 바로 수정하세요
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    프리뷰 숨기기
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    프리뷰 보기
                  </>
                )}
              </Button>
              <Button
                onClick={() => window.open(`/lp/${landingPage.slug}`, '_blank')}
                variant="outline"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                새 탭에서 보기
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    저장하기
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 수정 폼 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">제목 <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="랜딩페이지 제목"
                  />
                </div>

                <div>
                  <Label htmlFor="subtitle">부제목</Label>
                  <Input
                    id="subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="부제목 (선택사항)"
                  />
                </div>

                <div>
                  <Label htmlFor="status">상태</Label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ogTitle">OG 제목</Label>
                  <Input
                    id="ogTitle"
                    value={ogTitle}
                    onChange={(e) => setOgTitle(e.target.value)}
                    placeholder="소셜 미디어 공유 시 표시될 제목"
                  />
                </div>

                <div>
                  <Label htmlFor="ogDescription">OG 설명</Label>
                  <Input
                    id="ogDescription"
                    value={ogDescription}
                    onChange={(e) => setOgDescription(e.target.value)}
                    placeholder="소셜 미디어 공유 시 표시될 설명"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>페이지 컨텐츠</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCodeEditor(!showCodeEditor)}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    {showCodeEditor ? '코드 숨기기' : '코드 보기'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-sm text-blue-900 font-semibold mb-2">
                      ✨ 프리뷰 내 직접 편집 기능
                    </p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• 프리뷰에서 텍스트를 <strong>클릭</strong>하면 바로 수정할 수 있습니다</li>
                      <li>• 수정이 완료되면 자동으로 저장됩니다</li>
                      <li>• HTML 코드는 수정할 수 없습니다 (안전성)</li>
                      <li>• "저장하기" 버튼을 눌러 변경사항을 확정하세요</li>
                    </ul>
                  </div>
                  
                  {showCodeEditor && (
                    <div>
                      <Label htmlFor="editableContent">HTML 컨텐츠 (읽기 전용)</Label>
                      <textarea
                        id="editableContent"
                        value={editableContent}
                        readOnly
                        rows={20}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm bg-gray-50 cursor-not-allowed"
                        placeholder="페이지 컨텐츠"
                      />
                      <p className="text-xs text-amber-600 mt-2">
                        ⚠️ 코드는 직접 수정할 수 없습니다. 프리뷰에서 텍스트를 클릭하여 수정하세요.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 프리뷰 */}
          {showPreview && (
            <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>실시간 프리뷰 (클릭하여 수정)</CardTitle>
                    <Badge variant="secondary">
                      {landingPage.slug}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-5rem)] overflow-hidden">
                  <iframe
                    key={previewKey}
                    srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    /* 편집 모드 스타일 */
    [contenteditable="true"] {
      outline: 2px dashed #3b82f6;
      outline-offset: 2px;
      cursor: text;
      padding: 4px;
      transition: all 0.2s;
      min-height: 20px;
    }
    [contenteditable="true"]:hover {
      outline-color: #2563eb;
      background-color: rgba(59, 130, 246, 0.05);
    }
    [contenteditable="true"]:focus {
      outline: 2px solid #2563eb;
      background-color: rgba(59, 130, 246, 0.1);
    }
    /* 편집 안내 툴팁 */
    .editable-hint {
      position: fixed;
      top: 10px;
      right: 10px;
      background: #3b82f6;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      animation: fadeIn 0.3s;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
  ${htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1]?.replace(/<title>.*?<\/title>/i, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') || ''}
</head>
<body>
  <div class="editable-hint">✏️ 텍스트를 클릭하여 수정하세요</div>
  <div id="editable-container">
    ${editableContent}
  </div>
  <script>
    (function() {
      // 모든 텍스트 노드를 편집 가능하게 만들기
      function makeTextEditable(element) {
        if (!element || element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
          return;
        }
        
        // 텍스트가 있는 요소만 편집 가능하게
        const hasDirectText = Array.from(element.childNodes).some(node => 
          node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
        );
        
        if (hasDirectText && !element.hasAttribute('contenteditable')) {
          element.setAttribute('contenteditable', 'true');
          
          // 실시간 수정 이벤트 (입력 중에도 감지)
          element.addEventListener('input', function() {
            console.log('⌨️ [iframe] 텍스트 입력 중...');
            // 디바운스 없이 즉시 업데이트
            updateContent();
          });
          
          // blur 이벤트 (포커스 잃을 때)
          element.addEventListener('blur', function() {
            console.log('👉 [iframe] 포커스 아웃 (blur)');
            updateContent();
          });
          
          element.addEventListener('keydown', function(e) {
            // Enter 키로 편집 종료
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              element.blur();
            }
            // Escape 키로 편집 취소
            if (e.key === 'Escape') {
              e.preventDefault();
              element.blur();
            }
          });
        }
        
        // 자식 요소들도 재귀적으로 처리
        Array.from(element.children).forEach(child => {
          makeTextEditable(child);
        });
      }
      
      // 전체 컨텐츠 업데이트
      function updateContent() {
        const container = document.getElementById('editable-container');
        if (container) {
          const newContent = container.innerHTML;
          console.log('📤 [iframe] postMessage 전송 중...', {
            contentLength: newContent.length,
            contentPreview: newContent.substring(0, 200)
          });
          window.parent.postMessage({
            type: 'TEXT_UPDATE',
            content: newContent
          }, '*');
          console.log('✅ [iframe] 텍스트 수정 완료 및 postMessage 전송됨');
        } else {
          console.error('❌ [iframe] editable-container를 찾을 수 없음');
        }
      }
      
      // 페이지 로드 후 실행
      setTimeout(() => {
        const container = document.getElementById('editable-container');
        if (container) {
          makeTextEditable(container);
          console.log('✅ 편집 모드 활성화');
        }
      }, 100);
      
      // 부모 창에서 최신 내용 요청 시 응답
      window.addEventListener('message', function(event) {
        if (event.data.type === 'REQUEST_CONTENT') {
          console.log('📨 [iframe] 부모 창에서 최신 내용 요청 받음');
          updateContent();
        }
      });
    })();
  </script>
</body>
</html>`}
                    className="w-full h-full border-0"
                    title="Landing Page Preview"
                    sandbox="allow-same-origin allow-scripts"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
