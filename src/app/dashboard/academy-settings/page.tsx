'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Users, 
  Copy, 
  Check, 
  Mail, 
  Phone, 
  MapPin,
  Edit,
  Save,
  X
} from 'lucide-react';

interface Academy {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  naverPlaceUrl: string | null;
  naverBlogUrl: string | null;
  subscriptionPlan: string;
  maxStudents: number;
  maxTeachers: number;
  aiUsageLimit: number;
  isActive: boolean;
  inviteCode?: string;
  _count?: {
    users: number;
  };
}

export default function AcademySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    naverPlaceUrl: '',
    naverBlogUrl: '',
  });

  // 권한 체크
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    if (session.user.role !== 'DIRECTOR' && session.user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // 학원 정보 로드
  useEffect(() => {
    if (session?.user?.academyId) {
      loadAcademy();
    }
  }, [session]);

  const loadAcademy = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/settings');
      if (!res.ok) throw new Error('Failed to load academy');
      const data = await res.json();
      setAcademy(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        naverPlaceUrl: data.naverPlaceUrl || '',
        naverBlogUrl: data.naverBlogUrl || '',
      });
    } catch (error) {
      console.error('Error loading academy:', error);
      alert('학원 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/academy/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to update academy');
      const updated = await res.json();
      setAcademy(updated);
      setEditing(false);
      alert('학원 정보가 수정되었습니다.');
    } catch (error) {
      console.error('Error updating academy:', error);
      alert('학원 정보 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCancel = () => {
    setFormData({
      name: academy?.name || '',
      description: academy?.description || '',
      address: academy?.address || '',
      phone: academy?.phone || '',
      email: academy?.email || '',
      naverPlaceUrl: academy?.naverPlaceUrl || '',
      naverBlogUrl: academy?.naverBlogUrl || '',
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!academy) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">학원 정보를 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">학원 설정</h1>
          <p className="text-gray-500 mt-1">학원 정보 및 초대 코드를 관리합니다</p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            정보 수정
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="outline" className="flex items-center gap-2">
              <X className="w-4 h-4" />
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        )}
      </div>

      {/* 학원 정보 카드 */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">학원 기본 정보</h2>
            <p className="text-sm text-gray-500">학원의 기본 정보를 관리합니다</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 학원 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">학원 이름</label>
            {editing ? (
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="학원 이름을 입력하세요"
              />
            ) : (
              <div className="text-gray-900 font-medium">{academy.name}</div>
            )}
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            {editing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="학원 설명을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <div className="text-gray-900">{academy.description || '설명 없음'}</div>
            )}
          </div>

          {/* 주소 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              주소
            </label>
            {editing ? (
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="학원 주소를 입력하세요"
              />
            ) : (
              <div className="text-gray-900">{academy.address || '주소 없음'}</div>
            )}
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              전화번호
            </label>
            {editing ? (
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="전화번호를 입력하세요"
              />
            ) : (
              <div className="text-gray-900">{academy.phone || '전화번호 없음'}</div>
            )}
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              이메일
            </label>
            {editing ? (
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="이메일을 입력하세요"
                type="email"
              />
            ) : (
              <div className="text-gray-900">{academy.email || '이메일 없음'}</div>
            )}
          </div>

          {/* 네이버 플레이스 URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">네이버 플레이스 URL</label>
            {editing ? (
              <Input
                value={formData.naverPlaceUrl}
                onChange={(e) => setFormData({ ...formData, naverPlaceUrl: e.target.value })}
                placeholder="https://map.naver.com/v5/entry/place/..."
                type="url"
              />
            ) : (
              <div className="text-gray-900">
                {academy.naverPlaceUrl ? (
                  <a href={academy.naverPlaceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {academy.naverPlaceUrl}
                  </a>
                ) : (
                  'URL 없음'
                )}
              </div>
            )}
          </div>

          {/* 네이버 블로그 URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">네이버 블로그 URL</label>
            {editing ? (
              <Input
                value={formData.naverBlogUrl}
                onChange={(e) => setFormData({ ...formData, naverBlogUrl: e.target.value })}
                placeholder="https://blog.naver.com/..."
                type="url"
              />
            ) : (
              <div className="text-gray-900">
                {academy.naverBlogUrl ? (
                  <a href={academy.naverBlogUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {academy.naverBlogUrl}
                  </a>
                ) : (
                  'URL 없음'
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 초대 코드 카드 */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 rounded-lg">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">초대 코드</h2>
            <p className="text-sm text-gray-500">선생님과 학생을 초대할 수 있는 코드입니다</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 학원 코드 (선생님/학생 공통) */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">학원 코드</label>
              <span className="text-xs text-gray-500">회원가입 시 입력</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-md font-mono text-lg font-bold text-blue-600">
                {academy.inviteCode || academy.id.slice(0, 8).toUpperCase()}
              </code>
              <Button
                onClick={() => handleCopyCode(academy.inviteCode || academy.id.slice(0, 8).toUpperCase())}
                variant="outline"
                className="flex items-center gap-2"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    복사
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              선생님과 학생이 회원가입 시 이 코드를 입력하면 자동으로 학원에 등록됩니다.
            </p>
          </div>

          {/* 사용 방법 안내 */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">초대 코드 사용 방법</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>위의 학원 코드를 복사합니다.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>선생님 또는 학생에게 코드를 공유합니다.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>회원가입 페이지에서 역할을 선택하고 학원 코드를 입력합니다.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">4.</span>
                <span>가입 후 학원장이 승인하면 사용할 수 있습니다.</span>
              </li>
            </ol>
          </div>
        </div>
      </Card>

      {/* 요금제 및 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 요금제 정보 */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">요금제 정보</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">현재 요금제</span>
              <span className="font-bold text-blue-600">{academy.subscriptionPlan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">최대 학생 수</span>
              <span className="font-medium">{academy.maxStudents}명</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">최대 선생님 수</span>
              <span className="font-medium">{academy.maxTeachers}명</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">AI 사용 한도</span>
              <span className="font-medium">{academy.aiUsageLimit}회/월</span>
            </div>
          </div>
        </Card>

        {/* 현재 통계 */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">현재 통계</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">등록된 사용자</span>
              <span className="font-medium">{academy._count?.users || 0}명</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">학원 상태</span>
              <span className={`font-medium ${academy.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {academy.isActive ? '활성' : '비활성'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
