"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { CreateBotDialog } from "@/components/admin/CreateBotDialog";
import { EditBotDialog } from "@/components/admin/EditBotDialog";

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
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function AIBotsManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bots, setBots] = useState<AIBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<AIBot | null>(null);
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null);

  // 권한 확인
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (session?.user?.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // 봇 목록 로드
  const loadBots = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ai-bots");
      if (response.ok) {
        const data = await response.json();
        setBots(data.bots);
      }
    } catch (error) {
      console.error("봇 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      loadBots();
    }
  }, [session]);

  // 봇 삭제
  const handleDelete = async (botId: string) => {
    if (!confirm("정말 이 봇을 삭제하시겠습니까?\n모든 할당도 함께 취소됩니다.")) return;

    try {
      setDeletingBotId(botId);
      const response = await fetch(`/api/admin/ai-bots/${botId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadBots();
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
        await loadBots();
      } else {
        const data = await response.json();
        alert(data.error || "상태 변경에 실패했습니다");
      }
    } catch (error) {
      console.error("상태 변경 오류:", error);
      alert("상태 변경 중 오류가 발생했습니다");
    }
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
            AI 봇 관리
          </h1>
          <p className="text-gray-600 mt-1">
            AI 봇을 생성, 수정, 삭제할 수 있습니다
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          새 봇 추가
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* 봇 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.map((bot) => (
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
                <Badge variant={bot.isActive ? "default" : "secondary"}>
                  {bot.isActive ? "활성" : "비활성"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {bot.description}
              </p>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>ID: {bot.botId}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>생성자: {bot.createdBy.name}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setEditingBot(bot)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  수정
                </Button>
                <Button
                  variant={bot.isActive ? "secondary" : "default"}
                  size="sm"
                  onClick={() => handleToggleActive(bot.id, bot.isActive)}
                >
                  {bot.isActive ? "비활성화" : "활성화"}
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 봇이 없는 경우 */}
      {bots.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">등록된 AI 봇이 없습니다</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              첫 번째 봇 추가하기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 봇 생성 다이얼로그 */}
      <CreateBotDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={loadBots}
      />

      {/* 봇 수정 다이얼로그 */}
      {editingBot && (
        <EditBotDialog
          bot={editingBot}
          open={!!editingBot}
          onOpenChange={(open) => !open && setEditingBot(null)}
          onSuccess={loadBots}
        />
      )}
    </div>
  );
}
