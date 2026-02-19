'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Users, Trash2, Edit, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface RecipientGroup {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  createdAt: string;
}

interface ExcelRow {
  '학부모명': string;
  '전화번호': string;
  '이메일'?: string;
  '관계'?: string;
  '학생코드'?: string;
  '메모'?: string;
}

export default function RecipientGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<RecipientGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadGroupName, setUploadGroupName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/recipient-groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      alert('그룹 이름을 입력하세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/recipient-groups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newGroup)
      });

      const data = await response.json();
      if (data.success) {
        alert('그룹이 생성되었습니다.');
        setShowCreateModal(false);
        setNewGroup({ name: '', description: '' });
        fetchGroups();
      } else {
        alert(data.error || '그룹 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('그룹 생성 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('이 그룹을 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/recipient-groups/${groupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        alert('그룹이 삭제되었습니다.');
        fetchGroups();
      } else {
        alert(data.error || '그룹 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('그룹 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadExcel = async () => {
    if (!uploadFile) {
      alert('파일을 선택하세요.');
      return;
    }

    setUploading(true);

    try {
      // Read Excel file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

          // Convert to API format
          const formattedData = jsonData.map((row) => ({
            parentName: row['학부모명'],
            parentPhone: row['전화번호'],
            parentEmail: row['이메일'] || '',
            relationship: row['관계'] || '',
            studentCode: row['학생코드'] || '',
            notes: row['메모'] || ''
          }));

          // Upload to API
          const token = localStorage.getItem('token');
          const response = await fetch('/api/admin/parents/upload-excel', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              data: formattedData,
              groupName: uploadGroupName.trim() || undefined,
              groupDescription: uploadGroupName ? `엑셀 업로드로 생성된 그룹` : undefined
            })
          });

          const result = await response.json();
          if (result.success) {
            alert(`업로드 완료!\n성공: ${result.results.success}건\n실패: ${result.results.failed}건`);
            if (result.results.errors.length > 0) {
              console.error('Upload errors:', result.results.errors);
            }
            setShowUploadModal(false);
            setUploadFile(null);
            setUploadGroupName('');
            fetchGroups();
          } else {
            alert(result.error || '업로드에 실패했습니다.');
          }
        } catch (error) {
          console.error('Error processing file:', error);
          alert('파일 처리 중 오류가 발생했습니다.');
        } finally {
          setUploading(false);
        }
      };

      reader.readAsBinaryString(uploadFile);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
      setUploading(false);
    }
  };

  const downloadExcelTemplate = () => {
    const template: ExcelRow[] = [
      {
        '학부모명': '홍길동',
        '전화번호': '01012345678',
        '이메일': 'parent@example.com',
        '관계': 'father',
        '학생코드': 'STU001',
        '메모': '비고 사항'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '학부모 양식');
    XLSX.writeFile(wb, '학부모_업로드_양식.xlsx');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">수신자 그룹 관리</h1>
            <p className="text-sm text-gray-600">학부모를 그룹으로 관리하고 일괄 발송하세요</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Upload className="w-4 h-4" />
            엑셀 업로드
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            그룹 생성
          </button>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">{group.name}</h3>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => router.push(`/dashboard/admin/recipient-groups/${group.id}`)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Edit className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="p-1 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              {group.description || '설명 없음'}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">멤버</span>
              <span className="text-sm font-semibold text-blue-600">
                {group.memberCount}명
              </span>
            </div>
          </div>
        ))}

        {groups.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">등록된 그룹이 없습니다.</p>
            <p className="text-sm text-gray-500 mt-1">새 그룹을 생성하거나 엑셀로 일괄 등록하세요.</p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">새 그룹 생성</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  그룹 이름 *
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 1학년 학부모"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="그룹에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleCreateGroup}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Excel Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">엑셀 업로드</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  그룹 이름 (선택)
                </label>
                <input
                  type="text"
                  value={uploadGroupName}
                  onChange={(e) => setUploadGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="업로드한 학부모들을 그룹으로 묶으려면 입력"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  엑셀 파일
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900 font-medium mb-2">업로드 양식</p>
                <p className="text-xs text-blue-700 mb-2">
                  필수: 학부모명, 전화번호<br />
                  선택: 이메일, 관계, 학생코드, 메모
                </p>
                <button
                  onClick={downloadExcelTemplate}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Download className="w-3 h-3" />
                  양식 다운로드
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadGroupName('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={uploading}
              >
                취소
              </button>
              <button
                onClick={handleUploadExcel}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={uploading || !uploadFile}
              >
                {uploading ? '업로드 중...' : '업로드'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
