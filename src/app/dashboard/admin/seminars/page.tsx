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
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SeminarsAdminPage() {
  const [seminars, setSeminars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isApplicationsDialogOpen, setIsApplicationsDialogOpen] = useState(false);
  const [selectedSeminar, setSelectedSeminar] = useState(null);
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

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
    useCustomForm: 0
  });

  useEffect(() => {
    loadSeminars();
  }, []);

  const loadSeminars = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
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

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/seminars', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', '세미나가 생성되었습니다');
        setIsCreateDialogOpen(false);
        resetForm();
        loadSeminars();
      } else {
        showMessage('error', data.message || '세미나 생성에 실패했습니다');
      }
    } catch (error) {
      console.error('Error creating seminar:', error);
      showMessage('error', '세미나 생성에 실패했습니다');
    }
  };

  const handleUpdate = async () => {
    if (!selectedSeminar) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/seminars?id=${selectedSeminar.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', '세미나가 수정되었습니다');
        setIsEditDialogOpen(false);
        resetForm();
        loadSeminars();
      } else {
        showMessage('error', data.message || '세미나 수정에 실패했습니다');
      }
    } catch (error) {
      console.error('Error updating seminar:', error);
      showMessage('error', '세미나 수정에 실패했습니다');
    }
  };

  const handleDelete = async (seminarId) => {
    if (!confirm('정말 이 세미나를 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
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
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/seminars/apply?seminarId=${seminarId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setApplications(data.applications || []);
        setIsApplicationsDialogOpen(true);
      } else {
        showMessage('error', '신청자 목록을 불러오는데 실패했습니다');
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      showMessage('error', '신청자 목록을 불러오는데 실패했습니다');
    }
  };

  const handleExportExcel = async (seminarId, seminarTitle) => {
    try {
      const token = localStorage.getItem('token');
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
      useCustomForm: seminar.useCustomForm || 0
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
      useCustomForm: 0
    });
    setSelectedSeminar(null);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const stats = {
    total: seminars.length,
    active: seminars.filter(s => s.status === 'active').length,
    participants: seminars.reduce((sum, s) => sum + (s.currentParticipants || 0), 0),
    upcoming: seminars.filter(s => new Date(s.date) > new Date()).length
  };

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
                  <div className="flex items-start justify-between">
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
              <Label htmlFor="mainImage">메인 이미지 URL</Label>
              <Input
                id="mainImage"
                value={formData.mainImage}
                onChange={(e) => handleChange('mainImage', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
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
                variant="outline" 
                onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}
              >
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
              <Button onClick={handleCreate}>
                <Save className="w-4 h-4 mr-2" />
                등록
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
              <Label htmlFor="edit-mainImage">메인 이미지 URL</Label>
              <Input
                id="edit-mainImage"
                value={formData.mainImage}
                onChange={(e) => handleChange('mainImage', e.target.value)}
              />
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
              <Button onClick={handleUpdate}>
                <Save className="w-4 h-4 mr-2" />
                저장
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
    </div>
  );
}
