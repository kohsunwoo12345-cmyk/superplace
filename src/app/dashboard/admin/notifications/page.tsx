"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Send, Filter, Users, GraduationCap, User, Check, X, AlertCircle } from "lucide-react";

interface Academy {
  id: number;
  name: string;
  studentCount: number;
}

interface Student {
  id: number;
  name: string;
  email: string;
  academyId: number;
  academyName: string;
}

export default function NotificationsPage() {
  const [filterType, setFilterType] = useState<"all" | "academy" | "student">("all");
  const [selectedAcademies, setSelectedAcademies] = useState<number[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"info" | "success" | "warning" | "error">("info");
  const [isSending, setIsSending] = useState(false);

  // 더미 데이터
  const academies: Academy[] = [
    { id: 1, name: "A학원", studentCount: 45 },
    { id: 2, name: "B학원", studentCount: 32 },
    { id: 3, name: "C학원", studentCount: 28 },
    { id: 4, name: "D학원", studentCount: 51 },
    { id: 5, name: "E학원", studentCount: 19 },
  ];

  const students: Student[] = [
    { id: 1, name: "김철수", email: "student1@test.com", academyId: 1, academyName: "A학원" },
    { id: 2, name: "이영희", email: "student2@test.com", academyId: 1, academyName: "A학원" },
    { id: 3, name: "박민수", email: "student3@test.com", academyId: 2, academyName: "B학원" },
    { id: 4, name: "최지현", email: "student4@test.com", academyId: 2, academyName: "B학원" },
    { id: 5, name: "정수진", email: "student5@test.com", academyId: 3, academyName: "C학원" },
  ];

  const [sentNotifications, setSentNotifications] = useState<any[]>([]);

  const filteredStudents = students.filter((student) => {
    if (filterType === "academy" && selectedAcademies.length > 0) {
      return selectedAcademies.includes(student.academyId);
    }
    return true;
  });

  const toggleAcademy = (academyId: number) => {
    setSelectedAcademies((prev) =>
      prev.includes(academyId) ? prev.filter((id) => id !== academyId) : [...prev, academyId]
    );
  };

  const toggleStudent = (studentId: number) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const selectAllAcademies = () => {
    if (selectedAcademies.length === academies.length) {
      setSelectedAcademies([]);
    } else {
      setSelectedAcademies(academies.map((a) => a.id));
    }
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id));
    }
  };

  const getRecipientCount = () => {
    if (filterType === "all") {
      return students.length;
    } else if (filterType === "academy") {
      return students.filter((s) => selectedAcademies.includes(s.academyId)).length;
    } else {
      return selectedStudents.length;
    }
  };

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      alert("제목과 메시지를 입력해주세요.");
      return;
    }

    if (getRecipientCount() === 0) {
      alert("알림을 받을 대상을 선택해주세요.");
      return;
    }

    setIsSending(true);

    // TODO: API 연동
    setTimeout(() => {
      const newNotification = {
        id: Date.now(),
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        recipients: getRecipientCount(),
        filterType,
        sentAt: new Date().toISOString(),
        status: "전송 완료",
      };

      setSentNotifications((prev) => [newNotification, ...prev]);
      
      // 폼 초기화
      setNotificationTitle("");
      setNotificationMessage("");
      setNotificationType("info");
      setSelectedAcademies([]);
      setSelectedStudents([]);
      
      setIsSending(false);
      alert(`알림이 ${getRecipientCount()}명에게 전송되었습니다!`);
    }, 1500);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-700";
      case "warning":
        return "bg-yellow-100 text-yellow-700";
      case "error":
        return "bg-red-100 text-red-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <Check className="w-4 h-4" />;
      case "warning":
        return <AlertCircle className="w-4 h-4" />;
      case "error":
        return <X className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8 text-blue-600" />
            알림 관리
          </h1>
          <p className="text-gray-600 mt-1">학원 및 학생에게 푸시 알림 전송</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-2 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">전체 학원</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{academies.length}개</div>
            <p className="text-sm text-gray-500 mt-2">등록된 학원</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">전체 학생</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{students.length}명</div>
            <p className="text-sm text-gray-500 mt-2">등록된 학생</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">발송 예정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{getRecipientCount()}명</div>
            <p className="text-sm text-gray-500 mt-2">선택된 대상</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">전송 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{sentNotifications.length}건</div>
            <p className="text-sm text-gray-500 mt-2">오늘</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Form */}
        <div className="space-y-6">
          {/* Filter Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                대상 선택
              </CardTitle>
              <CardDescription>알림을 받을 대상을 선택하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  onClick={() => setFilterType("all")}
                  className="flex-1"
                >
                  <Users className="w-4 h-4 mr-2" />
                  전체
                </Button>
                <Button
                  variant={filterType === "academy" ? "default" : "outline"}
                  onClick={() => setFilterType("academy")}
                  className="flex-1"
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  학원별
                </Button>
                <Button
                  variant={filterType === "student" ? "default" : "outline"}
                  onClick={() => setFilterType("student")}
                  className="flex-1"
                >
                  <User className="w-4 h-4 mr-2" />
                  학생별
                </Button>
              </div>

              {/* Academy Selection */}
              {filterType === "academy" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">학원 선택</p>
                    <Button variant="ghost" size="sm" onClick={selectAllAcademies}>
                      {selectedAcademies.length === academies.length ? "선택 해제" : "전체 선택"}
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {academies.map((academy) => (
                      <label
                        key={academy.id}
                        className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAcademies.includes(academy.id)}
                          onChange={() => toggleAcademy(academy.id)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{academy.name}</p>
                          <p className="text-sm text-gray-500">학생 {academy.studentCount}명</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Selection */}
              {filterType === "student" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">학생 선택</p>
                    <Button variant="ghost" size="sm" onClick={selectAllStudents}>
                      {selectedStudents.length === filteredStudents.length ? "선택 해제" : "전체 선택"}
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredStudents.map((student) => (
                      <label
                        key={student.id}
                        className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudent(student.id)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-500">
                            {student.academyName} · {student.email}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {filterType === "all" && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>전체 학생에게 알림이 전송됩니다</p>
                  <p className="text-sm">총 {students.length}명</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Content */}
          <Card>
            <CardHeader>
              <CardTitle>알림 내용</CardTitle>
              <CardDescription>전송할 알림의 제목과 메시지를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">알림 유형</label>
                <div className="flex gap-2">
                  {[
                    { value: "info", label: "정보", color: "blue" },
                    { value: "success", label: "성공", color: "green" },
                    { value: "warning", label: "경고", color: "yellow" },
                    { value: "error", label: "오류", color: "red" },
                  ].map((type) => (
                    <Button
                      key={type.value}
                      variant={notificationType === type.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNotificationType(type.value as any)}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-medium mb-2 block">제목</label>
                <input
                  type="text"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="알림 제목을 입력하세요"
                  className="w-full px-4 py-2 border rounded-lg"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">{notificationTitle.length}/50</p>
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium mb-2 block">메시지</label>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="알림 메시지를 입력하세요"
                  className="w-full px-4 py-2 border rounded-lg resize-none"
                  rows={4}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">{notificationMessage.length}/200</p>
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSendNotification}
                disabled={isSending || !notificationTitle || !notificationMessage}
                className="w-full"
                size="lg"
              >
                {isSending ? (
                  <>전송 중...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {getRecipientCount()}명에게 알림 전송
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sent Notifications History */}
        <Card>
          <CardHeader>
            <CardTitle>전송 내역</CardTitle>
            <CardDescription>최근 전송된 알림 목록</CardDescription>
          </CardHeader>
          <CardContent>
            {sentNotifications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>전송된 알림이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {sentNotifications.map((notification) => (
                  <div key={notification.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getTypeColor(notification.type)}`}>
                          {getTypeIcon(notification.type)}
                          {notification.type.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.sentAt).toLocaleString("ko-KR")}
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {notification.status}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>수신자: {notification.recipients}명</span>
                      <span>
                        필터: {notification.filterType === "all" && "전체"}
                        {notification.filterType === "academy" && "학원별"}
                        {notification.filterType === "student" && "학생별"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
