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

// 하드코딩된 카테고리 (Solapi 전체 카테고리 목록)
const HARDCODED_CATEGORIES: Category[] = [
  {
    code: '001',
    name: '비즈니스/경제',
    subcategories: [
      {
        code: '001001',
        name: '금융/재테크',
        subcategories: [
          { code: '001001001', name: '은행/금융' },
          { code: '001001002', name: '증권/투자' },
          { code: '001001003', name: '보험' },
          { code: '001001004', name: '부동산' },
          { code: '001001005', name: '세무/회계' },
        ],
      },
      {
        code: '001002',
        name: '기업서비스',
        subcategories: [
          { code: '001002001', name: '컨설팅' },
          { code: '001002002', name: '법률' },
          { code: '001002003', name: '인사/채용' },
          { code: '001002004', name: '광고/마케팅' },
        ],
      },
    ],
  },
  {
    code: '002',
    name: '교육',
    subcategories: [
      {
        code: '002001',
        name: '학원',
        subcategories: [
          { code: '002001001', name: '어학원' },
          { code: '002001002', name: '입시학원' },
          { code: '002001003', name: '예체능학원' },
          { code: '002001004', name: '컴퓨터학원' },
          { code: '002001005', name: '기타학원' },
        ],
      },
      {
        code: '002002',
        name: '온라인교육',
        subcategories: [
          { code: '002002001', name: '어학' },
          { code: '002002002', name: '입시' },
          { code: '002002003', name: '자격증' },
          { code: '002002004', name: 'IT/프로그래밍' },
          { code: '002002005', name: '취미/실용' },
        ],
      },
      {
        code: '002003',
        name: '교육기관',
        subcategories: [
          { code: '002003001', name: '유치원' },
          { code: '002003002', name: '초등학교' },
          { code: '002003003', name: '중학교' },
          { code: '002003004', name: '고등학교' },
          { code: '002003005', name: '대학교' },
        ],
      },
    ],
  },
  {
    code: '003',
    name: '생활/건강',
    subcategories: [
      {
        code: '003001',
        name: '병원',
        subcategories: [
          { code: '003001001', name: '내과' },
          { code: '003001002', name: '외과' },
          { code: '003001003', name: '소아과' },
          { code: '003001004', name: '산부인과' },
          { code: '003001005', name: '치과' },
          { code: '003001006', name: '한의원' },
          { code: '003001007', name: '피부과' },
          { code: '003001008', name: '성형외과' },
          { code: '003001009', name: '안과' },
        ],
      },
      {
        code: '003002',
        name: '뷰티',
        subcategories: [
          { code: '003002001', name: '헤어샵' },
          { code: '003002002', name: '네일샵' },
          { code: '003002003', name: '피부관리실' },
          { code: '003002004', name: '왁싱샵' },
          { code: '003002005', name: '메이크업샵' },
        ],
      },
      {
        code: '003003',
        name: '운동/피트니스',
        subcategories: [
          { code: '003003001', name: '헬스장' },
          { code: '003003002', name: '요가/필라테스' },
          { code: '003003003', name: '수영장' },
          { code: '003003004', name: '골프연습장' },
          { code: '003003005', name: 'PT/트레이닝' },
        ],
      },
    ],
  },
  {
    code: '004',
    name: '여행/레저',
    subcategories: [
      {
        code: '004001',
        name: '여행사',
        subcategories: [
          { code: '004001001', name: '국내여행' },
          { code: '004001002', name: '해외여행' },
          { code: '004001003', name: '항공권' },
          { code: '004001004', name: '패키지여행' },
        ],
      },
      {
        code: '004002',
        name: '숙박',
        subcategories: [
          { code: '004002001', name: '호텔' },
          { code: '004002002', name: '모텔' },
          { code: '004002003', name: '펜션' },
          { code: '004002004', name: '게스트하우스' },
        ],
      },
    ],
  },
  {
    code: '005',
    name: '쇼핑/유통',
    subcategories: [
      {
        code: '005001',
        name: '패션/의류',
        subcategories: [
          { code: '005001001', name: '여성의류' },
          { code: '005001002', name: '남성의류' },
          { code: '005001003', name: '아동복' },
          { code: '005001004', name: '신발' },
          { code: '005001005', name: '가방/잡화' },
        ],
      },
      {
        code: '005002',
        name: '화장품/미용',
        subcategories: [
          { code: '005002001', name: '스킨케어' },
          { code: '005002002', name: '메이크업' },
          { code: '005002003', name: '헤어케어' },
          { code: '005002004', name: '향수' },
        ],
      },
      {
        code: '005003',
        name: '식품',
        subcategories: [
          { code: '005003001', name: '농산물' },
          { code: '005003002', name: '수산물' },
          { code: '005003003', name: '축산물' },
          { code: '005003004', name: '건강식품' },
          { code: '005003005', name: '가공식품' },
        ],
      },
    ],
  },
  {
    code: '006',
    name: '음식/외식',
    subcategories: [
      {
        code: '006001',
        name: '한식',
        subcategories: [
          { code: '006001001', name: '고기/구이' },
          { code: '006001002', name: '찌개/전골' },
          { code: '006001003', name: '백반/한정식' },
        ],
      },
      {
        code: '006002',
        name: '중식',
        subcategories: [
          { code: '006002001', name: '중화요리' },
        ],
      },
      {
        code: '006003',
        name: '일식',
        subcategories: [
          { code: '006003001', name: '초밥/회' },
          { code: '006003002', name: '돈카츠/우동' },
        ],
      },
      {
        code: '006004',
        name: '양식',
        subcategories: [
          { code: '006004001', name: '스테이크/바비큐' },
          { code: '006004002', name: '파스타/피자' },
        ],
      },
      {
        code: '006005',
        name: '카페/디저트',
        subcategories: [
          { code: '006005001', name: '커피전문점' },
          { code: '006005002', name: '베이커리' },
          { code: '006005003', name: '아이스크림' },
        ],
      },
    ],
  },
  {
    code: '007',
    name: 'IT/기술',
    subcategories: [
      {
        code: '007001',
        name: '소프트웨어',
        subcategories: [
          { code: '007001001', name: '앱개발' },
          { code: '007001002', name: '웹개발' },
          { code: '007001003', name: '시스템개발' },
        ],
      },
      {
        code: '007002',
        name: '하드웨어',
        subcategories: [
          { code: '007002001', name: '컴퓨터' },
          { code: '007002002', name: '모바일기기' },
          { code: '007002003', name: '주변기기' },
        ],
      },
    ],
  },
  {
    code: '008',
    name: '자동차',
    subcategories: [
      {
        code: '008001',
        name: '판매',
        subcategories: [
          { code: '008001001', name: '신차' },
          { code: '008001002', name: '중고차' },
        ],
      },
      {
        code: '008002',
        name: '정비/수리',
        subcategories: [
          { code: '008002001', name: '정비소' },
          { code: '008002002', name: '세차장' },
        ],
      },
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

  // Load categories on mount (API 시도 후 실패 시 하드코딩 사용)
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/kakao/channel-categories');
      const data = await response.json();
      
      if (data.success && data.categories && data.categories.length > 0) {
        setCategories(data.categories);
        console.log('✅ Loaded categories from API:', data.categories);
      } else {
        console.warn('⚠️ API failed, using hardcoded categories');
        setCategories(HARDCODED_CATEGORIES);
      }
    } catch (err: any) {
      console.warn('⚠️ API error, using hardcoded categories:', err);
      setCategories(HARDCODED_CATEGORIES);
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
        setStep(3);
      } else {
        setError(data.error || '인증번호 요청에 실패했습니다.');
      }
    } catch (err: any) {
      setError('인증번호 요청 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!searchId || !phoneNumber || !finalCategoryCode || !verificationCode) {
      setError('모든 필드를 입력해주세요. (대분류, 중분류, 소분류 필수)');
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
      const cleanSearchId = searchId.replace('@', '');
      
      console.log('📤 Sending create channel request:', {
        searchId: cleanSearchId,
        phoneNumber,
        categoryCode: finalCategoryCode,
        tokenLength: verificationCode.length
      });
      
      const response = await fetch('/api/kakao/create-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          searchId: cleanSearchId, 
          phoneNumber, 
          categoryCode: finalCategoryCode,
          token: verificationCode
        }),
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
    setFinalCategoryCode('');
  };

  // 중분류 선택 시
  const handleSubCategoryChange = (value: string) => {
    setSubCategory(value);
    setDetailCategory('');
    setFinalCategoryCode('');
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
            <CardTitle>Step 1: 카테고리 선택</CardTitle>
            <CardDescription>
              채널의 업종 카테고리를 먼저 선택해주세요. (대분류 → 중분류 → 소분류)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <Label htmlFor="subCategory">카테고리 - 중분류 *</Label>
                <select
                  id="subCategory"
                  className="w-full p-2 border rounded-md"
                  value={subCategory}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  disabled={loading}
                >
                  <option value="">중분류 선택</option>
                  {subCategories.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 소분류 선택 */}
            {subCategory && detailCategories.length > 0 && (
              <div>
                <Label htmlFor="detailCategory">카테고리 - 소분류 *</Label>
                <select
                  id="detailCategory"
                  className="w-full p-2 border rounded-md"
                  value={detailCategory}
                  onChange={(e) => handleDetailCategoryChange(e.target.value)}
                  disabled={loading}
                >
                  <option value="">소분류 선택</option>
                  {detailCategories.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 선택된 카테고리 표시 */}
            {finalCategoryCode && (
              <div className="p-3 bg-green-50 rounded-md border border-green-200">
                <p className="text-sm text-green-900">
                  ✅ 선택된 카테고리: <strong>{finalCategoryCode}</strong>
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
                placeholder="@your_channel_id"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-1">
                카카오톡 채널 검색용 ID (@ 포함 또는 제외)
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
          <Link href="/dashboard/kakao-business-guide" target="_blank">
            <Button variant="link" size="sm" className="text-blue-600 h-auto p-0">
              <BookOpen className="w-4 h-4 mr-1" />
              자세한 가이드 →
            </Button>
          </Link>
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
