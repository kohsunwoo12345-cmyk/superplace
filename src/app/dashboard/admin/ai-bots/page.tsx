"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Search,
  Folder,
  FolderPlus,
  Eye,
  MessageSquare,
  Mic,
  Image as ImageIcon,
  Volume2,
  FileText,
} from "lucide-react";
import { CreateBotDialog } from "@/components/admin/CreateBotDialog";
import { EditBotDialog } from "@/components/admin/EditBotDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AIBot {
  id: string;
  botId: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: string;
  systemPrompt: string;
  isActive: boolean;
  folderId: string | null;
  referenceFiles?: string[];
  starterMessages?: string[];
  enableImageInput?: boolean;
  enableVoiceOutput?: boolean;
  enableVoiceInput?: boolean;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  folder?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  createdAt: string;
}

interface BotFolder {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  order: number;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  bots: {
    id: string;
    name: string;
    icon: string;
    isActive: boolean;
  }[];
}

interface BotDetailData {
  bot: AIBot;
  assignments: Array<{
    id: string;
    userId: string;
    botId: string;
    isActive: boolean;
    expiresAt: string | null;
    grantedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      academy: {
        id: string;
        name: string;
        code: string;
      } | null;
    };
    grantedBy: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }>;
  stats: {
    totalAssignments: number;
    activeAssignments: number;
    expiredAssignments: number;
    assignmentsByRole: {
      DIRECTOR: number;
      TEACHER: number;
      STUDENT: number;
    };
    assignmentsByAcademy: Record<string, number>;
  };
}

export default function UnifiedAIBotsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bots, setBots] = useState<AIBot[]>([]);
  const [folders, setFolders] = useState<BotFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<AIBot | null>(null);
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [folderForm, setFolderForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    icon: "Folder",
  });
  const [editingFolder, setEditingFolder] = useState<BotFolder | null>(null);
  const [viewingBot, setViewingBot] = useState<BotDetailData | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // 권한 확인
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (session?.user?.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 봇 목록 조회
      const botsRes = await fetch("/api/admin/ai-bots");
      if (botsRes.ok) {
        const data = await botsRes.json();
        setBots(data.bots);
      }

      // 폴더 목록 조회
      const foldersRes = await fetch("/api/admin/bot-folders");
      if (foldersRes.ok) {
        const data = await foldersRes.json();
        setFolders(data.folders);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      loadData();
    }
  }, [session]);

  // 검색 및 필터링
  const filteredBots = bots.filter((bot) => {
    const matchesSearch =
      searchQuery === "" ||
      bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.botId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFolder =
      selectedFolder === null ||
      (selectedFolder === "none" && bot.folderId === null) ||
      bot.folderId === selectedFolder;

    return matchesSearch && matchesFolder;
  });

  // 봇 삭제
  const handleDelete = async (botId: string) => {
    if (!confirm("정말 이 봇을 삭제하시겠습니까?\n모든 할당도 함께 취소됩니다.")) return;

    try {
      setDeletingBotId(botId);
      const response = await fetch(`/api/admin/ai-bots/${botId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadData();
        alert("봇이 삭제되었습니다");
      } else {
        const data = await response.json();
        alert(data.error || "봇 삭제에 실패했습니다");
      }
    } catch (error) {
      console.error("봇 삭제 오류:", error);
      alert("봇 삭제 중 오류가 발생했습니다");
    } finally {
      setDeletingBotId(null);
    }
  };

  // 봇 활성/비활성 토글
  const handleToggleActive = async (botId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/ai-bots/${botId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const data = await response.json();
        alert(data.error || "상태 변경에 실패했습니다");
      }
    } catch (error) {
      console.error("상태 변경 오류:", error);
      alert("상태 변경 중 오류가 발생했습니다");
    }
  };

  // 폴더 생성/수정
  const handleSaveFolder = async () => {
    try {
      const url = editingFolder
        ? `/api/admin/bot-folders/${editingFolder.id}`
        : "/api/admin/bot-folders";
      const method = editingFolder ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(folderForm),
      });

      if (response.ok) {
        await loadData();
        setIsFolderDialogOpen(false);
        setFolderForm({ name: "", description: "", color: "#3B82F6", icon: "Folder" });
        setEditingFolder(null);
        alert(editingFolder ? "폴더가 수정되었습니다" : "폴더가 생성되었습니다");
      } else {
        const data = await response.json();
        alert(data.error || "폴더 저장에 실패했습니다");
      }
    } catch (error) {
      console.error("폴더 저장 오류:", error);
      alert("폴더 저장 중 오류가 발생했습니다");
    }
  };

  // 폴더 삭제
  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("정말 이 폴더를 삭제하시겠습니까?\n폴더 내 봇들은 '미분류'로 이동됩니다.")) return;

    try {
      const response = await fetch(`/api/admin/bot-folders/${folderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadData();
        if (selectedFolder === folderId) {
          setSelectedFolder(null);
        }
        alert("폴더가 삭제되었습니다");
      } else {
        const data = await response.json();
        alert(data.error || "폴더 삭제에 실패했습니다");
      }
    } catch (error) {
      console.error("폴더 삭제 오류:", error);
      alert("폴더 삭제 중 오류가 발생했습니다");
    }
  };

  // 봇 상세 정보 조회
  const handleViewDetails = async (botId: string) => {
    try {
      const response = await fetch(`/api/admin/ai-bots/detail?id=${botId}`);
      if (response.ok) {
        const data = await response.json();
        setViewingBot(data);
        setIsDetailDialogOpen(true);
      } else {
        const data = await response.json();
        alert(data.error || "상세 정보 조회에 실패했습니다");
      }
    } catch (error) {
      console.error("상세 정보 조회 오류:", error);
      alert("상세 정보 조회 중 오류가 발생했습니다");
    }
  };

  // 봇의 폴더 변경
  const handleMoveToFolder = async (botId: string, folderId: string | null) => {
    try {
      const response = await fetch(`/api/admin/ai-bots/${botId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const data = await response.json();
        alert(data.error || "폴더 이동에 실패했습니다");
      }
    } catch (error) {
      console.error("폴더 이동 오류:", error);
      alert("폴더 이동 중 오류가 발생했습니다");
    }
  };

  // 한국 시간 포맷
  const formatKoreanDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            AI 봇 통합 관리
          </h1>
          <p className="text-gray-600 mt-1">
            AI 봇을 생성, 수정, 삭제하고 폴더로 정리할 수 있습니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setFolderForm({ name: "", description: "", color: "#3B82F6", icon: "Folder" });
              setEditingFolder(null);
              setIsFolderDialogOpen(true);
            }}
            variant="outline"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            폴더 생성
          </Button>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            봇 추가
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 봇
            </CardTitle>
            <Bot className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{bots.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              활성 봇
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {bots.filter((b) => b.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              폴더
            </CardTitle>
            <Folder className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {folders.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              비활성 봇
            </CardTitle>
            <XCircle className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">
              {bots.filter((b) => !b.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="봇 이름, ID, 설명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedFolder || "all"}
              onValueChange={(value) =>
                setSelectedFolder(value === "all" ? null : value === "none" ? "none" : value)
              }
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="폴더 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 폴더</SelectItem>
                <SelectItem value="none">미분류</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name} ({folder.bots.length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(searchQuery || selectedFolder) && (
            <p className="text-sm text-gray-600 mt-2">
              {filteredBots.length}개의 검색 결과
            </p>
          )}
        </CardContent>
      </Card>

      {/* 폴더 목록 */}
      {folders.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Folder className="h-5 w-5" />
            폴더 목록
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <Card
                key={folder.id}
                className={`border-2 cursor-pointer transition-all ${
                  selectedFolder === folder.id
                    ? "border-blue-500 shadow-lg"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{ borderLeftColor: folder.color, borderLeftWidth: "4px" }}
                onClick={() =>
                  setSelectedFolder(selectedFolder === folder.id ? null : folder.id)
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="h-5 w-5" style={{ color: folder.color }} />
                      <CardTitle className="text-base">{folder.name}</CardTitle>
                    </div>
                    <Badge variant="secondary">{folder.bots.length}</Badge>
                  </div>
                  {folder.description && (
                    <CardDescription className="text-xs mt-2">
                      {folder.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFolderForm({
                          name: folder.name,
                          description: folder.description || "",
                          color: folder.color,
                          icon: folder.icon,
                        });
                        setEditingFolder(folder);
                        setIsFolderDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 봇 목록 */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI 봇 목록
          {selectedFolder && (
            <Badge variant="outline">
              {selectedFolder === "none"
                ? "미분류"
                : folders.find((f) => f.id === selectedFolder)?.name}
            </Badge>
          )}
        </h2>
        {filteredBots.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedFolder
                  ? "검색 결과가 없습니다"
                  : "등록된 AI 봇이 없습니다"}
              </p>
              {!searchQuery && !selectedFolder && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  첫 번째 봇 추가하기
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBots.map((bot) => (
              <Card
                key={bot.id}
                className={`border-2 hover:shadow-lg transition-shadow ${
                  bot.isActive ? "border-blue-100" : "border-gray-200 opacity-60"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`text-4xl p-3 rounded-lg bg-gradient-to-br ${bot.bgGradient}`}
                      >
                        {bot.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{bot.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {bot.nameEn}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge variant={bot.isActive ? "default" : "secondary"}>
                        {bot.isActive ? "활성" : "비활성"}
                      </Badge>
                      {bot.folder && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{ borderColor: bot.folder.color, color: bot.folder.color }}
                        >
                          {bot.folder.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {bot.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>ID: {bot.botId}</span>
                  </div>

                  {/* 기능 아이콘 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {bot.enableImageInput && (
                      <Badge variant="outline" className="text-xs">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        이미지
                      </Badge>
                    )}
                    {bot.enableVoiceOutput && (
                      <Badge variant="outline" className="text-xs">
                        <Volume2 className="h-3 w-3 mr-1" />
                        음성출력
                      </Badge>
                    )}
                    {bot.enableVoiceInput && (
                      <Badge variant="outline" className="text-xs">
                        <Mic className="h-3 w-3 mr-1" />
                        음성입력
                      </Badge>
                    )}
                    {bot.referenceFiles && bot.referenceFiles.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {bot.referenceFiles.length}개 파일
                      </Badge>
                    )}
                    {bot.starterMessages && bot.starterMessages.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {bot.starterMessages.length}개 질문
                      </Badge>
                    )}
                  </div>

                  {/* 폴더 이동 */}
                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">폴더</Label>
                    <Select
                      value={bot.folderId || "none"}
                      onValueChange={(value) =>
                        handleMoveToFolder(bot.id, value === "none" ? null : value)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="폴더 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">미분류</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewDetails(bot.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      상세
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingBot(bot)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={bot.isActive ? "secondary" : "default"}
                      size="sm"
                      onClick={() => handleToggleActive(bot.id, bot.isActive)}
                    >
                      {bot.isActive ? "비활성" : "활성"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(bot.id)}
                      disabled={deletingBotId === bot.id}
                    >
                      {deletingBotId === bot.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500">
                    생성자: {bot.createdBy.name}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 봇 생성 다이얼로그 */}
      <CreateBotDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={loadData}
      />

      {/* 봇 수정 다이얼로그 */}
      {editingBot && (
        <EditBotDialog
          bot={editingBot}
          open={!!editingBot}
          onOpenChange={(open) => !open && setEditingBot(null)}
          onSuccess={loadData}
        />
      )}

      {/* 폴더 생성/수정 다이얼로그 */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFolder ? "폴더 수정" : "새 폴더 생성"}
            </DialogTitle>
            <DialogDescription>
              AI 봇을 정리할 폴더를 {editingFolder ? "수정" : "생성"}합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName">폴더명 *</Label>
              <Input
                id="folderName"
                value={folderForm.name}
                onChange={(e) =>
                  setFolderForm({ ...folderForm, name: e.target.value })
                }
                placeholder="예: 학습 봇"
              />
            </div>
            <div>
              <Label htmlFor="folderDescription">설명</Label>
              <Input
                id="folderDescription"
                value={folderForm.description}
                onChange={(e) =>
                  setFolderForm({ ...folderForm, description: e.target.value })
                }
                placeholder="폴더 설명 (선택사항)"
              />
            </div>
            <div>
              <Label htmlFor="folderColor">색상</Label>
              <Input
                id="folderColor"
                type="color"
                value={folderForm.color}
                onChange={(e) =>
                  setFolderForm({ ...folderForm, color: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFolderDialogOpen(false);
                setFolderForm({ name: "", description: "", color: "#3B82F6", icon: "Folder" });
                setEditingFolder(null);
              }}
            >
              취소
            </Button>
            <Button onClick={handleSaveFolder} disabled={!folderForm.name}>
              {editingFolder ? "수정" : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 봇 상세 정보 다이얼로그 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {viewingBot && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`text-4xl p-3 rounded-lg bg-gradient-to-br ${viewingBot.bot.bgGradient}`}
                  >
                    {viewingBot.bot.icon}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">{viewingBot.bot.name}</DialogTitle>
                    <DialogDescription>{viewingBot.bot.nameEn}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* 봇 기본 정보 */}
                <div>
                  <h3 className="font-bold mb-2">기본 정보</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-semibold">ID:</span> {viewingBot.bot.botId}
                    </p>
                    <p>
                      <span className="font-semibold">설명:</span> {viewingBot.bot.description}
                    </p>
                    <p>
                      <span className="font-semibold">생성자:</span> {viewingBot.bot.createdBy.name} ({viewingBot.bot.createdBy.email})
                    </p>
                    <p>
                      <span className="font-semibold">생성일:</span> {formatKoreanDate(viewingBot.bot.createdAt)}
                    </p>
                    {viewingBot.bot.folder && (
                      <p>
                        <span className="font-semibold">폴더:</span>{" "}
                        <Badge
                          variant="outline"
                          style={{ borderColor: viewingBot.bot.folder.color, color: viewingBot.bot.folder.color }}
                        >
                          {viewingBot.bot.folder.name}
                        </Badge>
                      </p>
                    )}
                  </div>
                </div>

                {/* 할당 통계 */}
                <div>
                  <h3 className="font-bold mb-2">할당 통계</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">총 할당</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{viewingBot.stats.totalAssignments}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">활성</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {viewingBot.stats.activeAssignments}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">만료</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {viewingBot.stats.expiredAssignments}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">학원 수</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                          {Object.keys(viewingBot.stats.assignmentsByAcademy).length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* 역할별 할당 */}
                <div>
                  <h3 className="font-bold mb-2">역할별 할당</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">학원장</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {viewingBot.stats.assignmentsByRole.DIRECTOR}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">선생님</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {viewingBot.stats.assignmentsByRole.TEACHER}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">학생</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {viewingBot.stats.assignmentsByRole.STUDENT}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* 학원별 할당 */}
                {Object.keys(viewingBot.stats.assignmentsByAcademy).length > 0 && (
                  <div>
                    <h3 className="font-bold mb-2">학원별 할당</h3>
                    <div className="space-y-2">
                      {Object.entries(viewingBot.stats.assignmentsByAcademy).map(
                        ([academyName, count]) => (
                          <div
                            key={academyName}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <span className="text-sm">{academyName}</span>
                            <Badge>{count}명</Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* 최근 할당 내역 */}
                {viewingBot.assignments.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-2">최근 할당 내역 (최대 10개)</h3>
                    <div className="space-y-2">
                      {viewingBot.assignments.slice(0, 10).map((assignment) => (
                        <Card key={assignment.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{assignment.user.name}</span>
                                <Badge variant="outline">{assignment.user.role}</Badge>
                                {assignment.isActive ? (
                                  <Badge variant="default" className="bg-green-600">
                                    활성
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">비활성</Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {assignment.user.email}
                              </p>
                              {assignment.user.academy && (
                                <p className="text-xs text-gray-600">
                                  {assignment.user.academy.name} ({assignment.user.academy.code})
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                할당자: {assignment.grantedBy.name} • {formatKoreanDate(assignment.grantedAt)}
                              </p>
                              {assignment.expiresAt && (
                                <p className="text-xs text-red-600">
                                  만료: {formatKoreanDate(assignment.expiresAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
