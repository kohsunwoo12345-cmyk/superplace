"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Download,
  Eye,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface SenderNumberRequest {
  id: string;
  companyName: string;
  businessNumber: string;
  address: string;
  senderNumbers: string;
  representativeName: string;
  phone: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  fileUrls: {
    telecomCertificate?: string;
    businessRegistration?: string;
    serviceAgreement?: string;
    privacyAgreement?: string;
  };
  createdAt: string;
  userId: string;
  userName: string;
}

export default function SenderNumberApprovalPage() {
  const [requests, setRequests] = useState<SenderNumberRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('🔑 Token:', token);
      
      const response = await fetch('/api/admin/sender-number-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📊 Response data:', data);

      if (response.ok && data.success) {
        console.log('✅ Requests loaded:', data.requests?.length || 0);
        
        // 각 신청의 파일 URL 상세 로그
        data.requests?.forEach((req: any, idx: number) => {
          console.log(`📄 Request #${idx + 1}:`, {
            id: req.id,
            companyName: req.companyName,
            fileUrls: req.fileUrls,
            telecomCertificate: req.fileUrls?.telecomCertificate,
            businessRegistration: req.fileUrls?.businessRegistration,
            serviceAgreement: req.fileUrls?.serviceAgreement,
            privacyAgreement: req.fileUrls?.privacyAgreement
          });
        });
        
        setRequests(data.requests || []);
      } else {
        console.error('❌ API Error:', data.error);
        alert(`데이터 조회 실패: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('❌ 발신번호 신청 목록 조회 실패:', error);
      alert('발신번호 신청 목록 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm('이 발신번호 등록 신청을 승인하시겠습니까?')) return;

    try {
      setProcessing(requestId);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/sender-number-requests/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();

      if (data.success) {
        alert('승인되었습니다.');
        fetchRequests();
      } else {
        alert(`승인 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('승인 처리 오류:', error);
      alert('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt('반려 사유를 입력해주세요:');
    if (!reason) return;

    try {
      setProcessing(requestId);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/sender-number-requests/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, reason }),
      });

      const data = await response.json();

      if (data.success) {
        alert('반려되었습니다.');
        fetchRequests();
      } else {
        alert(`반려 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('반려 처리 오류:', error);
      alert('반려 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  const downloadFile = (url: string, filename: string) => {
    console.log('📥 다운로드 시도:', { url, filename });
    
    if (!url) {
      console.error('❌ 파일 URL이 없습니다');
      alert('파일 URL이 없습니다.');
      return;
    }
    
    if (url.startsWith('data:')) {
      // Base64 데이터를 다운로드
      console.log('📦 Base64 데이터 다운로드');
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // R2 URL을 다운로드
      console.log('🔗 R2 URL 다운로드:', url);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50"><Clock className="h-3 w-3 mr-1" />대기중</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50"><CheckCircle className="h-3 w-3 mr-1" />승인됨</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50"><XCircle className="h-3 w-3 mr-1" />반려됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">📱 발신번호 등록 승인 관리</h1>
          <p className="text-sm text-gray-600 mt-1">
            학원장들의 발신번호 등록 신청을 검토하고 승인합니다.
          </p>
        </div>
        <Button onClick={fetchRequests} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">대기중</p>
              <p className="text-3xl font-bold text-yellow-600">
                {requests.filter(r => r.status === 'PENDING').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">승인됨</p>
              <p className="text-3xl font-bold text-green-600">
                {requests.filter(r => r.status === 'APPROVED').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">반려됨</p>
              <p className="text-3xl font-bold text-red-600">
                {requests.filter(r => r.status === 'REJECTED').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 신청 목록 */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Alert>
            <AlertDescription>
              등록된 발신번호 신청이 없습니다.
            </AlertDescription>
          </Alert>
        ) : (
          requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{request.companyName}</CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      신청자: {request.userName || '알 수 없음'} | 신청일: {new Date(request.createdAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* 기본 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">사업자등록번호</p>
                      <p className="font-semibold">{request.businessNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">발신번호</p>
                      <p className="font-semibold">{request.senderNumbers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">대표자명</p>
                      <p className="font-semibold">{request.representativeName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">연락처</p>
                      <p className="font-semibold">{request.phone || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500">주소</p>
                      <p className="font-semibold">{request.address || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500">이메일</p>
                      <p className="font-semibold">{request.email || '-'}</p>
                    </div>
                  </div>

                  {/* 첨부 서류 */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      첨부 서류
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {request.fileUrls.telecomCertificate && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="justify-start flex-1"
                            onClick={() => {
                              if (request.fileUrls.telecomCertificate.startsWith('data:')) {
                                const win = window.open();
                                if (win) {
                                  win.document.write(`<html><head><title>통신사 가입증명원</title></head><body><img src="${request.fileUrls.telecomCertificate}" style="max-width:100%;"/></body></html>`);
                                }
                              } else {
                                window.open(request.fileUrls.telecomCertificate, '_blank');
                              }
                            }}
                          >
                            <Eye className="h-3 w-3 mr-2" />
                            통신사 가입증명원
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(request.fileUrls.telecomCertificate, '통신사가입증명원.pdf')}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {request.fileUrls.businessRegistration && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="justify-start flex-1"
                            onClick={() => {
                              if (request.fileUrls.businessRegistration.startsWith('data:')) {
                                const win = window.open();
                                if (win) {
                                  win.document.write(`<html><head><title>사업자등록증</title></head><body><img src="${request.fileUrls.businessRegistration}" style="max-width:100%;"/></body></html>`);
                                }
                              } else {
                                window.open(request.fileUrls.businessRegistration, '_blank');
                              }
                            }}
                          >
                            <Eye className="h-3 w-3 mr-2" />
                            사업자등록증
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(request.fileUrls.businessRegistration, '사업자등록증.pdf')}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {request.fileUrls.serviceAgreement && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="justify-start flex-1"
                            onClick={() => {
                              if (request.fileUrls.serviceAgreement.startsWith('data:')) {
                                const win = window.open();
                                if (win) {
                                  win.document.write(`<html><head><title>이용계약서</title></head><body><img src="${request.fileUrls.serviceAgreement}" style="max-width:100%;"/></body></html>`);
                                }
                              } else {
                                window.open(request.fileUrls.serviceAgreement, '_blank');
                              }
                            }}
                          >
                            <Eye className="h-3 w-3 mr-2" />
                            이용계약서
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(request.fileUrls.serviceAgreement, '이용계약서.pdf')}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {request.fileUrls.privacyAgreement && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="justify-start flex-1"
                            onClick={() => {
                              if (request.fileUrls.privacyAgreement.startsWith('data:')) {
                                const win = window.open();
                                if (win) {
                                  win.document.write(`<html><head><title>위탁계약서</title></head><body><img src="${request.fileUrls.privacyAgreement}" style="max-width:100%;"/></body></html>`);
                                }
                              } else {
                                window.open(request.fileUrls.privacyAgreement, '_blank');
                              }
                            }}
                          >
                            <Eye className="h-3 w-3 mr-2" />
                            위탁계약서
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(request.fileUrls.privacyAgreement, '위탁계약서.pdf')}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 승인/반려 버튼 */}
                  {request.status === 'PENDING' && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => handleApprove(request.id)}
                        disabled={processing === request.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {processing === request.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        승인
                      </Button>
                      <Button
                        onClick={() => handleReject(request.id)}
                        disabled={processing === request.id}
                        variant="destructive"
                        className="flex-1"
                      >
                        {processing === request.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        반려
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
