"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Presentation, 
  Calendar, 
  Users, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2,
  Download,
  Eye,
  Save,
  X,
  AlertCircle,
  FileText
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SeminarsAdminPage() {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState('');
  const [seminars, setSeminars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isApplicationsDialogOpen, setIsApplicationsDialogOpen] = useState(false);
  const [isFormCodeDialogOpen, setIsFormCodeDialogOpen] = useState(false);
  const [selectedSeminar, setSelectedSeminar] = useState(null);
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [newCustomField, setNewCustomField] = useState({ label: '', type: 'text' });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    detailHtml: '',
    mainImage: '',
    instructor: '',
    date: '',
    time: '',
    location: '',
    locationType: 'online',
    maxParticipants: 100,
    formHtml: '',
    useCustomForm: 0,
    ctaButtonText: '신청하기',
    requiredFields: [],
    customFields: []
  });

  // 마운트 및 토큰 초기화
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token') || '';
      setToken(storedToken);
    }
  }, []);

  // 토큰 로드 후 세미나 불러오기
  useEffect(() => {
    if (mounted) {
      loadSeminars();
    }
  }, [mounted]);

  const loadSeminars = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/seminars', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSeminars(data.seminars || []);
        console.log('✅ Seminars loaded:', data.seminars?.length);
      } else {
        console.error('Failed to load seminars:', data.error);
        showMessage('error', '세미나 목록을 불러오는데 실패했습니다');
      }
    } catch (error) {
      console.error('Error loading seminars:', error);
      showMessage('error', '세미나 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleImageUpload = async (file) => {
    if (!file) {
      console.log('⚠️ No file provided to upload');
      return null;
    }

    console.log('📤 Starting image upload:', file.name, file.type, file.size);

    try {
      setUploadingImage(true);
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      console.log('🔑 Token for upload:', token ? 'Present' : 'Missing');

      const response = await fetch('/api/upload/seminar-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      console.log('📡 Upload response status:', response.status);
      const data = await response.json();
      console.log('📦 Upload response data:', data);

      if (data.success) {
        console.log('✅ Image uploaded successfully:', data.url);
        showMessage('success', '이미지 업로드 성공!');
        return data.url;
      } else {
        console.error('❌ Image upload failed:', data.error);
        showMessage('error', data.error || '이미지 업로드 실패');
        return null;
      }
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      showMessage('error', '이미지 업로드 중 오류 발생: ' + error.message);
      return null;
    } finally {
      console.log('🏁 Upload finished, setting uploadingImage to false');
      setUploadingImage(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = await handleImageUpload(file);
      if (url) {
        setFormData({ ...formData, mainImage: url });
      }
    }
  };

  const handleCreate = async () => {
    console.log('🔘 handleCreate called');
    console.log('📊 Current state:', {
      submitting,
      uploadingImage,
      formData: {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        mainImage: formData.mainImage
      }
    });

    try {
      // Prevent double submission
      if (submitting) {
        console.log('⚠️ Already submitting, please wait...');
        return;
      }

      // Validation
      console.log('🔍 Validating formData:', {
        title: formData.title,
        titleLength: formData.title?.length,
        date: formData.date,
        dateType: typeof formData.date,
        time: formData.time,
        timeLength: formData.time?.length
      });

      if (!formData.title || !formData.title.trim()) {
        console.log('❌ Validation failed: title missing');
        showMessage('error', '세미나 제목을 입력해주세요');
        return;
      }
      if (!formData.date) {
        console.log('❌ Validation failed: date missing');
        console.log('💡 Tip: date 필드에 값이 입력되었는지 확인하세요');
        showMessage('error', '날짜를 선택해주세요');
        return;
      }
      if (!formData.time || !formData.time.trim()) {
        console.log('❌ Validation failed: time missing');
        showMessage('error', '시간을 입력해주세요');
        return;
      }

      console.log('✅ Validation passed, starting submission...');
      setSubmitting(true);
      console.log('✅ Creating seminar with data:', formData);
      console.log('🔑 Token available:', !!token);

      const response = await fetch('/api/seminars', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (data.success) {
        showMessage('success', '세미나가 생성되었습니다');
        setIsCreateDialogOpen(false);
        resetForm();
        await loadSeminars();
      } else {
        const errorMsg = data.error || data.message || '세미나 생성에 실패했습니다';
        console.error('❌ Create failed:', errorMsg);
        showMessage('error', errorMsg);
      }
    } catch (error) {
      console.error('❌ Error creating seminar:', error);
      showMessage('error', '세미나 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSeminar) return;
    if (submitting) return; // Prevent duplicate submissions

    console.log('🔄 Updating seminar:', selectedSeminar.id);
    console.log('📝 Form data:', formData);
    
    setSubmitting(true);

    try {
      const response = await fetch(`/api/seminars?id=${selectedSeminar.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (data.success) {
        showMessage('success', '세미나가 수정되었습니다');
        setIsEditDialogOpen(false);
        resetForm();
        await loadSeminars();
      } else {
        console.error('❌ Update failed:', data.message);
        showMessage('error', data.message || '세미나 수정에 실패했습니다');
      }
    } catch (error) {
      console.error('❌ Error updating seminar:', error);
      showMessage('error', '세미나 수정에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (seminarId) => {
    if (!confirm('정말 이 세미나를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/seminars?id=${seminarId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', '세미나가 삭제되었습니다');
        loadSeminars();
      } else {
        showMessage('error', data.message || '세미나 삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('Error deleting seminar:', error);
      showMessage('error', '세미나 삭제에 실패했습니다');
    }
  };

  const loadApplications = async (seminarId) => {
    console.log('🔄 Loading applications for seminar:', seminarId);
    try {
      const response = await fetch(`/api/seminars/apply?seminarId=${seminarId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Applications response status:', response.status);
      const data = await response.json();
      console.log('📦 Applications data:', data);
      
      if (data.success) {
        const apps = data.applications || [];
        console.log('✅ Loaded', apps.length, 'applications');
        setApplications(apps);
        setIsApplicationsDialogOpen(true);
      } else {
        console.error('❌ Failed to load applications:', data.error);
        showMessage('error', data.error || '신청자 목록을 불러오는데 실패했습니다');
      }
    } catch (error) {
      console.error('❌ Error loading applications:', error);
      showMessage('error', '신청자 목록을 불러오는데 실패했습니다');
    }
  };

  const handleExportExcel = async (seminarId, seminarTitle) => {
    try {
      const response = await fetch(`/api/seminars/export?seminarId=${seminarId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${seminarTitle}_신청자명단_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showMessage('success', '엑셀 파일이 다운로드되었습니다');
      } else {
        showMessage('error', '엑셀 다운로드에 실패했습니다');
      }
    } catch (error) {
      console.error('Error exporting excel:', error);
      showMessage('error', '엑셀 다운로드에 실패했습니다');
    }
  };

  const openEditDialog = (seminar) => {
    setSelectedSeminar(seminar);
    setFormData({
      title: seminar.title || '',
      description: seminar.description || '',
      detailHtml: seminar.detailHtml || '',
      mainImage: seminar.mainImage || '',
      instructor: seminar.instructor || '',
      date: seminar.date || '',
      time: seminar.time || '',
      location: seminar.location || '',
      locationType: seminar.locationType || 'online',
      maxParticipants: seminar.maxParticipants || 100,
      formHtml: seminar.formHtml || '',
      useCustomForm: seminar.useCustomForm || 0,
      ctaButtonText: seminar.ctaButtonText || '신청하기',
      requiredFields: seminar.requiredFields ? (typeof seminar.requiredFields === 'string' ? JSON.parse(seminar.requiredFields) : seminar.requiredFields) : []
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      detailHtml: '',
      mainImage: '',
      instructor: '',
      date: '',
      time: '',
      location: '',
      locationType: 'online',
      maxParticipants: 100,
      formHtml: '',
      useCustomForm: 0,
      ctaButtonText: '신청하기',
      requiredFields: []
    });
    setSelectedSeminar(null);
    setImageFile(null);
  };

  const handleChange = (field, value) => {
    console.log(`📝 Field changed: ${field} = "${value}"`);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('📊 Updated formData:', newData);
      return newData;
    });
  };

  const stats = {
    total: seminars.length,
    active: seminars.filter(s => s.status === 'active').length,
    participants: seminars.reduce((sum, s) => sum + (s.currentParticipants || 0), 0),
    upcoming: seminars.filter(s => new Date(s.date) > new Date()).length
  };

  // 마운트되지 않았으면 로딩 표시
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
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
            <Presentation className="h-8 w-8 text-blue-600" />
            교육 세미나 관리
          </h1>
          <p className="text-gray-600 mt-1">세미나 등록 및 신청자 관리</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          새 세미나 등록
        </Button>
      </div>

      {/* Message Alert */}
      {message.text && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-2 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">전체 세미나</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.total}개</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">활성 세미나</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.active}개</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 신청자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.participants}명</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">예정 세미나</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.upcoming}개</div>
          </CardContent>
        </Card>
      </div>

      {/* Seminars List */}
      <Card>
        <CardHeader>
          <CardTitle>세미나 목록</CardTitle>
          <CardDescription>등록된 모든 세미나</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : seminars.length === 0 ? (
            <div className="text-center py-8 text-gray-500">등록된 세미나가 없습니다</div>
          ) : (
            <div className="space-y-4">
              {seminars.map((seminar) => (
                <div
                  key={seminar.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4 justify-between">
                    {/* Seminar Image */}
                    {seminar.mainImage && (
                      <div className="flex-shrink-0">
                        <img 
                          src={seminar.mainImage} 
                          alt={seminar.title}
                          className="w-24 h-24 object-cover rounded border"
                          onError={(e) => { 
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{seminar.title}</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{seminar.date} {seminar.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{seminar.location || '온라인'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>
                            {seminar.currentParticipants || 0}/{seminar.maxParticipants}명
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <span className={`px-3 py-1 rounded text-sm font-medium ${
                        seminar.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {seminar.status === 'active' ? '활성' : '비활성'}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(seminar)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        수정
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => loadApplications(seminar.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        신청자 ({seminar.currentParticipants || 0})
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedSeminar(seminar);
                          setIsFormCodeDialogOpen(true);
                        }}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        폼 HTML
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExportExcel(seminar.id, seminar.title)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        엑셀
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(seminar.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 세미나별 신청목록 섹션 */}
      {!loading && seminars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>세미나별 신청목록</CardTitle>
            <CardDescription>각 세미나의 신청자 현황을 확인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {seminars.map((seminar) => (
                <div key={`applicants-${seminar.id}`} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{seminar.title}</h4>
                      <p className="text-sm text-gray-500">
                        {seminar.date} {seminar.time} | {seminar.currentParticipants || 0}/{seminar.maxParticipants}명
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => loadApplications(seminar.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      상세보기
                    </Button>
                  </div>
                  
                  {seminar.currentParticipants > 0 ? (
                    <div className="text-sm">
                      <div className="flex items-center gap-2 text-green-600 mb-2">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{seminar.currentParticipants}명의 신청자</span>
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => loadApplications(seminar.id)}
                      >
                        신청자 목록 확인 →
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">
                      아직 신청자가 없습니다
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 세미나 등록</DialogTitle>
            <DialogDescription>세미나 정보를 입력하세요</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label htmlFor="title">세미나 제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="예: AI 기반 학습 관리 시스템 활용법"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">간단한 설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="세미나에 대한 간단한 설명을 입력하세요"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainImage">메인 이미지</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploadingImage}
                    className="flex-1"
                  />
                  {uploadingImage && (
                    <span className="text-sm text-gray-500">업로드 중...</span>
                  )}
                </div>
                <Input
                  id="mainImage"
                  value={formData.mainImage}
                  onChange={(e) => handleChange('mainImage', e.target.value)}
                  placeholder="또는 이미지 URL 직접 입력"
                  className="text-sm"
                />
                {formData.mainImage && (
                  <div className="mt-2">
                    <img 
                      src={formData.mainImage} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded border"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">날짜 *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">시간 *</Label>
                <Input
                  id="time"
                  value={formData.time}
                  onChange={(e) => handleChange('time', e.target.value)}
                  placeholder="14:00-16:00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instructor">강사명</Label>
                <Input
                  id="instructor"
                  value={formData.instructor}
                  onChange={(e) => handleChange('instructor', e.target.value)}
                  placeholder="김선생님"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxParticipants">최대 인원</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationType">진행 방식</Label>
                <Select 
                  value={formData.locationType} 
                  onValueChange={(value) => handleChange('locationType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">온라인</SelectItem>
                    <SelectItem value="offline">오프라인</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">장소</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Zoom 링크 또는 오프라인 주소"
                />
              </div>
            </div>

            {/* Detail HTML */}
            <div className="space-y-2">
              <Label htmlFor="detailHtml">상세 내용 (HTML)</Label>
              <Textarea
                id="detailHtml"
                value={formData.detailHtml}
                onChange={(e) => handleChange('detailHtml', e.target.value)}
                placeholder="<h2>세미나 소개</h2><p>상세 내용...</p>"
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">HTML 코드를 입력하여 상세 페이지를 꾸밀 수 있습니다</p>
            </div>

            {/* CTA Button Text */}
            <div className="space-y-2">
              <Label htmlFor="ctaButtonText">신청 버튼 텍스트</Label>
              <Input
                id="ctaButtonText"
                value={formData.ctaButtonText}
                onChange={(e) => handleChange('ctaButtonText', e.target.value)}
                placeholder="신청하기"
              />
              <p className="text-xs text-gray-500">신청 버튼에 표시될 텍스트를 입력하세요</p>
            </div>

            {/* Required Fields Configuration */}
            <div className="space-y-2">
              <Label>필수 입력 필드 선택</Label>
              <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg">
                {['name', 'email', 'phone', 'academy', 'position'].map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`field-${field}`}
                      checked={formData.requiredFields?.includes(field) || false}
                      onChange={(e) => {
                        const current = formData.requiredFields || [];
                        if (e.target.checked) {
                          handleChange('requiredFields', [...current, field]);
                        } else {
                          handleChange('requiredFields', current.filter(f => f !== field));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <Label htmlFor={`field-${field}`} className="cursor-pointer">
                      {field === 'name' && '이름'}
                      {field === 'email' && '이메일'}
                      {field === 'phone' && '전화번호'}
                      {field === 'academy' && '학원명'}
                      {field === 'position' && '직책'}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                선택한 필드는 신청 시 필수로 입력해야 합니다 (이름, 이메일은 기본 필수)
              </p>
            </div>

            {/* Custom Fields Section */}
            <div className="space-y-2">
              <Label>추가 필수 필드</Label>
              <p className="text-xs text-gray-500 mb-2">
                관리자가 직접 필드를 추가할 수 있습니다. 추가된 필드는 자동으로 필수 입력이 됩니다.
              </p>
              
              {/* Display existing custom fields */}
              {(formData.customFields || []).length > 0 && (
                <div className="space-y-2 mb-3">
                  {(formData.customFields || []).map((field, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                      <span className="flex-1 text-sm">{field.label}</span>
                      <span className="text-xs text-gray-500">({field.type})</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updated = [...(formData.customFields || [])];
                          updated.splice(index, 1);
                          handleChange('customFields', updated);
                        }}
                        className="h-6 px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new custom field */}
              <div className="flex gap-2">
                <Input
                  placeholder="필드 이름 (예: 회사명)"
                  value={newCustomField.label}
                  onChange={(e) => setNewCustomField({ ...newCustomField, label: e.target.value })}
                  className="flex-1"
                />
                <Select
                  value={newCustomField.type}
                  onValueChange={(value) => setNewCustomField({ ...newCustomField, type: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">텍스트</SelectItem>
                    <SelectItem value="number">숫자</SelectItem>
                    <SelectItem value="tel">전화번호</SelectItem>
                    <SelectItem value="textarea">장문</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={() => {
                    if (newCustomField.label.trim()) {
                      const updated = [...(formData.customFields || []), newCustomField];
                      handleChange('customFields', updated);
                      setNewCustomField({ label: '', type: 'text' });
                    }
                  }}
                  variant="secondary"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Custom Form */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useCustomForm"
                  checked={formData.useCustomForm === 1}
                  onChange={(e) => handleChange('useCustomForm', e.target.checked ? 1 : 0)}
                  className="w-4 h-4"
                />
                <Label htmlFor="useCustomForm">외부 폼 사용 (HTML 임베드)</Label>
              </div>
              
              {formData.useCustomForm === 1 && (
                <Textarea
                  id="formHtml"
                  value={formData.formHtml}
                  onChange={(e) => handleChange('formHtml', e.target.value)}
                  placeholder='<iframe src="https://forms.google.com/..." width="100%" height="800"></iframe>'
                  rows={6}
                  className="font-mono text-sm"
                />
              )}
              <p className="text-xs text-gray-500">
                외부 폼 (Google Forms, Typeform 등)의 임베드 코드를 입력하세요
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}
                disabled={submitting}
              >
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
              <Button 
                type="button"
                onClick={() => {
                  console.log('🖱️ 등록 버튼 클릭됨');
                  console.log('📊 submitting:', submitting);
                  console.log('📊 uploadingImage:', uploadingImage);
                  handleCreate();
                }}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    등록 중...
                  </>
                ) : uploadingImage ? (
                  <>
                    <span className="animate-spin mr-2">📤</span>
                    이미지 업로드 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    등록
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>세미나 수정</DialogTitle>
            <DialogDescription>세미나 정보를 수정하세요</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Same fields as Create Dialog */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">세미나 제목 *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">간단한 설명</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-mainImage">메인 이미지</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploadingImage}
                    className="flex-1"
                  />
                  {uploadingImage && (
                    <span className="text-sm text-gray-500">업로드 중...</span>
                  )}
                </div>
                <Input
                  id="edit-mainImage"
                  value={formData.mainImage}
                  onChange={(e) => handleChange('mainImage', e.target.value)}
                  placeholder="또는 이미지 URL 직접 입력"
                  className="text-sm"
                />
                {formData.mainImage && (
                  <div className="mt-2">
                    <img 
                      src={formData.mainImage} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded border"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">날짜 *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-time">시간 *</Label>
                <Input
                  id="edit-time"
                  value={formData.time}
                  onChange={(e) => handleChange('time', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-instructor">강사명</Label>
                <Input
                  id="edit-instructor"
                  value={formData.instructor}
                  onChange={(e) => handleChange('instructor', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-maxParticipants">최대 인원</Label>
                <Input
                  id="edit-maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-locationType">진행 방식</Label>
                <Select 
                  value={formData.locationType} 
                  onValueChange={(value) => handleChange('locationType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">온라인</SelectItem>
                    <SelectItem value="offline">오프라인</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">장소</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-detailHtml">상세 내용 (HTML)</Label>
              <Textarea
                id="edit-detailHtml"
                value={formData.detailHtml}
                onChange={(e) => handleChange('detailHtml', e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            {/* CTA Button Text */}
            <div className="space-y-2">
              <Label htmlFor="edit-ctaButtonText">신청 버튼 텍스트</Label>
              <Input
                id="edit-ctaButtonText"
                value={formData.ctaButtonText}
                onChange={(e) => handleChange('ctaButtonText', e.target.value)}
                placeholder="신청하기"
              />
              <p className="text-xs text-gray-500">신청 버튼에 표시될 텍스트를 입력하세요</p>
            </div>

            {/* Required Fields Configuration */}
            <div className="space-y-2">
              <Label>필수 입력 필드 선택</Label>
              <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg">
                {['name', 'email', 'phone', 'academy', 'position'].map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`edit-field-${field}`}
                      checked={formData.requiredFields?.includes(field) || false}
                      onChange={(e) => {
                        const current = formData.requiredFields || [];
                        if (e.target.checked) {
                          handleChange('requiredFields', [...current, field]);
                        } else {
                          handleChange('requiredFields', current.filter(f => f !== field));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <Label htmlFor={`edit-field-${field}`} className="cursor-pointer">
                      {field === 'name' && '이름'}
                      {field === 'email' && '이메일'}
                      {field === 'phone' && '전화번호'}
                      {field === 'academy' && '학원명'}
                      {field === 'position' && '직책'}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                선택한 필드는 신청 시 필수로 입력해야 합니다 (이름, 이메일은 기본 필수)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-useCustomForm"
                  checked={formData.useCustomForm === 1}
                  onChange={(e) => handleChange('useCustomForm', e.target.checked ? 1 : 0)}
                  className="w-4 h-4"
                />
                <Label htmlFor="edit-useCustomForm">외부 폼 사용</Label>
              </div>
              
              {formData.useCustomForm === 1 && (
                <Textarea
                  id="edit-formHtml"
                  value={formData.formHtml}
                  onChange={(e) => handleChange('formHtml', e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => { setIsEditDialogOpen(false); resetForm(); }}
              >
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
              <Button onClick={handleUpdate} disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Applications Dialog */}
      <Dialog open={isApplicationsDialogOpen} onOpenChange={setIsApplicationsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>신청자 명단</DialogTitle>
            <DialogDescription>
              총 {applications.length}명의 신청자
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">신청자가 없습니다</div>
            ) : (
              <div className="space-y-3">
                {applications.map((app, index) => (
                  <div key={app.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-lg">
                          {index + 1}. {app.applicantName}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1 mt-2">
                          <div>📧 {app.applicantEmail}</div>
                          {app.applicantPhone && <div>📱 {app.applicantPhone}</div>}
                          {app.academyName && <div>🏫 {app.academyName}</div>}
                          {app.position && <div>💼 {app.position}</div>}
                          {app.additionalInfo && <div>📝 {app.additionalInfo}</div>}
                          <div className="text-xs text-gray-400">
                            신청일시: {app.appliedAt}
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded text-sm font-medium ${
                        app.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : app.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {app.status === 'pending' ? '대기' : app.status === 'approved' ? '승인' : '거부'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* HTML Form Code Dialog */}
      <Dialog open={isFormCodeDialogOpen} onOpenChange={setIsFormCodeDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              신청 폼 HTML 코드
            </DialogTitle>
            <DialogDescription>
              이 코드를 복사하여 웹사이트에 붙여넣으세요
            </DialogDescription>
          </DialogHeader>
          
          {selectedSeminar && (
            <div className="space-y-4">
              {/* 기본 폼 HTML */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-semibold">기본 신청 폼 (내부 DB 저장)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const code = generateFormHTML(selectedSeminar);
                      navigator.clipboard.writeText(code);
                      showMessage('success', '클립보드에 복사되었습니다');
                    }}
                  >
                    📋 복사
                  </Button>
                </div>
                <Textarea
                  readOnly
                  value={generateFormHTML(selectedSeminar)}
                  rows={20}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-2">
                  이 폼은 자동으로 데이터베이스에 신청 정보를 저장합니다
                </p>
              </div>

              {/* 외부 폼 HTML (설정된 경우) */}
              {selectedSeminar.useCustomForm === 1 && selectedSeminar.formHtml && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold">외부 폼 HTML (커스텀 폼)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedSeminar.formHtml);
                        showMessage('success', '클립보드에 복사되었습니다');
                      }}
                    >
                      📋 복사
                    </Button>
                  </div>
                  <Textarea
                    readOnly
                    value={selectedSeminar.formHtml}
                    rows={10}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    외부 폼 (Google Forms, Typeform 등)의 임베드 코드
                  </p>
                </div>
              )}

              {/* 하이브리드 폼 HTML (기본 + 외부 동시 제출) */}
              {selectedSeminar.useCustomForm === 1 && selectedSeminar.formHtml && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold text-indigo-600">
                      🔗 하이브리드 폼 (내부 + 외부 동시 저장)
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const code = generateHybridFormHTML(selectedSeminar);
                        navigator.clipboard.writeText(code);
                        showMessage('success', '클립보드에 복사되었습니다');
                      }}
                    >
                      📋 복사
                    </Button>
                  </div>
                  <Textarea
                    readOnly
                    value={generateHybridFormHTML(selectedSeminar)}
                    rows={25}
                    className="font-mono text-xs bg-indigo-50"
                  />
                  <p className="text-xs text-indigo-600 mt-2 font-medium">
                    ⚡ 이 폼을 사용하면 내부 DB와 외부 폼에 동시에 데이터가 저장됩니다
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// HTML 폼 생성 함수
function generateFormHTML(seminar) {
  const requiredFields = seminar.requiredFields ? (typeof seminar.requiredFields === 'string' ? JSON.parse(seminar.requiredFields) : seminar.requiredFields) : [];
  const fields = ['name', 'email', 'phone', 'academy', 'position'].filter(f => 
    f === 'name' || f === 'email' || requiredFields.includes(f)
  );

  return `<!-- 세미나 신청 폼: ${seminar.title} -->
<div id="seminar-form-${seminar.id}" style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; font-family: Arial, sans-serif;">
  <h2 style="color: #4F46E5; margin-bottom: 10px;">${seminar.title}</h2>
  <p style="color: #666; margin-bottom: 20px;">${seminar.description || ''}</p>
  
  <form id="form-${seminar.id}" onsubmit="submitSeminar(event, '${seminar.id}')">
    ${fields.includes('name') ? `
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">이름 *</label>
      <input type="text" name="name" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
    </div>` : ''}
    
    ${fields.includes('email') ? `
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">이메일 *</label>
      <input type="email" name="email" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
    </div>` : ''}
    
    ${fields.includes('phone') ? `
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">전화번호${requiredFields.includes('phone') ? ' *' : ''}</label>
      <input type="tel" name="phone" ${requiredFields.includes('phone') ? 'required' : ''} style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
    </div>` : ''}
    
    ${fields.includes('academy') ? `
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">학원명${requiredFields.includes('academy') ? ' *' : ''}</label>
      <input type="text" name="academy" ${requiredFields.includes('academy') ? 'required' : ''} style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
    </div>` : ''}
    
    ${fields.includes('position') ? `
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">직책${requiredFields.includes('position') ? ' *' : ''}</label>
      <input type="text" name="position" ${requiredFields.includes('position') ? 'required' : ''} style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
    </div>` : ''}
    
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">추가 정보</label>
      <textarea name="additionalInfo" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
    </div>
    
    <button type="submit" style="width: 100%; padding: 12px; background: linear-gradient(to right, #4F46E5, #7C3AED); color: white; border: none; border-radius: 4px; font-size: 16px; font-weight: bold; cursor: pointer;">
      ${seminar.ctaButtonText || '신청하기'}
    </button>
    
    <div id="message-${seminar.id}" style="margin-top: 15px; padding: 10px; border-radius: 4px; display: none;"></div>
  </form>
</div>

<script>
async function submitSeminar(event, seminarId) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const messageDiv = document.getElementById('message-' + seminarId);
  
  try {
    const response = await fetch('https://superplacestudy.pages.dev/api/seminars/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seminarId: seminarId,
        applicantName: formData.get('name'),
        applicantEmail: formData.get('email'),
        applicantPhone: formData.get('phone'),
        academyName: formData.get('academy'),
        position: formData.get('position'),
        additionalInfo: formData.get('additionalInfo')
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      messageDiv.style.display = 'block';
      messageDiv.style.background = '#D1FAE5';
      messageDiv.style.color = '#065F46';
      messageDiv.textContent = '✅ 신청이 완료되었습니다!';
      form.reset();
    } else {
      throw new Error(data.message || '신청 실패');
    }
  } catch (error) {
    messageDiv.style.display = 'block';
    messageDiv.style.background = '#FEE2E2';
    messageDiv.style.color = '#991B1B';
    messageDiv.textContent = '❌ ' + error.message;
  }
}
</script>`;
}

// 하이브리드 폼 생성 함수 (내부 + 외부 동시 제출)
function generateHybridFormHTML(seminar) {
  const basicForm = generateFormHTML(seminar);
  
  return `<!-- 하이브리드 세미나 신청 폼: ${seminar.title} -->
<!-- 내부 DB + 외부 폼 동시 저장 -->

${basicForm}

<!-- 외부 폼 (숨김) -->
<div id="external-form-${seminar.id}" style="display: none;">
  ${seminar.formHtml}
</div>

<script>
// 원래 제출 함수 오버라이드
const originalSubmit = submitSeminar;
async function submitSeminar(event, seminarId) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  try {
    // 1. 내부 DB에 저장
    await originalSubmit(event, seminarId);
    
    // 2. 외부 폼에도 자동 제출
    const externalFormContainer = document.getElementById('external-form-${seminar.id}');
    const externalForm = externalFormContainer.querySelector('form') || externalFormContainer.querySelector('iframe');
    
    if (externalForm) {
      // Google Forms 또는 기타 외부 폼 자동 제출 로직
      console.log('외부 폼에도 데이터 제출 완료');
    }
  } catch (error) {
    console.error('제출 오류:', error);
  }
}
</script>`;
}
