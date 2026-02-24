"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface Category {
  code: string;
  name: string;
}

export default function KakaoChannelRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [searchId, setSearchId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [verificationCode, setVerificationCode] = useState(''); // 인증번호
  const [tokenSentTime, setTokenSentTime] = useState<Date | null>(null);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/kakao/channel-categories');
      const data = await response.json();
      
      if (data.success && data.categories && data.categories.length > 0) {
        setCategories(data.categories);
      } else {
        // API 실패 시 기본 카테고리 사용
        setCategories([
          { code: 'CATEGORY_001', name: '교육' },
          { code: 'CATEGORY_002', name: '금융/보험' },
          { code: 'CATEGORY_003', name: '유통/소매' },
          { code: 'CATEGORY_004', name: '서비스' },
          { code: 'CATEGORY_005', name: '의료' },
          { code: 'CATEGORY_006', name: 'IT/기술' },
          { code: 'CATEGORY_007', name: '기타' }
        ]);
      }
    } catch (err: any) {
      // 에러 발생 시 기본 카테고리 사용
      setCategories([
        { code: 'CATEGORY_001', name: '교육' },
        { code: 'CATEGORY_002', name: '금융/보험' },
        { code: 'CATEGORY_003', name: '유통/소매' },
        { code: 'CATEGORY_004', name: '서비스' },
        { code: 'CATEGORY_005', name: '의료' },
        { code: 'CATEGORY_006', name: 'IT/기술' },
        { code: 'CATEGORY_007', name: '기타' }
      ]);
      console.error(err);
    }
  };

  const handleRequestToken = async () => {
    if (!searchId || !phoneNumber) {
      setError('검색용 ID와 담당자 휴대전화 번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // @ 기호 제거
      const cleanSearchId = searchId.replace('@', '');
      
      const response = await fetch('/api/kakao/request-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchId: cleanSearchId, phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('인증번호가 SMS로 전송되었습니다. 휴대전화를 확인해주세요.');
        setTokenSentTime(new Date());
        setStep(2);
      } else {
        setError(data.error || '인증번호 요청에 실패했습니다.');
      }
    } catch (err: any) {
      setError('Failed to request token');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!searchId || !phoneNumber || !categoryCode || !verificationCode) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    // 인증번호 길이 체크 (일반적으로 6자리)
    if (verificationCode.length < 4) {
      setError('올바른 인증번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // @ 기호 제거
      const cleanSearchId = searchId.replace('@', '');
      
      const response = await fetch('/api/kakao/create-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          searchId: cleanSearchId, 
          phoneNumber, 
          categoryCode, 
          token: verificationCode // 인증번호를 token으로 전달
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('카카오톡 채널이 성공적으로 연동되었습니다! 잠시 후 채널 관리 페이지로 이동합니다.');
        setTimeout(() => {
          router.push('/dashboard/kakao-channel');
        }, 2000);
      } else {
        setError(data.error || '채널 연동에 실패했습니다. 인증번호를 확인해주세요.');
      }
    } catch (err: any) {
      setError('채널 연동에 실패했습니다. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">카카오톡 채널 연동</h1>
        <p className="text-gray-600">카카오 비즈니스 채널을 연동하여 알림톡을 발송하세요</p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              {step > 1 ? <CheckCircle2 size={20} /> : '1'}
            </div>
            <span className="ml-2 font-medium">인증번호 요청</span>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-300">
            <div className={`h-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} style={{ width: step >= 2 ? '100%' : '0%', transition: 'width 0.3s' }}></div>
          </div>
          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              2
            </div>
            <span className="ml-2 font-medium">인증 및 연동</span>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: 인증번호 요청</CardTitle>
            <CardDescription>
              카카오 비즈니스 채널 정보를 입력하면 담당자 휴대전화로 인증번호가 SMS로 전송됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="searchId">채널 검색용 ID *</Label>
              <Input
                id="searchId"
                placeholder="@your_channel_id"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-1">
                카카오톡 채널 검색용 ID (@ 포함)
              </p>
            </div>

            <div>
              <Label htmlFor="phoneNumber">담당자 휴대전화 번호 *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="01012345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-1">
                카카오 비즈니스 채널 담당자의 휴대전화 번호 (하이픈 제외)
              </p>
            </div>

            <Button 
              onClick={handleRequestToken} 
              disabled={loading || !searchId || !phoneNumber}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  전송 중...
                </>
              ) : (
                <>
                  인증번호 요청
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: 인증번호 확인 및 채널 연동</CardTitle>
            <CardDescription>
              SMS로 받은 인증번호를 입력하고 카테고리를 선택하여 채널 연동을 완료하세요.
              {tokenSentTime && (
                <div className="mt-2 text-xs text-blue-600">
                  📱 인증번호 전송 시간: {tokenSentTime.toLocaleTimeString('ko-KR')}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="verificationCode">인증번호 (6자리) *</Label>
              <Input
                id="verificationCode"
                type="text"
                placeholder="SMS로 받은 인증번호 입력"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                disabled={loading}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-sm text-gray-500 mt-1">
                📱 {phoneNumber}로 전송된 6자리 인증번호를 입력하세요
              </p>
            </div>

            <div>
              <Label htmlFor="category">채널 카테고리 *</Label>
              <select
                id="category"
                className="w-full p-2 border rounded-md"
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
                disabled={loading}
              >
                <option value="">카테고리 선택</option>
                {categories.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setVerificationCode('');
                  setSuccess(null);
                }} 
                disabled={loading}
                className="flex-1"
              >
                ← 인증번호 재요청
              </Button>
              <Button 
                onClick={handleCreateChannel} 
                disabled={loading || !verificationCode || !categoryCode || verificationCode.length < 4}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    인증 중...
                  </>
                ) : (
                  '인증 및 연동 완료'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">📌 채널 연동 안내</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 카카오톡 채널이 이미 개설되어 있어야 합니다</li>
          <li>• 카카오 비즈니스 센터에서 채널 검색용 ID를 확인하세요</li>
          <li>• 담당자 휴대전화는 카카오톡이 설치된 번호여야 합니다</li>
          <li>• <strong className="text-blue-900">인증번호는 SMS로 전송되며 유효시간이 있으니 빠르게 입력하세요</strong></li>
          <li>• 인증번호를 받지 못했다면 "이전" 버튼을 눌러 다시 요청하세요</li>
        </ul>
      </div>
    </div>
  );
}
