"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Send, Trash2, Edit, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ScheduledPost {
  id: string;
  platform: string;
  title?: string;
  content: string;
  scheduledFor: string;
  status: string;
  createdAt: string;
}

export default function SchedulerPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  
  // Form state
  const [platform, setPlatform] = useState("naver_blog");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  useEffect(() => {
    loadScheduledPosts();
  }, []);

  const loadScheduledPosts = async () => {
    try {
      const response = await fetch("/api/scheduler/posts");
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Failed to load scheduled posts:", error);
    }
  };

  const handleSchedule = async () => {
    if (!content.trim() || !scheduledDate || !scheduledTime) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const scheduledFor = `${scheduledDate}T${scheduledTime}:00`;
    const scheduledDateTime = new Date(scheduledFor);
    
    if (scheduledDateTime <= new Date()) {
      toast({
        title: "시간 오류",
        description: "예약 시간은 현재 시간보다 이후여야 합니다.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/scheduler/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          title: title || undefined,
          content,
          scheduledFor,
        }),
      });

      if (response.ok) {
        toast({
          title: "예약 완료",
          description: `${format(scheduledDateTime, "yyyy년 MM월 dd일 HH:mm")}에 게시됩니다.`,
        });
        
        // Reset form
        setTitle("");
        setContent("");
        setScheduledDate("");
        setScheduledTime("");
        
        // Reload posts
        loadScheduledPosts();
      } else {
        throw new Error("예약 실패");
      }
    } catch (error) {
      console.error("Schedule error:", error);
      toast({
        title: "오류",
        description: "게시물 예약 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (postId: string) => {
    try {
      const response = await fetch(`/api/scheduler/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "취소 완료",
          description: "예약이 취소되었습니다.",
        });
        loadScheduledPosts();
      }
    } catch (error) {
      console.error("Cancel error:", error);
      toast({
        title: "오류",
        description: "취소 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      naver_blog: "네이버 블로그",
      instagram: "Instagram",
      youtube: "YouTube",
      tiktok: "TikTok",
      karrot: "당근마켓",
    };
    return names[platform] || platform;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; label: string }> = {
      PENDING: { color: "bg-blue-100 text-blue-700", icon: Clock, label: "대기 중" },
      PUBLISHED: { color: "bg-green-100 text-green-700", icon: CheckCircle, label: "발행됨" },
      FAILED: { color: "bg-red-100 text-red-700", icon: XCircle, label: "실패" },
      CANCELLED: { color: "bg-gray-100 text-gray-700", icon: XCircle, label: "취소됨" },
    };
    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${badge.color}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    );
  };

  const pendingPosts = posts.filter(p => p.status === "PENDING");
  const completedPosts = posts.filter(p => p.status !== "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">콘텐츠 스케줄러</h1>
        <p className="text-muted-foreground mt-2">
          콘텐츠를 예약하여 최적의 시간에 자동으로 게시하세요
        </p>
      </div>

      {/* Schedule Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            새 게시물 예약
          </CardTitle>
          <CardDescription>
            플랫폼을 선택하고 콘텐츠를 작성한 후 게시 시간을 설정하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">플랫폼 *</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger id="platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="naver_blog">네이버 블로그</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="karrot">당근마켓</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">제목 (선택)</Label>
            <Input
              id="title"
              placeholder="게시물 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">내용 *</Label>
            <Textarea
              id="content"
              placeholder="게시할 내용을 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">예약 날짜 *</Label>
              <Input
                id="date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">예약 시간 *</Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleSchedule}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                예약하는 중...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                게시물 예약하기
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Pending Posts */}
      {pendingPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>예약된 게시물 ({pendingPosts.length})</CardTitle>
            <CardDescription>
              예약된 게시물은 지정된 시간에 자동으로 발행됩니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPosts.map((post) => (
                <div
                  key={post.id}
                  className="border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{getPlatformName(post.platform)}</span>
                        {getStatusBadge(post.status)}
                      </div>
                      {post.title && (
                        <h4 className="font-semibold mb-1">{post.title}</h4>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(post.scheduledFor), "yyyy-MM-dd HH:mm")}에 게시 예정
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Posts */}
      {completedPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>이전 게시물</CardTitle>
            <CardDescription>
              발행되었거나 취소된 게시물 내역
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedPosts.slice(0, 10).map((post) => (
                <div
                  key={post.id}
                  className="border rounded-lg p-4 opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{getPlatformName(post.platform)}</span>
                        {getStatusBadge(post.status)}
                      </div>
                      {post.title && (
                        <h4 className="font-semibold mb-1">{post.title}</h4>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {posts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              아직 예약된 게시물이 없습니다.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              위 폼을 사용하여 첫 번째 게시물을 예약해보세요!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
