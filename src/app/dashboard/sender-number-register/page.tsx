"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SenderNumberRegisterPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    businessNumber: '',
    address: '',
    senderNumbers: '',
    representativeName: '',
    phone: '',
    email: '',
  });

  const [files, setFiles] = useState({
    telecomCertificate: null as File | null,
    businessRegistration: null as File | null,
    serviceAgreement: null as File | null,
    privacyAgreement: null as File | null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    // 파일 크기 검증 제거 - R2 사용으로 크기 제한 없음
    setError('');
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const getFileLabel = (field: keyof typeof files): string => {
    const labels: Record<keyof typeof files, string> = {
      telecomCertificate: '통신사 가입증명원',
      businessRegistration: '사업자등록증',
      serviceAgreement: '이용계약서',
      privacyAgreement: '위탁계약서',
    };
    return labels[field];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 항목 확인
    if (!formData.companyName || !formData.businessNumber || !formData.senderNumbers) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (!files.telecomCertificate || !files.businessRegistration || 
        !files.serviceAgreement || !files.privacyAgreement) {
      setError('4개의 필수 서류를 모두 첨부해주세요.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const formDataToSend = new FormData();
      
      // 텍스트 데이터 추가
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // 파일 추가
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          formDataToSend.append(key, file);
        }
      });

      const token = localStorage.getItem('token');
      const response = await fetch('/api/sender-number/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setError('');
        // 폼 초기화
        setFormData({
          companyName: '',
          businessNumber: '',
          address: '',
          senderNumbers: '',
          representativeName: '',
          phone: '',
          email: '',
        });
        setFiles({
          telecomCertificate: null,
          businessRegistration: null,
          serviceAgreement: null,
          privacyAgreement: null,
        });
        alert('발신번호 등록 신청이 완료되었습니다.\n관리자 승인 후 사용 가능합니다.');
      } else {
        setError(data.error || '등록 신청 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">📱 발신번호 사전등록 신청</CardTitle>
          <CardDescription>
            문자 발송을 위한 발신번호를 등록합니다. 관리자 승인 후 사용 가능합니다.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* 안내 사항 */}
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <strong>필수 서류 안내</strong>
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>통신사 가입증명원 (통신사 홈페이지에서 발급)</li>
                <li>사업자등록증 사본</li>
                <li>솔라피 이용계약서 (아래에서 다운로드)</li>
                <li>개인정보처리 위탁계약서 (아래에서 다운로드)</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* 계약서 다운로드 */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              필수 계약서 다운로드
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open('/documents/(주)솔라피 이용계약서.docx', '_blank')}
              >
                <Download className="mr-2 h-4 w-4" />
                솔라피 이용계약서
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open('/documents/개인정보처리_위탁_계약서.docx', '_blank')}
              >
                <Download className="mr-2 h-4 w-4" />
                개인정보처리 위탁계약서
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              ※ 다운로드 후 작성하여 스캔 또는 사진으로 첨부해주세요.
            </p>
          </div>

          {/* 신청 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">📋 기본 정보</h3>
              
              <div>
                <Label htmlFor="companyName">학원명 (또는 회사명) *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="예: 슈퍼플레이스 학원"
                  required
                />
              </div>

              <div>
                <Label htmlFor="businessNumber">사업자등록번호 *</Label>
                <Input
                  id="businessNumber"
                  value={formData.businessNumber}
                  onChange={(e) => handleInputChange('businessNumber', e.target.value)}
                  placeholder="예: 123-45-67890"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">주소</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="사업장 주소"
                />
              </div>

              <div>
                <Label htmlFor="senderNumbers">등록할 발신번호 *</Label>
                <Input
                  id="senderNumbers"
                  value={formData.senderNumbers}
                  onChange={(e) => handleInputChange('senderNumbers', e.target.value)}
                  placeholder="예: 02-1234-5678, 010-1234-5678 (여러 개는 쉼표로 구분)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  ※ 여러 번호를 등록하려면 쉼표(,)로 구분해주세요.
                </p>
              </div>

              <div>
                <Label htmlFor="representativeName">대표자명</Label>
                <Input
                  id="representativeName"
                  value={formData.representativeName}
                  onChange={(e) => handleInputChange('representativeName', e.target.value)}
                  placeholder="대표자 성함"
                />
              </div>

              <div>
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="010-1234-5678"
                />
              </div>

              <div>
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@email.com"
                />
              </div>
            </div>

            {/* 서류 첨부 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">📎 필수 서류 첨부</h3>
              <Alert>
                <AlertDescription className="text-sm">
                  ℹ️ 파일 크기 제한 없이 업로드 가능합니다. PDF, JPG, PNG 형식을 지원합니다.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="telecomCertificate">
                  1. 통신사 가입증명원 *
                </Label>
                <Input
                  id="telecomCertificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('telecomCertificate', e.target.files?.[0] || null)}
                  required
                />
                {files.telecomCertificate && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {files.telecomCertificate.name} ({Math.round(files.telecomCertificate.size / 1024)}KB)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="businessRegistration">
                  2. 사업자등록증 사본 *
                </Label>
                <Input
                  id="businessRegistration"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('businessRegistration', e.target.files?.[0] || null)}
                  required
                />
                {files.businessRegistration && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {files.businessRegistration.name} ({Math.round(files.businessRegistration.size / 1024)}KB)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="serviceAgreement">
                  3. 솔라피 이용계약서 (작성 완료본) *
                </Label>
                <Input
                  id="serviceAgreement"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('serviceAgreement', e.target.files?.[0] || null)}
                  required
                />
                {files.serviceAgreement && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {files.serviceAgreement.name} ({Math.round(files.serviceAgreement.size / 1024)}KB)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="privacyAgreement">
                  4. 개인정보처리 위탁계약서 (작성 완료본) *
                </Label>
                <Input
                  id="privacyAgreement"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('privacyAgreement', e.target.files?.[0] || null)}
                  required
                />
                {files.privacyAgreement && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {files.privacyAgreement.name} ({Math.round(files.privacyAgreement.size / 1024)}KB)
                  </p>
                )}
              </div>
            </div>

            {/* 에러/성공 메시지 */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  발신번호 등록 신청이 완료되었습니다. 관리자 승인을 기다려주세요.
                </AlertDescription>
              </Alert>
            )}

            {/* 제출 버튼 */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  신청 중...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  발신번호 등록 신청
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
