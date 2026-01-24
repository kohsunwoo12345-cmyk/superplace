"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Search,
  Plus,
  Folder,
  FolderPlus,
  Filter,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronRight,
  Settings,
} from "lucide-react";

interface BotFolder {
  id: string;
  name: string;
  description: string;
  color: string;
  _count: {
    bots: number;
  };
  createdAt: string;
}

interface AIBot {
  id: string;
  botId: string;
  name: string;
  description: string;
  systemPrompt: string;
  referenceFiles: string[];
  starterMessages: string[];
  allowImageInput: boolean;
  allowVoiceOutput: boolean;
  allowVoiceInput: boolean;
  isActive: boolean;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  folder: {
    id: string;
    name: string;
    color: string;
  } | null;
  assignments: any[];
  _count: {
    assignments: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalBots: number;
  activeBots: number;
  inactiveBots: number;
  totalAssignments: number;
  totalFolders: number;
}

export default function BotsUnifiedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<AIBot[]>([]);
  const [folders, setFolders] = useState<BotFolder[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBots: 0,
    activeBots: 0,
    inactiveBots: 0,
    totalAssignments: 0,
    totalFolders: 0,
  });

  // 필터/검색 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // 모달 상태
  const [showCreateBotModal, setShowCreateBotModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showBotDetailModal, setShowBotDetailModal] = useState(false);
  const [selectedBot, setSelectedBot] = useState<AIBot | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      if (session?.user?.role !== "SUPER_ADMIN") {
        router.push("/dashboard");
      } else {
        fetchData();
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "SUPER_ADMIN") {
      fetchData();
    }
  }, [searchQuery, selectedFolder, isActiveFilter, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchQuery,
        folderId: selectedFolder,
        ...(isActiveFilter && { isActive: isActiveFilter }),
        sortBy,
        sortOrder,
      });

      const response = await fetch(
        `/api/admin/bots-unified?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("데이터를 불러오는데 실패했습니다");
      }

      const data = await response.json();
      setBots(data.bots);
      setFolders(data.folders);
      setStats(data.stats);
    } catch (error) {
      console.error("데이터 로딩 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async (botData: any) => {
    try {
      const response = await fetch("/api/admin/bots-unified", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(botData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "봇 생성에 실패했습니다");
        return;
      }

      alert("AI 봇이 생성되었습니다");
      setShowCreateBotModal(false);
      fetchData();
    } catch (error) {
      console.error("봇 생성 오류:", error);
      alert("봇 생성 중 오류가 발생했습니다");
    }
  };

  const handleCreateFolder = async (folderData: any) => {
    try {
      const response = await fetch("/api/admin/bot-folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(folderData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "폴더 생성에 실패했습니다");
        return;
      }

      alert("폴더가 생성되었습니다");
      setShowCreateFolderModal(false);
      fetchData();
    } catch (error) {
      console.error("폴더 생성 오류:", error);
      alert("폴더 생성 중 오류가 발생했습니다");
    }
  };

  const handleDeleteBot = async (botId: string) => {
    if (!confirm("정말 이 봇을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/bots-unified/${botId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "봇 삭제에 실패했습니다");
        return;
      }

      alert("봇이 삭제되었습니다");
      fetchData();
    } catch (error) {
      console.error("봇 삭제 오류:", error);
      alert("봇 삭제 중 오류가 발생했습니다");
    }
  };

  const handleToggleActive = async (botId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/bots-unified/${botId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "상태 변경에 실패했습니다");
        return;
      }

      fetchData();
    } catch (error) {
      console.error("상태 변경 오류:", error);
      alert("상태 변경 중 오류가 발생했습니다");
    }
  };

  const handleViewDetails = async (botId: string) => {
    try {
      const response = await fetch(`/api/admin/bots-unified/${botId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("봇 상세 정보를 불러오는데 실패했습니다");
      }

      const data = await response.json();
      setSelectedBot(data.bot);
      setShowBotDetailModal(true);
    } catch (error) {
      console.error("봇 상세 정보 로딩 오류:", error);
      alert("봇 정보를 불러오는데 실패했습니다");
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="bg-yellow-200">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Bot className="w-8 h-8" />
          통합 AI 봇 관리
        </h1>
        <p className="text-gray-600">
          AI 봇을 폴더로 정리하고 관리할 수 있습니다
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 봇</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBots}</p>
            </div>
            <Bot className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">활성 봇</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeBots}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">비활성 봇</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactiveBots}</p>
            </div>
            <XCircle className="w-8 h-8 text-gray-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 할당</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalAssignments}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">폴더</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.totalFolders}
              </p>
            </div>
            <Folder className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* 검색 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검색
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="봇 이름, 설명, ID 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 폴더 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              폴더
            </label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">전체</option>
              <option value="none">폴더 없음</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name} ({folder._count.bots})
                </option>
              ))}
            </select>
          </div>

          {/* 활성 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태
            </label>
            <select
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">전체</option>
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </div>

          {/* 정렬 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              정렬
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt-desc">최신순</option>
              <option value="createdAt-asc">오래된순</option>
              <option value="name-asc">이름순 (A-Z)</option>
              <option value="name-desc">이름순 (Z-A)</option>
            </select>
          </div>
        </div>

        {/* 버튼 */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setShowCreateBotModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            새 봇 추가
          </button>
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <FolderPlus className="w-4 h-4" />
            새 폴더 추가
          </button>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedFolder("all");
              setIsActiveFilter("");
              setSortBy("createdAt");
              setSortOrder("desc");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Filter className="w-4 h-4" />
            필터 초기화
          </button>
        </div>

        {/* 결과 개수 */}
        <div className="mt-4 text-sm text-gray-600">
          총 {bots.length}개의 봇이 검색되었습니다
        </div>
      </div>

      {/* 봇 목록 */}
      {bots.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">검색 결과가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              {/* 봇 헤더 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot
                      className={`w-5 h-5 ${
                        bot.isActive ? "text-blue-600" : "text-gray-400"
                      }`}
                    />
                    <h3 className="text-lg font-bold text-gray-900">
                      {highlightText(bot.name, searchQuery)}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    ID: {highlightText(bot.botId, searchQuery)}
                  </p>
                  {bot.folder && (
                    <div
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs mb-2"
                      style={{
                        backgroundColor: bot.folder.color + "20",
                        color: bot.folder.color,
                      }}
                    >
                      <Folder className="w-3 h-3" />
                      {bot.folder.name}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      handleToggleActive(bot.botId, bot.isActive)
                    }
                    className={`p-2 rounded ${
                      bot.isActive
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                    title={bot.isActive ? "활성" : "비활성"}
                  >
                    {bot.isActive ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* 봇 설명 */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {highlightText(bot.description, searchQuery)}
              </p>

              {/* 할당 정보 */}
              <div className="flex items-center gap-2 mb-4 text-sm">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  {bot._count.assignments}명에게 할당됨
                </span>
              </div>

              {/* 생성 정보 */}
              <div className="text-xs text-gray-500 mb-4">
                생성: {formatDateTime(bot.createdAt)}
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(bot.botId)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Eye className="w-4 h-4" />
                  상세보기
                </button>
                <button
                  onClick={() => handleDeleteBot(bot.botId)}
                  className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 봇 생성 모달 */}
      {showCreateBotModal && (
        <CreateBotModal
          onClose={() => setShowCreateBotModal(false)}
          onCreate={handleCreateBot}
          folders={folders}
        />
      )}

      {/* 폴더 생성 모달 */}
      {showCreateFolderModal && (
        <CreateFolderModal
          onClose={() => setShowCreateFolderModal(false)}
          onCreate={handleCreateFolder}
        />
      )}

      {/* 봇 상세 모달 */}
      {showBotDetailModal && selectedBot && (
        <BotDetailModal
          bot={selectedBot}
          onClose={() => {
            setShowBotDetailModal(false);
            setSelectedBot(null);
          }}
        />
      )}
    </div>
  );
}

/* 봇 생성 모달 컴포넌트 */
function CreateBotModal({
  onClose,
  onCreate,
  folders,
}: {
  onClose: () => void;
  onCreate: (data: any) => void;
  folders: BotFolder[];
}) {
  const [formData, setFormData] = useState({
    botId: "",
    name: "",
    description: "",
    systemPrompt: "",
    referenceFiles: "",
    starterMessages: "",
    allowImageInput: false,
    allowVoiceOutput: false,
    allowVoiceInput: false,
    isActive: true,
    folderId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      referenceFiles: formData.referenceFiles
        ? formData.referenceFiles.split("\n").filter((f) => f.trim())
        : [],
      starterMessages: formData.starterMessages
        ? formData.starterMessages.split("\n").filter((m) => m.trim())
        : [],
      folderId: formData.folderId || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">새 AI 봇 추가</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                봇 ID (필수)
              </label>
              <input
                type="text"
                value={formData.botId}
                onChange={(e) =>
                  setFormData({ ...formData, botId: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded"
                placeholder="예: math-tutor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                이름 (필수)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded"
                placeholder="예: 수학 튜터"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                설명 (필수)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                rows={3}
                className="w-full px-3 py-2 border rounded"
                placeholder="봇의 역할과 기능 설명"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                시스템 프롬프트 (필수)
              </label>
              <textarea
                value={formData.systemPrompt}
                onChange={(e) =>
                  setFormData({ ...formData, systemPrompt: e.target.value })
                }
                required
                rows={4}
                className="w-full px-3 py-2 border rounded"
                placeholder="AI 봇의 역할과 행동 방식을 정의"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">폴더</label>
              <select
                value={formData.folderId}
                onChange={(e) =>
                  setFormData({ ...formData, folderId: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">폴더 없음</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.allowImageInput}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      allowImageInput: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">이미지 입력 허용</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.allowVoiceOutput}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      allowVoiceOutput: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">음성 출력 허용</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.allowVoiceInput}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      allowVoiceInput: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">음성 입력 허용</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
                <span className="text-sm">활성화</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                생성
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* 폴더 생성 모달 컴포넌트 */
function CreateFolderModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });

  const colors = [
    "#3B82F6", // blue
    "#EF4444", // red
    "#10B981", // green
    "#F59E0B", // yellow
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#6366F1", // indigo
    "#14B8A6", // teal
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">새 폴더 추가</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                폴더 이름 (필수)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded"
                placeholder="예: 수학 봇"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">설명</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border rounded"
                placeholder="폴더 설명 (선택사항)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">색상</label>
              <div className="grid grid-cols-8 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded ${
                      formData.color === color
                        ? "ring-2 ring-gray-900"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                생성
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* 봇 상세 모달 컴포넌트 */
function BotDetailModal({
  bot,
  onClose,
}: {
  bot: AIBot & { assignmentStats?: any };
  onClose: () => void;
}) {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{bot.name}</h2>
              <p className="text-sm text-gray-600">ID: {bot.botId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* 기본 정보 */}
            <div>
              <h3 className="text-lg font-bold mb-3">기본 정보</h3>
              <div className="bg-gray-50 p-4 rounded space-y-2">
                <div>
                  <span className="font-medium">설명:</span>{" "}
                  {bot.description}
                </div>
                <div>
                  <span className="font-medium">상태:</span>{" "}
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      bot.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {bot.isActive ? "활성" : "비활성"}
                  </span>
                </div>
                {bot.folder && (
                  <div>
                    <span className="font-medium">폴더:</span>{" "}
                    <span
                      className="px-2 py-1 rounded text-xs"
                      style={{
                        backgroundColor: bot.folder.color + "20",
                        color: bot.folder.color,
                      }}
                    >
                      {bot.folder.name}
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-medium">생성자:</span>{" "}
                  {bot.creator.name} ({bot.creator.email})
                </div>
                <div>
                  <span className="font-medium">생성일:</span>{" "}
                  {formatDateTime(bot.createdAt)}
                </div>
              </div>
            </div>

            {/* 시스템 프롬프트 */}
            <div>
              <h3 className="text-lg font-bold mb-3">시스템 프롬프트</h3>
              <div className="bg-gray-50 p-4 rounded">
                <pre className="whitespace-pre-wrap text-sm">
                  {bot.systemPrompt}
                </pre>
              </div>
            </div>

            {/* 기능 */}
            <div>
              <h3 className="text-lg font-bold mb-3">기능</h3>
              <div className="flex gap-2">
                {bot.allowImageInput && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    이미지 입력
                  </span>
                )}
                {bot.allowVoiceOutput && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                    음성 출력
                  </span>
                )}
                {bot.allowVoiceInput && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                    음성 입력
                  </span>
                )}
              </div>
            </div>

            {/* 할당 정보 */}
            <div>
              <h3 className="text-lg font-bold mb-3">
                할당 정보 ({bot.assignments.length}명)
              </h3>
              {bot.assignments.length === 0 ? (
                <p className="text-gray-600">할당된 사용자가 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {bot.assignments.slice(0, 10).map((assignment: any) => (
                    <div
                      key={assignment.id}
                      className="bg-gray-50 p-3 rounded flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">
                          {assignment.user.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {assignment.user.email} •{" "}
                          {assignment.user.role === "DIRECTOR"
                            ? "학원장"
                            : assignment.user.role === "TEACHER"
                            ? "선생님"
                            : "학생"}
                          {assignment.user.academy && (
                            <> • {assignment.user.academy.name}</>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          할당일: {formatDateTime(assignment.assignedAt)}
                        </div>
                      </div>
                      <div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            assignment.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {assignment.isActive ? "활성" : "비활성"}
                        </span>
                      </div>
                    </div>
                  ))}
                  {bot.assignments.length > 10 && (
                    <p className="text-sm text-gray-600 text-center">
                      ...외 {bot.assignments.length - 10}명
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
