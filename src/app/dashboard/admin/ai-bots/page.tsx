"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  X,
  Edit,
} from "lucide-react";

const GEMINI_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (추천)", description: "균형잡힌 속도와 품질, 안정 버전", recommended: true },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "고급 추론 능력, 복잡한 작업에 최적", recommended: false },
  { value: "gemini-3.0-preview", label: "Gemini 3.0 Preview", description: "차세대 모델, 테스트 중", recommended: false },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", description: "초고속, 비용 효율적", recommended: false },
];

const PROFILE_EMOJIS = [
  "🤖", "💻", "📚", "🎓", "🧠", "💡", "🔬", "🎨", "🎯", "🚀",
  "⭐", "✨", "🌟", "💫", "🔥", "🎪", "🎭", "🎬", "🎤", "🎧"
];

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
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [botVoiceSettings, setBotVoiceSettings] = useState<{[key: string]: number}>({});
  const [editingBotId, setEditingBotId] = useState<string | null>(null);
  const [editingBot, setEditingBot] = useState<AIBot | null>(null);
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
        
        // 봇의 voiceIndex를 state에 저장
        const voiceSettings: {[key: string]: number} = {};
        (data.bots || []).forEach((bot: AIBot) => {
          voiceSettings[bot.id] = bot.voiceIndex || 0;
        });
        setBotVoiceSettings(voiceSettings);
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

  const handleVoiceChange = (botId: string, voiceIndex: number) => {
    setBotVoiceSettings({
      ...botVoiceSettings,
      [botId]: voiceIndex
    });
  };

  const handleEditClick = async (bot: AIBot) => {
    try {
      // Fetch full bot details
      const response = await fetch(`/api/admin/ai-bots/${bot.id}`);
      if (response.ok) {
        const data = await response.json();
        setEditingBot(data.bot);
        setEditFormData({
          name: data.bot.name || "",
          description: data.bot.description || "",
          systemPrompt: data.bot.systemPrompt || "",
          welcomeMessage: data.bot.welcomeMessage || "",
          starterMessage1: data.bot.starterMessage1 || "",
          starterMessage2: data.bot.starterMessage2 || "",
          starterMessage3: data.bot.starterMessage3 || "",
          profileIcon: data.bot.profileIcon || "🤖",
          profileImage: data.bot.profileImage || "",
          model: data.bot.model || "gemini-2.5-flash",
          temperature: String(data.bot.temperature || 0.7),
          maxTokens: String(data.bot.maxTokens || 2000),
          topK: String(data.bot.topK || 40),
          topP: String(data.bot.topP || 0.95),
          language: data.bot.language || "ko",
          voiceIndex: String(data.bot.voiceIndex || 0),
        });
      }
    } catch (error) {
      console.error("봇 정보 로드 실패:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingBot) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/ai-bots/${editingBot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name,
          description: editFormData.description,
          systemPrompt: editFormData.systemPrompt,
          welcomeMessage: editFormData.welcomeMessage,
          starterMessage1: editFormData.starterMessage1,
          starterMessage2: editFormData.starterMessage2,
          starterMessage3: editFormData.starterMessage3,
          profileIcon: editFormData.profileIcon,
          profileImage: editFormData.profileImage,
          model: editFormData.model,
          temperature: parseFloat(editFormData.temperature),
          maxTokens: parseInt(editFormData.maxTokens),
          topK: parseInt(editFormData.topK),
          topP: parseFloat(editFormData.topP),
          language: editFormData.language,
          voiceIndex: parseInt(editFormData.voiceIndex),
        }),
      });

      if (response.ok) {
        alert("✅ 수정되었습니다.");
        setEditingBot(null);
        fetchBots();
      } else {
        alert("❌ 수정 실패");
      }
    } catch (error) {
      console.error("수정 실패:", error);
      alert("❌ 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVoice = async (botId: string) => {
    try {
      const response = await fetch(`/api/admin/ai-bots/${botId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceIndex: botVoiceSettings[botId] }),
      });

      if (response.ok) {
        alert("✅ 음성 설정이 저장되었습니다!");
        setEditingBotId(null);
        fetchBots();
      }
    } catch (error) {
      console.error("음성 설정 저장 실패:", error);
      alert("❌ 저장 중 오류가 발생했습니다.");
    }
  };

  const handleSaveAllVoices = async () => {
    try {
      setLoading(true);
      const updates = Object.entries(botVoiceSettings).map(([botId, voiceIndex]) => 
        fetch(`/api/admin/ai-bots/${botId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voiceIndex }),
        })
      );

      await Promise.all(updates);
      alert("✅ 모든 봇의 음성 설정이 저장되었습니다!");
      setShowSettings(false);
      fetchBots();
    } catch (error) {
      console.error("음성 설정 저장 실패:", error);
      alert("❌ 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const testVoice = (voiceIndex: number) => {
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
          <Button 
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
          >
            <Settings className="w-4 h-4 mr-2" />
            음성 설정
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">봇 이름</th>
                  <th className="text-left py-3 px-4 font-semibold">설명</th>
                  <th className="text-center py-3 px-4 font-semibold">상태</th>
                  <th className="text-center py-3 px-4 font-semibold">대화 수</th>
                  <th className="text-center py-3 px-4 font-semibold">최근 사용</th>
                  <th className="text-center py-3 px-4 font-semibold">음성 설정</th>
                  <th className="text-center py-3 px-4 font-semibold">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredBots.map((bot) => (
                  <tr key={bot.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{bot.profileIcon || "🤖"}</span>
                        <span className="font-medium">{bot.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate">
                      {bot.description || "-"}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge variant={bot.isActive ? "default" : "secondary"}>
                        {bot.isActive ? "활성" : "비활성"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span>{bot.conversationCount}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">
                      {bot.lastUsedAt
                        ? new Date(bot.lastUsedAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="py-4 px-4">
                      {editingBotId === bot.id ? (
                        <div className="flex gap-1 items-center">
                          <select
                            value={botVoiceSettings[bot.id] || 0}
                            onChange={(e) => handleVoiceChange(bot.id, parseInt(e.target.value))}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {voices.map((voice, index) => (
                              <option key={index} value={index}>
                                {voice.name}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testVoice(botVoiceSettings[bot.id] || 0)}
                            className="px-2"
                          >
                            🔊
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveVoice(bot.id)}
                            className="px-2"
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingBotId(null)}
                            className="px-2"
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingBotId(bot.id)}
                          className="w-full"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          설정
                        </Button>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-1 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(bot)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(bot.id, bot.isActive)}
                        >
                          {bot.isActive ? "비활성" : "활성"}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* 전체 음성 설정 패널 */}
      {showSettings && (
        <Card className="border-2 border-blue-500">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              🎤 AI 봇 음성 설정
            </CardTitle>
            <CardDescription>
              모든 AI 봇의 TTS 음성을 한 번에 설정할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {filteredBots.map((bot) => (
                <div key={bot.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {bot.profileIcon || "🤖"} {bot.name}
                      </h3>
                      <p className="text-sm text-gray-600">{bot.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={botVoiceSettings[bot.id] || 0}
                      onChange={(e) => handleVoiceChange(bot.id, parseInt(e.target.value))}
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
                      onClick={() => testVoice(botVoiceSettings[bot.id] || 0)}
                      size="sm"
                    >
                      테스트
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-6 border-t mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSettings(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleSaveAllVoices}
                className="flex-1"
              >
                모두 저장
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 전체 필드 편집 모달 */}
      {editingBot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <CardHeader className="bg-blue-50 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="w-5 h-5 text-blue-600" />
                    AI 봇 편집: {editingBot.name}
                  </CardTitle>
                  <CardDescription>
                    봇의 모든 설정을 수정할 수 있습니다
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingBot(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* 기본 정보 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">기본 정보</h3>
                
                <div>
                  <Label htmlFor="edit-name">봇 이름 *</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="봇 이름"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description">봇 설명</Label>
                  <Textarea
                    id="edit-description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    placeholder="봇에 대한 간단한 설명"
                    rows={2}
                  />
                </div>

                {/* 프로필 아이콘 */}
                <div>
                  <Label>프로필 아이콘</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-4xl">{editFormData.profileIcon}</div>
                    <select
                      value={editFormData.profileIcon}
                      onChange={(e) => setEditFormData({ ...editFormData, profileIcon: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {PROFILE_EMOJIS.map((emoji) => (
                        <option key={emoji} value={emoji}>
                          {emoji}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 환영 메시지 및 스타터 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">환영 메시지 & 스타터</h3>
                
                <div>
                  <Label htmlFor="edit-welcome">환영 메시지</Label>
                  <Textarea
                    id="edit-welcome"
                    value={editFormData.welcomeMessage}
                    onChange={(e) => setEditFormData({ ...editFormData, welcomeMessage: e.target.value })}
                    placeholder="대화를 시작할 때 표시할 첫 인사말"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>스타터 메시지 (추천 질문)</Label>
                  <div className="space-y-2 mt-2">
                    <Input
                      value={editFormData.starterMessage1}
                      onChange={(e) => setEditFormData({ ...editFormData, starterMessage1: e.target.value })}
                      placeholder="예: 수학 문제 풀이 도와줘"
                    />
                    <Input
                      value={editFormData.starterMessage2}
                      onChange={(e) => setEditFormData({ ...editFormData, starterMessage2: e.target.value })}
                      placeholder="예: 영어 문법 설명해줘"
                    />
                    <Input
                      value={editFormData.starterMessage3}
                      onChange={(e) => setEditFormData({ ...editFormData, starterMessage3: e.target.value })}
                      placeholder="예: 과학 개념 알려줘"
                    />
                  </div>
                </div>
              </div>

              {/* 시스템 프롬프트 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">시스템 프롬프트 (지침) *</h3>
                <Textarea
                  value={editFormData.systemPrompt}
                  onChange={(e) => setEditFormData({ ...editFormData, systemPrompt: e.target.value })}
                  placeholder="봇이 어떻게 행동하고 응답해야 하는지 상세히 설명하세요"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              {/* Gemini 설정 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Gemini 모델 설정</h3>
                
                <div>
                  <Label>모델 선택</Label>
                  <select
                    value={editFormData.model}
                    onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2"
                  >
                    {GEMINI_MODELS.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label} - {model.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Temperature: {editFormData.temperature}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={editFormData.temperature}
                      onChange={(e) => setEditFormData({ ...editFormData, temperature: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Max Tokens: {editFormData.maxTokens}</Label>
                    <Input
                      type="number"
                      step="100"
                      value={editFormData.maxTokens}
                      onChange={(e) => setEditFormData({ ...editFormData, maxTokens: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Top K: {editFormData.topK}</Label>
                    <Input
                      type="number"
                      value={editFormData.topK}
                      onChange={(e) => setEditFormData({ ...editFormData, topK: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Top P: {editFormData.topP}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={editFormData.topP}
                      onChange={(e) => setEditFormData({ ...editFormData, topP: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* 음성 설정 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">🎤 TTS 음성 설정</h3>
                <div className="flex gap-2">
                  <select
                    value={editFormData.voiceIndex}
                    onChange={(e) => setEditFormData({ ...editFormData, voiceIndex: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
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
                    onClick={() => {
                      const voiceIndex = parseInt(editFormData.voiceIndex);
                      if (voiceIndex >= 0 && voiceIndex < voices.length) {
                        const utterance = new SpeechSynthesisUtterance("안녕하세요! 이 목소리로 응답합니다.");
                        utterance.voice = voices[voiceIndex];
                        utterance.lang = "ko-KR";
                        utterance.rate = 1.0;
                        utterance.pitch = 1.0;
                        window.speechSynthesis.speak(utterance);
                      }
                    }}
                  >
                    테스트
                  </Button>
                </div>
              </div>

              {/* 저장 버튼 */}
              <div className="flex gap-2 pt-4 border-t sticky bottom-0 bg-white">
                <Button
                  variant="outline"
                  onClick={() => setEditingBot(null)}
                  className="flex-1"
                  disabled={loading}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? "저장 중..." : "저장"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );\n}
