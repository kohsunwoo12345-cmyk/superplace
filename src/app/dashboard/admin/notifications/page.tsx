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
  const [filterType, setFilterType] = useState<"all" | "academy" | "student" | "teacher" | "director">("all");
  const [selectedAcademies, setSelectedAcademies] = useState<number[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]); // 새로 추가
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"info" | "success" | "warning" | "error">("info");
  const [isSending, setIsSending] = useState(false);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [directors, setDirectors] = useState<any[]>([]);
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch academies, students, and notification history on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!userStr || !token) {
          alert("로그인이 필요합니다.");
          window.location.href = "/login";
          return;
        }

        const currentUser = JSON.parse(userStr);

        // Fetch academies
        const academiesRes = await fetch("/api/academies", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const academiesData = await academiesRes.json();
        if (academiesData.success) {
          const academyList = academiesData.academies.map((academy: any) => ({
            id: academy.id,
            name: academy.name,
            studentCount: academy.studentCount || 0,
          }));
          setAcademies(academyList);
        }

        // Fetch students
        const params = new URLSearchParams();
        if (currentUser.role) {
          params.append("role", currentUser.role);
        }
        if (currentUser.academy_id || currentUser.academyId) {
          params.append("academyId", String(currentUser.academy_id || currentUser.academyId));
        }
        if (currentUser.email) {
          params.append("email", currentUser.email);
        }
        
        const studentsRes = await fetch(`/api/students?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const studentsData = await studentsRes.json();
        if (studentsData.success) {
          const studentList = studentsData.students.map((student: any) => ({
            id: student.id,
            name: student.name,
            email: student.email,
            academyId: student.academyId,
            academyName: student.academyName || "미지정",
          }));
          setStudents(studentList);
          console.log('✅ Loaded students:', studentList.length);
        }

        // Fetch teachers
        const teachersParams = new URLSearchParams();
        if (currentUser.role) {
          teachersParams.append("role", currentUser.role);
        }
        const teachersRes = await fetch(`/api/teachers?${teachersParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const teachersData = await teachersRes.json();
        if (teachersData.success) {
          setTeachers(teachersData.teachers || []);
          console.log('✅ Loaded teachers:', teachersData.teachers?.length || 0);
        }

        // Fetch directors (from users table with role=DIRECTOR)
        const directorsRes = await fetch(`/api/users?role=DIRECTOR`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const directorsData = await directorsRes.json();
        if (directorsData.success) {
          setDirectors(directorsData.users || []);
          console.log('✅ Loaded directors:', directorsData.users?.length || 0);
        }

        // Fetch notification history
        const historyRes = await fetch("/api/notifications/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const historyData = await historyRes.json();
        if (historyData.success) {
          setSentNotifications(historyData.notifications || []);
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const toggleTeacher = (teacherId: number) => {
    setSelectedTeachers((prev) =>
      prev.includes(teacherId) ? prev.filter((id) => id !== teacherId) : [...prev, teacherId]
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

  const selectAllTeachers = () => {
    if (selectedTeachers.length === teachers.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(teachers.map((t) => t.id));
    }
  };

  const getRecipientCount = () => {
    if (filterType === "all") {
      return students.length + teachers.length + directors.length;
    } else if (filterType === "academy") {
      return students.filter((s) => selectedAcademies.includes(s.academyId)).length +
             teachers.filter((t: any) => selectedAcademies.includes(t.academyId)).length +
             directors.filter((d: any) => selectedAcademies.includes(d.academyId)).length;
    } else if (filterType === "student") {
      return selectedStudents.length;
    } else if (filterType === "teacher") {
      return selectedTeachers.length;
    } else if (filterType === "director") {
      return directors.length;
    }
    return 0;
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

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("로그인이 필요합니다.");
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType,
          filterType,
          selectedRoles: 
            filterType === "all" ? ["STUDENT", "TEACHER", "DIRECTOR"] :
            filterType === "academy" ? ["STUDENT", "TEACHER", "DIRECTOR"] :
            filterType === "student" ? ["STUDENT"] :
            filterType === "teacher" ? ["TEACHER"] :
            filterType === "director" ? ["DIRECTOR"] : [],
          selectedAcademies: filterType === "academy" ? selectedAcademies : [],
          selectedStudents: 
            filterType === "student" ? selectedStudents :
            filterType === "teacher" ? selectedTeachers :
            [],
        }),
      });

      const data = await response.json();

      if (data.success) {
        const newNotification = {
          id: data.notificationId,
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType,
          recipients: data.recipientCount,
          filterType,
          sentAt: data.sentAt,
          status: "전송 완료",
        };

        setSentNotifications((prev) => [newNotification, ...prev]);

        // 폼 초기화
        setNotificationTitle("");
        setNotificationMessage("");
        setNotificationType("info");
        setSelectedAcademies([]);
        setSelectedStudents([]);
        setSelectedTeachers([]);

        alert(`알림이 ${data.recipientCount}명에게 성공적으로 전송되었습니다!`);
      } else {
        alert(`알림 전송 실패: ${data.error || "알 수 없는 오류"}`);
      }
    } catch (error: any) {
      console.error("알림 전송 오류:", error);
      alert("알림 전송 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSending(false);
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

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
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  onClick={() => setFilterType("all")}
                  className="h-auto py-3"
                >
                  <Users className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div>전체</div>
                    <div className="text-xs opacity-75">{students.length + teachers.length + directors.length}명</div>
                  </div>
                </Button>
                <Button
                  variant={filterType === "academy" ? "default" : "outline"}
                  onClick={() => setFilterType("academy")}
                  className="h-auto py-3"
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div>학원별</div>
                    <div className="text-xs opacity-75">학원 선택</div>
                  </div>
                </Button>
                <Button
                  variant={filterType === "student" ? "default" : "outline"}
                  onClick={() => setFilterType("student")}
                  className="h-auto py-3"
                >
                  <User className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div>학생별</div>
                    <div className="text-xs opacity-75">{students.length}명</div>
                  </div>
                </Button>
                <Button
                  variant={filterType === "teacher" ? "default" : "outline"}
                  onClick={() => setFilterType("teacher")}
                  className="h-auto py-3"
                >
                  <Users className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div>교사별</div>
                    <div className="text-xs opacity-75">{teachers.length}명</div>
                  </div>
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

              {/* Teacher Selection */}
              {filterType === "teacher" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">교사 선택</p>
                    <Button variant="ghost" size="sm" onClick={selectAllTeachers}>
                      {selectedTeachers.length === teachers.length ? "선택 해제" : "전체 선택"}
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {teachers.map((teacher) => (
                      <label
                        key={teacher.id}
                        className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeachers.includes(teacher.id)}
                          onChange={() => toggleTeacher(teacher.id)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{teacher.name}</p>
                          <p className="text-sm text-gray-500">{teacher.email}</p>
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
                  <p>전체 사용자에게 알림이 전송됩니다</p>
                  <p className="text-sm mt-1">학생 {students.length}명 + 교사 {teachers.length}명 + 학원장 {directors.length}명</p>
                  <p className="text-sm font-semibold mt-2">총 {students.length + teachers.length + directors.length}명</p>
                </div>
              )}

              {filterType === "director" && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>전체 학원장에게 알림이 전송됩니다</p>
                  <p className="text-sm font-semibold mt-2">총 {directors.length}명</p>
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
