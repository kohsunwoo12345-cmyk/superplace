"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface Category {
  code: string;
  name: string;
  subcategories?: Category[];
}

// Solapi 카카오 플러스친구 실제 카테고리 코드
// 참고: 실제 Solapi API에서 가져온 정확한 11자리 코드 사용
const HARDCODED_CATEGORIES: Category[] = [
  {
    code: '건강',
    name: '건강',
    subcategories: [
      { code: '00100010001', name: '건강,병원,종합병원' },
      { code: '00100010002', name: '건강,병원,피부과' },
      { code: '00100010017', name: '건강,병원,한의원' },
      { code: '00100020001', name: '건강,약국,약국' },
    ],
  },
  {
    code: '교육',
    name: '교육',
    subcategories: [
      { code: '00200020001', name: '교육,학원,오프라인학원' },
      { code: '00200020002', name: '교육,학원,온라인학원' },
      { code: '00200010001', name: '교육,학교,유치원' },
      { code: '00200030001', name: '교육,교육원,어린이집/평생교육원/문화센터' },
    ],
  },
  {
    code: '미용',
    name: '미용',
    subcategories: [
      { code: '00500010001', name: '미용,미용,헤어샵' },
      { code: '00500010002', name: '미용,미용,뷰티케어샵/체형클리닉' },
      { code: '00500010004', name: '미용,미용,뷰티/화장품' },
    ],
  },
  {
    code: '소매(쇼핑몰)',
    name: '소매(쇼핑몰)',
    subcategories: [
      { code: '00600040001', name: '소매(쇼핑몰),식품,식품' },
      { code: '00600050001', name: '소매(쇼핑몰),의류,의류' },
      { code: '00600060001', name: '소매(쇼핑몰),패션잡화,패션잡화' },
    ],
  },
  {
    code: '음식점',
    name: '음식점',
    subcategories: [
      { code: '01100010001', name: '음식점,음식점,음식점' },
      { code: '01100020001', name: '음식점,제과/제빵,제과/제빵' },
      { code: '01100040001', name: '음식점,카페,카페' },
      { code: '01100050001', name: '음식점,프랜차이즈,프랜차이즈' },
    ],
  },
  {
    code: '컴퓨터',
    name: '컴퓨터',
    subcategories: [
      { code: '01300010001', name: '컴퓨터,소프트웨어/솔루션,소프트웨어/솔루션' },
      { code: '01300020001', name: '컴퓨터,컴퓨터수리/보수,컴퓨터수리/보수' },
    ],
  },
  {
    code: '기타서비스',
    name: '기타서비스',
    subcategories: [
      { code: '02100020001', name: '기타서비스,업무알림' },
    ],
  },
];

export default function KakaoChannelRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>(HARDCODED_CATEGORIES);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form data
  const [searchId, setSearchId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // 카테고리 선택 (3단계)
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [detailCategory, setDetailCategory] = useState('');
  const [finalCategoryCode, setFinalCategoryCode] = useState('');
  
  const [verificationCode, setVerificationCode] = useState('');
  const [tokenSentTime, setTokenSentTime] = useState<Date | null>(null);

  // 실제 Solapi 카테고리 목록 가져오기
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('📥 Fetching Solapi categories from API...');
        const response = await fetch('/api/kakao/get-categories');
        const data = await response.json();
        
        if (data.success && data.categories) {
          console.log('✅ Solapi categories loaded:', data.categories);
          // 실제 API에서 받은 카테고리로 업데이트
          setCategories(data.categories);
        } else {
          console.warn('⚠️ Failed to load categories, using hardcoded:', data.error);
          // 실패 시 하드코딩된 카테고리 사용
          setCategories(HARDCODED_CATEGORIES);
        }
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
        // 에러 시 하드코딩된 카테고리 사용
        setCategories(HARDCODED_CATEGORIES);
      } finally {
        setLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, []);

  const handleRequestToken = async () => {
    if (!searchId || !phoneNumber) {
      setError('검색용 ID와 담당자 휴대전화 번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // searchId에서 @ 기호를 제거 (Solapi API는 @ 없이 순수 ID만 요구)
      const cleanSearchId = searchId.startsWith('@') ? searchId.substring(1) : searchId;
      
      console.log('📤 Requesting token (v2 API - no categoryCode needed):', {
        searchId: cleanSearchId,
        phoneNumber: phoneNumber.substring(0, 3) + '****'
      });
      
      const response = await fetch('/api/kakao/request-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          searchId: cleanSearchId, 
          phoneNumber
          // v2 API: categoryCode는 토큰 요청 시 불필요
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('인증번호가 SMS로 전송되었습니다. 휴대전화를 확인해주세요.');
        setTokenSentTime(new Date());
        setStep(3);
      } else {
        console.error('❌ Request token failed:', data);
        setError(data.error || '인증번호 요청에 실패했습니다.');
        if (data.details) {
          console.error('Error details:', data.details);
        }
        if (data.debug) {
          console.error('Debug info:', data.debug);
        }
      }
    } catch (err: any) {
      setError('인증번호 요청 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!searchId || !phoneNumber || !verificationCode || !finalCategoryCode) {
      setError('모든 필드를 입력해주세요. (카테고리 선택 필수)');
      return;
    }

    if (verificationCode.length < 4) {
      setError('올바른 인증번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // searchId에서 @ 기호를 제거 (Solapi API는 @ 없이 순수 ID만 요구)
      const cleanSearchId = searchId.startsWith('@') ? searchId.substring(1) : searchId;
      
      const requestData = {
        searchId: cleanSearchId, 
        phoneNumber, 
        categoryCode: finalCategoryCode,
        token: parseInt(verificationCode, 10)
      };
      
      console.log('🔍 최종 전송 데이터 (v2):', {
        searchId: cleanSearchId,
        searchIdOriginal: searchId,
        phoneNumber: phoneNumber,
        categoryCode: finalCategoryCode,
        categoryCodeType: typeof finalCategoryCode,
        categoryCodeLength: finalCategoryCode?.length,
        token: parseInt(verificationCode, 10),
        tokenType: typeof parseInt(verificationCode, 10),
        tokenOriginal: verificationCode,
        requestBodyStringified: JSON.stringify(requestData)
      });
      
      // 사용자가 확인할 수 있도록 alert 추가
      const confirmMessage = `전송 정보 확인:
검색 ID: ${cleanSearchId}
전화번호: ${phoneNumber}
카테고리: ${finalCategoryCode}
인증번호: ${verificationCode}

계속하시겠습니까?`;
      
      if (!confirm(confirmMessage)) {
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/kakao/create-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('카카오톡 채널이 성공적으로 연동되었습니다! 잠시 후 채널 관리 페이지로 이동합니다.');
        setTimeout(() => {
          router.push('/dashboard/kakao-channel');
        }, 2000);
      } else {
        console.error('❌ Create channel failed:', data);
        setError(data.error || '채널 연동에 실패했습니다.');
        if (data.details) {
          console.error('Error details:', data.details);
        }
      }
    } catch (err: any) {
      setError('채널 연동 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 대분류 선택 시
  const handleMainCategoryChange = (value: string) => {
    setMainCategory(value);
    setSubCategory('');
    setDetailCategory('');
    
    // 대분류의 하위 카테고리 확인
    const selectedMain = categories.find(c => c.code === value);
    const hasSub = selectedMain?.subcategories && selectedMain.subcategories.length > 0;
    
    // 하위 카테고리가 없으면 현재 코드를 최종 코드로 설정
    if (!hasSub) {
      setFinalCategoryCode(value);
    } else {
      setFinalCategoryCode('');
    }
  };

  // 중분류 선택 시
  const handleSubCategoryChange = (value: string) => {
    setSubCategory(value);
    setDetailCategory('');
    
    // 중분류 코드를 바로 사용 (예: CS02, PH01 등)
    setFinalCategoryCode(value);
  };

  // 소분류 선택 시
  const handleDetailCategoryChange = (value: string) => {
    setDetailCategory(value);
    setFinalCategoryCode(value); // 최종 카테고리 코드는 소분류 코드
  };

  // 선택된 대분류의 하위 카테고리
  const selectedMainCategoryObj = categories.find(c => c.code === mainCategory);
  const subCategories = selectedMainCategoryObj?.subcategories || [];

  // 선택된 중분류의 하위 카테고리
  const selectedSubCategoryObj = subCategories.find(c => c.code === subCategory);
  const detailCategories = selectedSubCategoryObj?.subcategories || [];

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">카카오톡 채널 연동</h1>
        <p className="text-gray-600">
          카카오 비즈니스 채널을 시스템에 연동하여 알림톡을 발송할 수 있습니다.
        </p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
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
            <CardTitle>Step 1: 카테고리 선택 (필수)</CardTitle>
            <CardDescription>
              채널의 업종 카테고리를 반드시 선택해주세요. 카테고리 선택 후 다음 단계로 진행할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingCategories ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-3 text-gray-600">Solapi 카테고리 목록 가져오는 중...</span>
              </div>
            ) : (
              <>
                {/* 디버그: 실제 카테고리 목록 표시 */}
                <Alert className="border-blue-500 bg-blue-50">
                  <AlertDescription className="text-blue-800">
                    <div className="font-bold mb-2">📋 Solapi에서 가져온 카테고리 목록:</div>
                    <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(categories, null, 2)}
                    </pre>
                  </AlertDescription>
                </Alert>

                {/* 대분류 선택 */}
                <div>
                  <Label htmlFor="mainCategory">카테고리 - 대분류 *</Label>
                  <select
                    id="mainCategory"
                    className="w-full p-2 border rounded-md"
                    value={mainCategory}
                    onChange={(e) => handleMainCategoryChange(e.target.value)}
                    disabled={loading || categories.length === 0}
                  >
                    <option value="">대분류 선택</option>
                    {categories.map((cat) => (
                      <option key={cat.code} value={cat.code}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

            {/* 중분류 선택 */}
            {mainCategory && subCategories.length > 0 && (
              <div>
                <Label htmlFor="subCategory">카테고리 선택 *</Label>
                <select
                  id="subCategory"
                  className="w-full p-2 border rounded-md"
                  value={subCategory}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  disabled={loading}
                >
                  <option value="">카테고리 선택</option>
                  {subCategories.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.name} ({cat.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 선택된 카테고리 표시 */}
            {finalCategoryCode ? (
              <div className="p-3 bg-green-50 rounded-md border border-green-200">
                <p className="text-sm text-green-900">
                  ✅ 선택된 카테고리: <strong>{finalCategoryCode}</strong>
                </p>
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
                <p className="text-sm text-yellow-900">
                  ⚠️ 카테고리를 선택해주세요 (필수)
                </p>
              </div>
            )}

            <Button 
              onClick={() => setStep(2)} 
              disabled={!finalCategoryCode}
              className="w-full"
            >
              다음 단계: 채널 정보 입력
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: 채널 정보 입력</CardTitle>
            <CardDescription>
              카카오 비즈니스 채널 정보를 입력하고 인증번호를 요청하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 선택된 카테고리 표시 */}
            <div className="p-3 bg-green-50 rounded-md border border-green-200">
              <p className="text-sm text-green-900">
                ✅ 선택된 카테고리: <strong>{finalCategoryCode}</strong>
              </p>
            </div>

            <div>
              <Label htmlFor="searchId">채널 검색용 ID *</Label>
              <Input
                id="searchId"
                placeholder="your_channel_id 또는 @your_channel_id"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                disabled={loading}
              />
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  💡 채널 검색용 ID 확인 방법:
                </p>
                <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                  <li><a href="https://business.kakao.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">카카오톡 채널 관리자센터</a> 접속</li>
                  <li>왼쪽 메뉴 → <strong>관리</strong> 클릭</li>
                  <li><strong>"검색용 아이디"</strong> 항목 확인 (예: myacademy)</li>
                  <li>@ 기호는 포함/제외 모두 가능 (자동으로 처리됨)</li>
                  <li><strong>홈 공개, 검색 허용을 모두 ON으로 설정</strong>해야 연동 가능</li>
                </ol>
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded">
                  <p className="text-xs text-yellow-900 font-medium">
                    ⚠️ 주의사항:
                  </p>
                  <ul className="text-xs text-yellow-800 mt-1 ml-4 list-disc">
                    <li>채널 <strong>이름</strong>이 아닌 <strong>검색용 ID</strong>를 입력하세요</li>
                    <li>채널이 <strong>비즈니스 인증</strong>되어 있어야 합니다</li>
                    <li>채널이 <strong>공개</strong> 상태여야 합니다</li>
                  </ul>
                </div>
              </div>
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

            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setStep(1)} 
                disabled={loading}
                className="flex-1"
              >
                ← 이전
              </Button>
              <Button 
                onClick={handleRequestToken} 
                disabled={loading || !searchId || !phoneNumber}
                className="flex-1"
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
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: 인증번호 확인</CardTitle>
            <CardDescription>
              SMS로 받은 인증번호를 입력하여 채널 연동을 완료하세요.
              {tokenSentTime && (
                <div className="mt-2 text-xs text-blue-600">
                  📱 인증번호 전송 시간: {tokenSentTime.toLocaleTimeString('ko-KR')}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 선택된 카테고리 표시 */}
            <div className="p-3 bg-green-50 rounded-md border border-green-200">
              <p className="text-sm text-green-900">
                ✅ 카테고리: <strong>{finalCategoryCode}</strong><br />
                ✅ 채널 ID: <strong>{searchId}</strong><br />
                ✅ 전화번호: <strong>{phoneNumber}</strong>
              </p>
            </div>

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

            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setStep(2);
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
                disabled={loading || !verificationCode || verificationCode.length < 4}
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
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-blue-900">📌 채널 연동 안내</h3>
        </div>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong className="text-blue-900">카카오톡 채널이 이미 개설되어 있어야 합니다</strong> - 
            <Link href="https://center-pf.kakao.com" target="_blank" className="underline ml-1">
              채널 개설하기 ↗
            </Link>
          </li>
          <li>• 카카오 비즈니스 센터에서 채널 검색용 ID를 확인하세요</li>
          <li>• 담당자 휴대전화는 카카오톡이 설치된 번호여야 합니다</li>
          <li>• <strong className="text-blue-900">카테고리는 대분류 → 중분류 → 소분류 순서로 선택하세요</strong></li>
          <li>• <strong className="text-blue-900">인증번호는 SMS로 전송되며 유효시간이 있으니 빠르게 입력하세요</strong></li>
          <li>• 인증번호를 받지 못했다면 "이전" 버튼을 눌러 다시 요청하세요</li>
        </ul>
      </div>
    </div>
  );
}
