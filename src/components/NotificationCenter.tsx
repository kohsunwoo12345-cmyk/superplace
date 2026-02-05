"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, X, CheckCircle, FileText, MessageSquare, 
  Calendar, Award, AlertCircle 
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Notification {
  id: string;
  type: "attendance" | "homework" | "chat" | "achievement" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: "low" | "medium" | "high";
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 알림 로드 (실제로는 API에서 가져옴)
    loadNotifications();
    
    // 실시간 알림 리스너 설정
    const interval = setInterval(() => {
      checkNewNotifications();
    }, 30000); // 30초마다 확인

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      // 사용자 정보에서 academyId 가져오기
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      const academyId = user.academyId;
      
      // API에서 학원별 필터링된 알림 가져오기
      const response = await fetch(`/api/notifications?academyId=${academyId || ''}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        // API 실패 시 빈 배열 설정 (다른 학원 알림 표시 안 함)
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
      // 에러 시에도 알림 표시 안 함 (보안상 중요)
      setNotifications([]);
    }
  };

  const checkNewNotifications = async () => {
    // 실제로는 API에서 새 알림 확인
    // const response = await fetch("/api/notifications/new");
    // const newNotifications = await response.json();
    // setNotifications(prev => [...newNotifications, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "attendance":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "homework":
        return <FileText className="w-5 h-5 text-blue-600" />;
      case "chat":
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case "achievement":
        return <Award className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 border-red-200";
      case "medium":
        return "bg-blue-100 border-blue-200";
      default:
        return "bg-gray-100 border-gray-200";
    }
  };

  return (
    <div className="relative">
      {/* 알림 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* 알림 패널 */}
      {isOpen && (
        <>
          {/* 배경 클릭 영역 */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 알림 목록 */}
          <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white rounded-lg shadow-xl border-2 z-50 overflow-hidden">
            {/* 헤더 */}
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">알림</h3>
                  <p className="text-xs text-gray-600">
                    {unreadCount}개의 읽지 않은 알림
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    모두 읽음
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 알림 목록 */}
            <div className="overflow-y-auto max-h-[500px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>알림이 없습니다</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                        !notif.read ? "bg-blue-50" : ""
                      }`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm">{notif.title}</h4>
                            {!notif.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {format(notif.timestamp, "MM월 dd일 HH:mm", { locale: ko })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 푸터 */}
            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50 text-center">
                <Button variant="link" className="text-sm" onClick={() => {
                  setIsOpen(false);
                  // 알림 페이지로 이동
                }}>
                  모든 알림 보기
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
