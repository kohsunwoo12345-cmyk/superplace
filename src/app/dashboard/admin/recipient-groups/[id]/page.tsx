'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, UserPlus, Trash2, User, GraduationCap } from 'lucide-react';

// Disable static generation for this dynamic route
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

interface GroupMember {
  memberId: string;
  parentId: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string | null;
  relationship: string | null;
  studentId: string | null;
  studentName: string | null;
  studentCode: string | null;
  className: string | null;
}

interface Parent {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

interface Student {
  id: string;
  name: string;
  studentCode: string;
  className: string | null;
}

export default function RecipientGroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [allParents, setAllParents] = useState<Parent[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  useEffect(() => {
    fetchGroupDetails();
    fetchAllParents();
    fetchAllStudents();
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/recipient-groups/${groupId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setGroup(data.group);
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllParents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/parents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAllParents(data.parents || []);
      }
    } catch (error) {
      console.error('Error fetching parents:', error);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users?role=STUDENT', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAllStudents(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleAddMember = async () => {
    if (!selectedParentId) {
      alert('학부모를 선택하세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/recipient-groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          addMembers: [{
            parentId: selectedParentId,
            studentId: selectedStudentId || undefined
          }]
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('멤버가 추가되었습니다.');
        setShowAddModal(false);
        setSelectedParentId('');
        setSelectedStudentId('');
        fetchGroupDetails();
      } else {
        alert(data.error || '멤버 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('멤버 추가 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('이 멤버를 그룹에서 제거하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/recipient-groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          removeMembers: [memberId]
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('멤버가 제거되었습니다.');
        fetchGroupDetails();
      } else {
        alert(data.error || '멤버 제거에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('멤버 제거 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">그룹을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-sm text-gray-600">{group.description || '설명 없음'}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4" />
          멤버 추가
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">전체 멤버</p>
          <p className="text-2xl font-bold text-gray-900">{members.length}명</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">학생 연결됨</p>
          <p className="text-2xl font-bold text-blue-600">
            {members.filter(m => m.studentId).length}명
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">학생 미연결</p>
          <p className="text-2xl font-bold text-orange-600">
            {members.filter(m => !m.studentId).length}명
          </p>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">그룹 멤버</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {members.map((member) => (
            <div key={member.memberId} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.parentName}</h3>
                      <p className="text-sm text-gray-600">{member.parentPhone}</p>
                      {member.parentEmail && (
                        <p className="text-xs text-gray-500">{member.parentEmail}</p>
                      )}
                    </div>
                    {member.relationship && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {member.relationship === 'father' ? '아버지' : 
                         member.relationship === 'mother' ? '어머니' : '보호자'}
                      </span>
                    )}
                  </div>

                  {member.studentId ? (
                    <div className="flex items-center gap-2 ml-8 mt-2 p-3 bg-blue-50 rounded-lg">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          {member.studentName} ({member.studentCode})
                        </p>
                        {member.className && (
                          <p className="text-xs text-blue-700">{member.className}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="ml-8 mt-2 p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-700">연결된 학생이 없습니다</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleRemoveMember(member.memberId)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="px-6 py-12 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">그룹에 멤버가 없습니다.</p>
              <p className="text-sm text-gray-500 mt-1">멤버를 추가하세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">멤버 추가</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학부모 선택 *
                </label>
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택하세요</option>
                  {allParents
                    .filter(p => !members.some(m => m.parentId === p.id))
                    .map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.name} ({parent.phone})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연결할 학생 (선택)
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택하세요</option>
                  {allStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.studentCode}) {student.className ? `- ${student.className}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  치환 문자에 학생 정보를 사용할 수 있습니다
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedParentId('');
                  setSelectedStudentId('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleAddMember}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
