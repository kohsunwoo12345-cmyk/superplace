"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Search,
  Plus,
  MessageSquare,
  Activity,
  Calendar,
  Settings,
  Trash2,
} from "lucide-react";

interface AIBot {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  conversationCount: number;
  lastUsedAt?: string;
  createdAt: string;
  voiceIndex?: number;
  systemPrompt?: string;
  welcomeMessage?: string;
  starterMessages?: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export default function AdminAIBotsPage() {
  const router = useRouter();
  const [bots, setBots] = useState<AIBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingBot, setEditingBot] = useState<AIBot | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [editFormData, setEditFormData] = useState<any>({});

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setCurrentUser(userData);

    // Load TTS voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    fetchBots();
  }, [router]);

  const fetchBots = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ai-bots");
      if (response.ok) {
        const data = await response.json();
        setBots(data.bots || []);
      }
    } catch (error) {
      console.error("AI 봇 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (botId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/ai-bots/${botId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        fetchBots();
      }
    } catch (error) {
      console.error("상태 변경 실패:", error);
    }
  };

  const handleDelete = async (botId: string, botName: string) => {
    if (!confirm(`정말로 "${botName}" 봇을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/ai-bots/${botId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("삭제되었습니다.");
        fetchBots();
      }
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  const handleEditClick = async (bot: AIBot) => {
    try {
      // Fetch full bot details
      const response = await fetch(`/api/admin/ai-bots/${bot.id}`);
      if (response.ok) {
        const data = await response.json();
        setEditingBot(data.bot);
        setEditFormData({
          voiceIndex: data.bot.voiceIndex || 0,
          name: data.bot.name || "",
          description: data.bot.description || "",
        });
      }
    } catch (error) {
      console.error("봇 정보 로드 실패:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingBot) return;

    try {
      const response = await fetch(`/api/admin/ai-bots/${editingBot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceIndex: parseInt(editFormData.voiceIndex),
          name: editFormData.name,
          description: editFormData.description,
        }),
      });

      if (response.ok) {
        alert("수정되었습니다.");
        setEditingBot(null);
        fetchBots();
      }
    } catch (error) {
      console.error("수정 실패:", error);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  const testVoice = () => {
    const voiceIndex = parseInt(editFormData.voiceIndex);
    if (voiceIndex >= 0 && voiceIndex < voices.length) {
      const utterance = new SpeechSynthesisUtterance("안녕하세요! 이 목소리로 응답합니다.");
      utterance.voice = voices[voiceIndex];
      utterance.lang = "ko-KR";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredBots = bots.filter((bot) =>
    bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bot.description && bot.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: bots.length,
    active: bots.filter((b) => b.isActive).length,
    totalConversations: bots.reduce((sum, b) => sum + b.conversationCount, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-green-600" />
            AI 봇 관리
          </h1>
          <p className="text-gray-600 mt-1">
            AI 챗봇을 생성하고 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/dashboard/admin")}>
            대시보드로
          </Button>
          <Button onClick={() => router.push("/dashboard/admin/ai-bots/create")}>
            <Plus className="w-4 h-4 mr-2" />
            새 봇 만들기
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 AI 봇
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold">{stats.total}개</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              활성 봇
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold">{stats.active}개</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              총 대화 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-bold">{stats.totalConversations}건</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="봇 이름, 설명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* AI 봇 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>
            AI 봇 목록 ({filteredBots.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBots.map((bot) => (
              <Card
                key={bot.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-green-600" />
                      <CardTitle className="text-lg">{bot.name}</CardTitle>
                    </div>
                    <Badge variant={bot.isActive ? "default" : "secondary"}>
                      {bot.isActive ? "활성" : "비활성"}
                    </Badge>
                  </div>
                  {bot.description && (
                    <CardDescription className="mt-2">
                      {bot.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MessageSquare className="w-4 h-4" />
                    <span>대화 {bot.conversationCount}건</span>
                  </div>

                  {bot.lastUsedAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Activity className="w-4 h-4" />
                      <span>
                        최근 사용: {new Date(bot.lastUsedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                    <Calendar className="w-3 h-3" />
                    <span>
                      생성일: {new Date(bot.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleToggleActive(bot.id, bot.isActive)}
                    >
                      {bot.isActive ? "비활성화" : "활성화"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(bot)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(bot.id, bot.name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredBots.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">AI 봇이 없습니다.</p>
              <Button onClick={() => router.push("/dashboard/admin/ai-bots/create")}>
                <Plus className="w-4 h-4 mr-2" />
                새 봇 만들기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 편집 모달 */}
      {editingBot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                AI 봇 설정 편집
              </CardTitle>
              <CardDescription>
                {editingBot.name} 봇의 설정을 수정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 봇 이름 */}
              <div>
                <label className="block text-sm font-medium mb-2">봇 이름</label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="봇 이름"
                />
              </div>

              {/* 봇 설명 */}
              <div>
                <label className="block text-sm font-medium mb-2">봇 설명</label>
                <Input
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="봇 설명"
                />
              </div>

              {/* 음성 선택 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  🎤 TTS 음성 선택
                </label>
                <div className="flex gap-2">
                  <select
                    value={editFormData.voiceIndex}
                    onChange={(e) => setEditFormData({ ...editFormData, voiceIndex: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {voices.map((voice, index) => (
                      <option key={index} value={index}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={testVoice}
                  >
                    테스트
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  선택한 음성으로 AI 응답이 재생됩니다. 테스트 버튼으로 미리 들어보세요.
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingBot(null)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1"
                >
                  저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
