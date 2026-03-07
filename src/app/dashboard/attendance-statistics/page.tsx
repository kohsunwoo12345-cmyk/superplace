"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Calendar, CheckCircle, ChevronLeft, ChevronRight, Plus, Target, ListTodo, Clock, Check, X
} from "lucide-react";

interface Todo {
  id: string;
  title: string;
  date: string;
  completed: boolean;
}

interface AttendanceRecord {
  date: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  checkInTime?: string;
}

export default function AttendanceStatisticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [showTodoDialog, setShowTodoDialog] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const userData = JSON.parse(userStr);
    setUser(userData);
    
    // Load todos from localStorage
    const savedTodos = localStorage.getItem(`todos_${userData.id}`);
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
    
    fetchAttendanceRecords(userData);
  }, [router, currentYear, currentMonth]);

  const fetchAttendanceRecords = async (userData: any) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch attendance records for current month
      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      
      console.log('📅 Fetching attendance:', { userId: userData.id, startDate, endDate });
      
      const response = await fetch(
        `/api/attendance/records?userId=${userData.id}&startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Attendance records:', data);
        if (data.success && data.records) {
          setAttendanceRecords(data.records);
        }
      } else {
        console.error('❌ Failed to fetch attendance');
      }
    } catch (error) {
      console.error("❌ Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveTodos = (newTodos: Todo[]) => {
    setTodos(newTodos);
    if (user) {
      localStorage.setItem(`todos_${user.id}`, JSON.stringify(newTodos));
    }
  };

  const addTodo = (date: string) => {
    if (!newTodoTitle.trim()) return;
    
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      title: newTodoTitle,
      date,
      completed: false
    };
    
    saveTodos([...todos, newTodo]);
    setNewTodoTitle("");
    setShowTodoDialog(false);
  };

  const toggleTodo = (todoId: string) => {
    saveTodos(todos.map(todo => 
      todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (todoId: string) => {
    saveTodos(todos.filter(todo => todo.id !== todoId));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getAttendanceForDate = (dateStr: string) => {
    return attendanceRecords.find(r => r.date === dateStr);
  };

  const getTodosForDate = (dateStr: string) => {
    return todos.filter(t => t.date === dateStr);
  };

  // 역할에 따라 리다이렉트
  useEffect(() => {
    if (user && user.role !== "STUDENT") {
      // 선생님/관리자는 teacher-attendance 페이지로 리다이렉트
      router.push("/dashboard/teacher-attendance");
    }
  }, [user, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 학생이 아니면 리다이렉트 (이미 useEffect에서 처리됨)
  if (user.role !== "STUDENT") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calendar generation
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-indigo-900">
              <Calendar className="h-8 w-8 text-indigo-600" />
              📅 나의 학습 캘린더
            </h1>
            <p className="text-gray-600 mt-1">
              출석 현황과 목표를 관리하세요
            </p>
          </div>
        </div>

        {/* Calendar Card */}
        <Card className="border-2 border-indigo-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="hover:bg-indigo-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <CardTitle className="text-2xl font-bold text-indigo-900">
                {currentYear}년 {currentMonth}월
              </CardTitle>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="hover:bg-indigo-100"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription className="text-center mt-2">
              🟢 출석 | 🟡 지각 | 🔴 결석 | 📝 할 일
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-7 gap-2">
              {/* 요일 헤더 */}
              {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                <div 
                  key={day} 
                  className={`text-center font-bold p-3 rounded ${
                    idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {day}
                </div>
              ))}

              {/* 빈 셀 */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2"></div>
              ))}

              {/* 날짜 셀 */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = dateStr === today;
                const attendance = getAttendanceForDate(dateStr);
                const dayTodos = getTodosForDate(dateStr);
                
                let bgColor = 'bg-white hover:bg-gray-50';
                let borderColor = 'border-gray-200';
                let emoji = '';
                
                if (attendance) {
                  if (attendance.status === 'PRESENT') {
                    bgColor = 'bg-green-50 hover:bg-green-100';
                    borderColor = 'border-green-300';
                    emoji = '🟢';
                  } else if (attendance.status === 'LATE') {
                    bgColor = 'bg-yellow-50 hover:bg-yellow-100';
                    borderColor = 'border-yellow-300';
                    emoji = '🟡';
                  } else if (attendance.status === 'ABSENT') {
                    bgColor = 'bg-red-50 hover:bg-red-100';
                    borderColor = 'border-red-300';
                    emoji = '🔴';
                  }
                }
                
                if (isToday) {
                  borderColor = 'border-indigo-500 ring-2 ring-indigo-500';
                }

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`min-h-[100px] p-2 border-2 rounded-lg cursor-pointer transition-all ${bgColor} ${borderColor}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-semibold ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                        {day}
                      </span>
                      {emoji && <span className="text-lg">{emoji}</span>}
                    </div>
                    
                    {/* 할 일 표시 */}
                    <div className="mt-1 space-y-1">
                      {dayTodos.slice(0, 2).map(todo => (
                        <div
                          key={todo.id}
                          className={`text-xs p-1 rounded truncate ${
                            todo.completed 
                              ? 'bg-gray-200 line-through text-gray-500' 
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {todo.title}
                        </div>
                      ))}
                      {dayTodos.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayTodos.length - 2} more
                        </div>
                      )}
                    </div>
                    
                    {/* 출석 시간 */}
                    {attendance?.checkInTime && (
                      <div className="text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(attendance.checkInTime).toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 선택된 날짜 상세 */}
        {selectedDate && (
          <Card className="border-2 border-indigo-200 shadow-lg">
            <CardHeader className="bg-indigo-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-indigo-900">
                  📅 {selectedDate} 상세
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowTodoDialog(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  할 일 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 출석 정보 */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    출석 기록
                  </h3>
                  {(() => {
                    const attendance = getAttendanceForDate(selectedDate);
                    if (attendance) {
                      return (
                        <div className="p-4 border-2 rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={
                              attendance.status === 'PRESENT' ? 'bg-green-500' :
                              attendance.status === 'LATE' ? 'bg-yellow-500' : 'bg-red-500'
                            }>
                              {attendance.status === 'PRESENT' ? '✅ 출석' :
                               attendance.status === 'LATE' ? '⏰ 지각' : '❌ 결석'}
                            </Badge>
                          </div>
                          {attendance.checkInTime && (
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              출석 시각: {new Date(attendance.checkInTime).toLocaleString('ko-KR')}
                            </p>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-4 border-2 border-dashed rounded-lg text-center text-gray-500">
                          <p>출석 기록이 없습니다</p>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* 할 일 목록 */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-indigo-600" />
                    할 일 목록
                  </h3>
                  <div className="space-y-2">
                    {getTodosForDate(selectedDate).length === 0 ? (
                      <div className="p-4 border-2 border-dashed rounded-lg text-center text-gray-500">
                        <p>할 일이 없습니다</p>
                        <p className="text-xs mt-1">버튼을 눌러 추가하세요</p>
                      </div>
                    ) : (
                      getTodosForDate(selectedDate).map(todo => (
                        <div
                          key={todo.id}
                          className={`p-3 border-2 rounded-lg flex items-center justify-between ${
                            todo.completed ? 'bg-gray-50 border-gray-300' : 'bg-white border-indigo-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <button
                              onClick={() => toggleTodo(todo.id)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                todo.completed 
                                  ? 'bg-green-500 border-green-500' 
                                  : 'border-gray-300 hover:border-indigo-500'
                              }`}
                            >
                              {todo.completed && <Check className="w-4 h-4 text-white" />}
                            </button>
                            <span className={todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                              {todo.title}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 할 일 추가 다이얼로그 */}
        <Dialog open={showTodoDialog} onOpenChange={setShowTodoDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>📝 할 일 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">날짜</label>
                <Input
                  type="date"
                  value={selectedDate || ''}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">할 일</label>
                <Input
                  placeholder="예: 수학 숙제 완료하기"
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && selectedDate) {
                      addTodo(selectedDate);
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => selectedDate && addTodo(selectedDate)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  disabled={!newTodoTitle.trim() || !selectedDate}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  추가하기
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTodoDialog(false);
                    setNewTodoTitle('');
                  }}
                >
                  취소
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                이번 달 출석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {attendanceRecords.filter(r => r.status === 'PRESENT').length}일
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                지각
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {attendanceRecords.filter(r => r.status === 'LATE').length}일
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-indigo-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                이번 달 할 일
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">
                {todos.filter(t => {
                  const todoMonth = new Date(t.date).getMonth() + 1;
                  const todoYear = new Date(t.date).getFullYear();
                  return todoYear === currentYear && todoMonth === currentMonth;
                }).length}개
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
