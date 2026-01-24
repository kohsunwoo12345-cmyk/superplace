"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageSquare, Users, Calendar, Search, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Conversation {
  id: string;
  userId: string;
  botId: string;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminConversationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      if (session?.user?.role !== "SUPER_ADMIN") {
        router.push("/dashboard");
      } else {
        loadConversations();
      }
    }
  }, [status, session, router]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/conversations", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("대화 목록 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.botId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">전체 대화 목록</h1>
        <p className="text-muted-foreground mt-2">
          모든 사용자의 AI 봇 대화를 확인할 수 있습니다
        </p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">총 대화</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">총 메시지</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.reduce((sum, c) => sum + c.messageCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">활성 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(conversations.map((c) => c.userId)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="사용자 이름, 이메일, 봇 ID로 검색..."
            className="pl-10"
          />
        </div>
      </div>

      {/* 대화 목록 */}
      <div className="space-y-3">
        {filteredConversations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              대화 기록이 없습니다
            </CardContent>
          </Card>
        ) : (
          filteredConversations.map((conv) => (
            <Card key={conv.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                        {conv.user?.name?.[0] || "U"}
                      </div>
                      <div>
                        <h3 className="font-semibold">{conv.user?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {conv.user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="ml-13 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span>봇 ID: {conv.botId}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span>메시지 수: {conv.messageCount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          마지막 대화:{" "}
                          {new Date(conv.lastMessageAt).toLocaleString("ko-KR")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/dashboard/ai-chat?botId=${conv.botId}&userId=${conv.userId}`
                      )
                    }
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
