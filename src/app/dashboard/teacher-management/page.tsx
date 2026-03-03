"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Plus, Search, Mail, Phone, CheckCircle, XCircle, 
  Eye, EyeOff, Settings, Users, Shield, Edit2, Save, X, RefreshCw, Trash2 
} from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  approved: number;
  createdAt: string;
  academyId: string;
  permissions?: string[];
  assignedClasses?: string[];
}

interface Class {
  id: string;
  name: string;
  studentCount?: number;
}

export default function TeacherManagementPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  const [permissionData, setPermissionData] = useState<string[]>([]);
  const [classData, setClassData] = useState<string[]>([]);

  // 권한 목록
  const availablePermissions = [
    { id: "view_students", label: "학생 조회", description: "학생 목록 및 정보 조회" },
    { id: "edit_students", label: "학생 편집", description: "학생 정보 수정" },
    { id: "view_attendance", label: "출결 조회", description: "출결 기록 조회" },
    { id: "edit_attendance", label: "출결 관리", description: "출결 기록 입력/수정" },
    { id: "view_homework", label: "숙제 조회", description: "숙제 및 과제 조회" },
    { id: "create_homework", label: "숙제 생성", description: "숙제 생성 및 배정" },
    { id: "grade_homework", label: "숙제 채점", description: "숙제 채점 및 피드백" },
    { id: "view_reports", label: "리포트 조회", description: "학생 리포트 조회" },
    { id: "create_reports", label: "리포트 작성", description: "학생 리포트 작성" },
    { id: "send_messages", label: "메시지 발송", description: "학부모 메시지 발송" },
  ];

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    const user = JSON.parse(userStr);
    setCurrentUser(user);

    if (user.role !== "DIRECTOR" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      alert("권한이 없습니다.");
      router.push("/dashboard");
      return;
    }

    loadTeachers();
    loadClasses();
  }, [router]);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      console.log("📡 교사 목록 조회 중...");
      
      const response = await fetch("/api/teachers/list", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("교사 목록:", data);
        
        // Load pending teachers from localStorage
        const pendingKey = `pending_teachers_${currentUser?.id || 'unknown'}`;
        const pendingStr = localStorage.getItem(pendingKey);
        let pendingTeachers: Teacher[] = [];
        
        if (pendingStr) {
          try {
            pendingTeachers = JSON.parse(pendingStr);
            console.log(`📦 로컬스토리지에서 ${pendingTeachers.length}명의 대기중 교사 로드`);
            
            // Filter out expired pending teachers (older than 5 minutes)
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            pendingTeachers = pendingTeachers.filter((t: Teacher) => {
              const createdTime = new Date(t.createdAt).getTime();
              return createdTime > fiveMinutesAgo;
            });
            
            // Remove teachers that now exist in DB
            const dbTeacherIds = new Set(data.teachers.map((t: Teacher) => t.id));
            const stillPending = pendingTeachers.filter((t: Teacher) => !dbTeacherIds.has(t.id));
            
            if (stillPending.length !== pendingTeachers.length) {
              console.log(`✅ ${pendingTeachers.length - stillPending.length}명의 교사가 DB에 동기화됨`);
              localStorage.setItem(pendingKey, JSON.stringify(stillPending));
            }
            
            pendingTeachers = stillPending;
          } catch (e) {
            console.error("로컬스토리지 파싱 오류:", e);
            localStorage.removeItem(pendingKey);
          }
        }
        
        // Merge DB teachers with pending teachers
        const allTeachers = [...pendingTeachers, ...(data.teachers || [])];
        console.log(`📊 총 교사 수: ${allTeachers.length}명 (DB: ${data.teachers.length}, 대기: ${pendingTeachers.length})`);
        setTeachers(allTeachers);
      } else {
        const errorData = await response.json();
        console.error("교사 목록 조회 실패:", errorData);
      }
    } catch (error) {
      console.error("교사 목록 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("📚 반 목록 조회 중...");
      
      const response = await fetch("/api/classes", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("반 목록:", data);
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("반 목록 로드 오류:", error);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    if (!formData.email.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("올바른 이메일 형식이 아닙니다.");
      return;
    }

    if (!formData.phone.trim()) {
      alert("전화번호를 입력해주세요.");
      return;
    }

    if (!formData.password.trim()) {
      alert("비밀번호를 입력해주세요.");
      return;
    }

    if (formData.password.length < 6) {
      alert("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      console.log("📤 교사 추가 요청:", formData);

      const response = await fetch("/api/teachers/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      console.log("📥 응답 상태:", response.status);

      const data = await response.json();
      console.log("📦 응답 데이터:", data);

      if (response.ok && data.success) {
        alert(`✅ 교사가 추가되었습니다!\n\n임시 비밀번호: ${data.tempPassword}\n\n교사에게 전달해주세요.`);
        
        // 반환된 교사 정보를 즉시 목록에 추가 (D1 replica lag 우회)
        if (data.teacher) {
          console.log("✅ 새 교사를 즉시 목록에 추가:", data.teacher);
          const newTeacher = data.teacher;
          setTeachers(prev => [newTeacher, ...prev]);
          
          // Save to localStorage as pending (until DB syncs)
          const pendingKey = `pending_teachers_${currentUser?.id || 'unknown'}`;
          const existingPending = localStorage.getItem(pendingKey);
          let pendingList: Teacher[] = [];
          
          if (existingPending) {
            try {
              pendingList = JSON.parse(existingPending);
            } catch (e) {
              console.error("로컬스토리지 파싱 오류:", e);
            }
          }
          
          pendingList.push(newTeacher);
          localStorage.setItem(pendingKey, JSON.stringify(pendingList));
          console.log(`💾 로컬스토리지에 대기 교사 저장: ${newTeacher.id}`);
          
          // 여러 번 재시도하여 D1 동기화 확인
          let retryCount = 0;
          const maxRetries = 6; // 총 6번 시도 (10s, 30s, 60s, 90s, 120s, 150s)
          const retryIntervals = [10000, 20000, 30000, 30000, 30000, 30000]; // 간격
          
          const checkSync = async () => {
            if (retryCount >= maxRetries) {
              console.log("⚠️ 최대 재시도 횟수 도달 - UI 상태 유지");
              return;
            }
            
            const nextInterval = retryIntervals[retryCount];
            retryCount++;
            
            setTimeout(async () => {
              console.log(`🔄 재조회 시도 ${retryCount}/${maxRetries} (${nextInterval/1000}초 후)...`);
              try {
                const token = localStorage.getItem("token");
                const response = await fetch("/api/teachers/list", {
                  headers: {
                    "Authorization": `Bearer ${token}`
                  }
                });
                
                if (response.ok) {
                  const data = await response.json();
                  console.log(`📊 재조회 결과 (시도 ${retryCount}):`, data.total, "명");
                  
                  // 새 교사가 DB에 있는지 확인
                  const foundNewTeacher = data.teachers?.find((t: Teacher) => t.id === newTeacher.id);
                  if (foundNewTeacher) {
                    console.log("✅ D1 동기화 완료! DB에서 교사 조회됨");
                    
                    // Remove from pending
                    const pending = localStorage.getItem(pendingKey);
                    if (pending) {
                      try {
                        let pendingList = JSON.parse(pending);
                        pendingList = pendingList.filter((t: Teacher) => t.id !== newTeacher.id);
                        localStorage.setItem(pendingKey, JSON.stringify(pendingList));
                        console.log(`🗑️ 로컬스토리지에서 제거: ${newTeacher.id}`);
                      } catch (e) {
                        console.error("로컬스토리지 업데이트 오류:", e);
                      }
                    }
                    
                    // Load complete list (includes newly synced teacher)
                    await loadTeachers();
                  } else {
                    console.log(`⚠️ 아직 동기화 안됨 (시도 ${retryCount}/${maxRetries})`);
                    // 아직 동기화 안되면 다음 시도
                    checkSync();
                  }
                }
              } catch (e) {
                console.error("재조회 실패:", e);
                // 오류 발생 시에도 다음 시도
                checkSync();
              }
            }, nextInterval);
          };
          
          // 첫 번째 재조회 시작
          checkSync();
        }
        
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: ""
        });
        
        setShowAddDialog(false);
      } else {
        alert(`❌ 교사 추가 실패\n\n${data.error || data.message || "알 수 없는 오류"}`);
      }
    } catch (error: any) {
      console.error("교사 추가 오류:", error);
      alert(`❌ 오류 발생\n\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openPermissionDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setPermissionData(teacher.permissions || []);
    setShowPermissionDialog(true);
  };

  const openClassDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setClassData(teacher.assignedClasses || []);
    setShowClassDialog(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedTeacher) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      console.log("💾 권한 저장:", permissionData);

      const response = await fetch(`/api/teachers/${selectedTeacher.id}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ permissions: permissionData })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("✅ 권한이 저장되었습니다.");
        
        // Immediately update UI with new permissions
        setTeachers(prev => prev.map(t => 
          t.id === selectedTeacher.id 
            ? { ...t, permissions: permissionData }
            : t
        ));
        
        // Update localStorage pending teachers if exists
        const pendingKey = `pending_teachers_${currentUser?.id || 'unknown'}`;
        const pendingStr = localStorage.getItem(pendingKey);
        if (pendingStr) {
          try {
            let pendingList = JSON.parse(pendingStr);
            pendingList = pendingList.map((t: Teacher) => 
              t.id === selectedTeacher.id 
                ? { ...t, permissions: permissionData }
                : t
            );
            localStorage.setItem(pendingKey, JSON.stringify(pendingList));
            console.log("💾 로컬스토리지의 pending 교사 권한 업데이트 완료");
          } catch (e) {
            console.error("로컬스토리지 업데이트 오류:", e);
          }
        }
        
        setShowPermissionDialog(false);
        
        // Background reload to sync with DB (after replica lag)
        setTimeout(() => {
          console.log("🔄 권한 DB 동기화 확인 중...");
          loadTeachers();
        }, 5000);
      } else {
        alert(`❌ 권한 저장 실패\n\n${data.error || data.message || "알 수 없는 오류"}`);
      }
    } catch (error: any) {
      console.error("권한 저장 오류:", error);
      alert(`❌ 오류 발생\n\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClasses = async () => {
    if (!selectedTeacher) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      console.log("💾 반 배정 저장:", classData);

      const response = await fetch(`/api/teachers/${selectedTeacher.id}/classes`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ classes: classData })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("✅ 반 배정이 저장되었습니다.");
        
        // Immediately update UI with new classes
        setTeachers(prev => prev.map(t => 
          t.id === selectedTeacher.id 
            ? { ...t, assignedClasses: classData }
            : t
        ));
        
        // Update localStorage pending teachers if exists
        const pendingKey = `pending_teachers_${currentUser?.id || 'unknown'}`;
        const pendingStr = localStorage.getItem(pendingKey);
        if (pendingStr) {
          try {
            let pendingList = JSON.parse(pendingStr);
            pendingList = pendingList.map((t: Teacher) => 
              t.id === selectedTeacher.id 
                ? { ...t, assignedClasses: classData }
                : t
            );
            localStorage.setItem(pendingKey, JSON.stringify(pendingList));
            console.log("💾 로컬스토리지의 pending 교사 반 배정 업데이트 완료");
          } catch (e) {
            console.error("로컬스토리지 업데이트 오류:", e);
          }
        }
        
        setShowClassDialog(false);
        
        // Background reload to sync with DB (after replica lag)
        setTimeout(() => {
          console.log("🔄 반 배정 DB 동기화 확인 중...");
          loadTeachers();
        }, 5000);
      } else {
        alert(`❌ 반 배정 저장 실패\n\n${data.error || data.message || "알 수 없는 오류"}`);
      }
    } catch (error: any) {
      console.error("반 배정 저장 오류:", error);
      alert(`❌ 오류 발생\n\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setPermissionData(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleClass = (classId: string) => {
    setClassData(prev => 
      prev.includes(classId)
        ? prev.filter(c => c !== classId)
        : [...prev, classId]
    );
  };

  const handleDeleteTeacher = async (teacher: Teacher) => {
    if (!confirm(`정말 "${teacher.name}" 교사를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      console.log(`🗑️ 교사 삭제: ${teacher.name} (${teacher.id})`);

      const response = await fetch(`/api/teachers/${teacher.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ "${teacher.name}" 교사가 삭제되었습니다.`);
        
        // 로컬 상태에서 제거
        setTeachers(prev => prev.filter(t => t.id !== teacher.id));
        
        // 로컬스토리지의 pending 교사 목록에서도 제거
        const pendingKey = `pending_teachers_${currentUser?.id || 'unknown'}`;
        const pendingStr = localStorage.getItem(pendingKey);
        if (pendingStr) {
          try {
            let pendingList = JSON.parse(pendingStr);
            pendingList = pendingList.filter((t: Teacher) => t.id !== teacher.id);
            localStorage.setItem(pendingKey, JSON.stringify(pendingList));
            console.log("💾 로컬스토리지의 pending 교사 목록에서 제거 완료");
          } catch (e) {
            console.error("로컬스토리지 업데이트 오류:", e);
          }
        }
        
        // DB 동기화 확인
        setTimeout(() => {
          console.log("🔄 교사 삭제 DB 동기화 확인 중...");
          loadTeachers();
        }, 2000);
      } else {
        alert(`❌ 교사 삭제 실패\n\n${data.error || data.message || "알 수 없는 오류"}`);
      }
    } catch (error: any) {
      console.error("교사 삭제 오류:", error);
      alert(`❌ 오류 발생\n\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-indigo-600 rounded-lg shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">교사 관리</h1>
              <p className="text-gray-600">교사를 추가하고 권한 및 반을 배정하세요</p>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">전체 교사</p>
                <p className="text-3xl font-bold text-gray-800">{teachers.length}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">승인됨</p>
                <p className="text-3xl font-bold text-gray-800">
                  {teachers.filter(t => t.approved === 1).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">전체 반</p>
                <p className="text-3xl font-bold text-gray-800">{classes.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 검색 및 추가 버튼 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="이름, 이메일, 전화번호로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={loadTeachers}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:opacity-50"
              title="목록 새로고침"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              교사 추가
            </button>
          </div>
        </div>

        {/* 교사 목록 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <User className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg">등록된 교사가 없습니다</p>
              <p className="text-sm">교사 추가 버튼을 눌러 새로운 교사를 등록하세요</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      연락처
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      이메일
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-600" />
                          </div>
                          <span className="font-medium text-gray-800">{teacher.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {teacher.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {teacher.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {teacher.approved === 1 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            승인됨
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                            <XCircle className="w-4 h-4" />
                            대기 중
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openPermissionDialog(teacher)}
                            className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                            title="권한 설정"
                          >
                            <Shield className="w-4 h-4" />
                            권한
                          </button>
                          <button
                            onClick={() => openClassDialog(teacher)}
                            className="flex items-center gap-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                            title="반 배정"
                          >
                            <Users className="w-4 h-4" />
                            반 배정
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(teacher)}
                            className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                            title="교사 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 교사 추가 모달 */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Plus className="w-6 h-6" />
                새 교사 추가
              </h2>
              <p className="text-indigo-100 mt-1">교사 정보를 입력하세요</p>
            </div>

            <form onSubmit={handleAddTeacher} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="홍길동"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="teacher@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="최소 6자 이상"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  교사가 첫 로그인 후 비밀번호를 변경할 수 있습니다
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDialog(false);
                    setFormData({ name: "", email: "", phone: "", password: "" });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "추가 중..." : "교사 추가"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 권한 설정 모달 */}
      {showPermissionDialog && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Shield className="w-6 h-6" />
                권한 설정
              </h2>
              <p className="text-blue-100 mt-1">{selectedTeacher.name} 교사의 권한을 설정하세요</p>
            </div>

            <div className="p-6 space-y-3">
              {availablePermissions.map((permission) => (
                <div
                  key={permission.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    permissionData.includes(permission.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                  onClick={() => togglePermission(permission.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {permissionData.includes(permission.id) ? (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{permission.label}</h3>
                      <p className="text-sm text-gray-600">{permission.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => setShowPermissionDialog(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSavePermissions}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                disabled={loading}
              >
                <span className="flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? "저장 중..." : "저장"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 반 배정 모달 */}
      {showClassDialog && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6" />
                반 배정
              </h2>
              <p className="text-purple-100 mt-1">{selectedTeacher.name} 교사에게 반을 배정하세요</p>
            </div>

            <div className="p-6">
              {classes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">등록된 반이 없습니다</p>
                  <p className="text-sm">먼저 반을 생성해주세요</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {classes.map((classItem) => (
                    <div
                      key={classItem.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        classData.includes(classItem.id)
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                      onClick={() => toggleClass(classItem.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          {classData.includes(classItem.id) ? (
                            <CheckCircle className="w-5 h-5 text-purple-600" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{classItem.name}</h3>
                          {classItem.studentCount !== undefined && (
                            <p className="text-sm text-gray-600">학생 {classItem.studentCount}명</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => setShowClassDialog(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSaveClasses}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                disabled={loading || classes.length === 0}
              >
                <span className="flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? "저장 중..." : "저장"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
