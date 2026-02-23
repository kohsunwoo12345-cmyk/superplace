"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, Phone, Building2, ChevronRight,
  CheckCircle, AlertCircle, Loader2, Info, Building, Briefcase, List, BookOpen
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Category {
  code: string;
  name: string;
}

interface CategoryData {
  mainCategories: Category[];
  middleCategories: { [key: string]: Category[] };
  subCategories: { [key: string]: Category[] };
}

interface KakaoChannel {
  channelId: string;
  phoneNumber: string;
  channelName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  categoryCode: string;
  createdAt: string;
}

export default function KakaoChannelRegisterPage() {
  const router = useRouter();
  
  // 카테고리 데이터
  const [categories, setCategories] = useState<CategoryData>({
    mainCategories: [],
    middleCategories: {},
    subCategories: {}
  });

  // 선택된 카테고리
  const [selectedMain, setSelectedMain] = useState('');
  const [selectedMiddle, setSelectedMiddle] = useState('');
  const [selectedSub, setSelectedSub] = useState('');

  // 폼 데이터
  const [phoneNumber, setPhoneNumber] = useState('');
  const [channelName, setChannelName] = useState('');
  const [searchChannelId, setSearchChannelId] = useState(''); // 검색용 카카오 채널 ID
  const [businessNumber, setBusinessNumber] = useState('');
  const [businessFile, setBusinessFile] = useState<File | null>(null); // 사업자등록증

  // 상태
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [myChannels, setMyChannels] = useState<KakaoChannel[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchMyChannels();
  }, []);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch('/api/kakao/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      loadDefaultCategories();
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadDefaultCategories = () => {
    const defaultCategories: CategoryData = {
      mainCategories: [
        { code: '001', name: '교육' },
        { code: '002', name: '금융/보험' },
        { code: '003', name: '쇼핑/유통' },
        { code: '004', name: '생활/건강' },
        { code: '005', name: '여가/오락' },
        { code: '006', name: '부동산' },
        { code: '007', name: '서비스업' },
        { code: '008', name: '미디어/출판' },
        { code: '009', name: '공공/단체' },
        { code: '010', name: 'IT/전자' },
        { code: '011', name: '음식점' },
        { code: '012', name: '패션/뷰티' },
      ],
      middleCategories: {
        '001': [
          { code: '001001', name: '학원' },
          { code: '001002', name: '교육기관' },
          { code: '001003', name: '온라인교육' },
          { code: '001004', name: '유아교육' },
          { code: '001005', name: '어학' },
          { code: '001006', name: '예체능' },
        ],
        '002': [
          { code: '002001', name: '은행' },
          { code: '002002', name: '증권/투자' },
          { code: '002003', name: '보험' },
          { code: '002004', name: '대부/캐피탈' },
          { code: '002005', name: '카드' },
        ],
        '003': [
          { code: '003001', name: '백화점/마트' },
          { code: '003002', name: '온라인쇼핑몰' },
          { code: '003003', name: '편의점' },
          { code: '003004', name: '가전제품' },
          { code: '003005', name: '식품' },
        ],
        '004': [
          { code: '004001', name: '병원' },
          { code: '004002', name: '약국' },
          { code: '004003', name: '건강식품' },
          { code: '004004', name: '헬스/피트니스' },
        ],
        '011': [
          { code: '011001', name: '한식' },
          { code: '011002', name: '중식' },
          { code: '011003', name: '일식' },
          { code: '011004', name: '양식' },
          { code: '011005', name: '카페/디저트' },
          { code: '011006', name: '패스트푸드' },
        ],
      },
      subCategories: {
        '001001': [
          { code: '001001001', name: '입시학원' },
          { code: '001001002', name: '초중고 보습학원' },
          { code: '001001003', name: '예체능학원' },
          { code: '001001004', name: '직업/취업학원' },
          { code: '001001005', name: '외국어학원' },
          { code: '001001006', name: '컴퓨터/IT학원' },
        ],
        '001002': [
          { code: '001002001', name: '유치원' },
          { code: '001002002', name: '초등학교' },
          { code: '001002003', name: '중학교' },
          { code: '001002004', name: '고등학교' },
          { code: '001002005', name: '대학교' },
          { code: '001002006', name: '대학원' },
        ],
        '001003': [
          { code: '001003001', name: '인터넷강의' },
          { code: '001003002', name: 'VOD강의' },
          { code: '001003003', name: '라이브강의' },
        ],
        '002001': [
          { code: '002001001', name: '시중은행' },
          { code: '002001002', name: '지방은행' },
          { code: '002001003', name: '인터넷은행' },
        ],
        '003002': [
          { code: '003002001', name: '종합쇼핑몰' },
          { code: '003002002', name: '오픈마켓' },
          { code: '003002003', name: '소셜커머스' },
        ],
        '011001': [
          { code: '011001001', name: '일반한식' },
          { code: '011001002', name: '고기/구이' },
          { code: '011001003', name: '찌개/전골' },
          { code: '011001004', name: '분식' },
        ],
        '011005': [
          { code: '011005001', name: '커피전문점' },
          { code: '011005002', name: '베이커리' },
          { code: '011005003', name: '디저트카페' },
          { code: '011005004', name: '아이스크림' },
        ],
      }
    };
    setCategories(defaultCategories);
  };

  const fetchMyChannels = async () => {
    try {
      const response = await fetch('/api/kakao/channels/my');
      if (response.ok) {
        const data = await response.json();
        setMyChannels(data.channels || []);
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  };

  const handleMainCategoryChange = (code: string) => {
    setSelectedMain(code);
    setSelectedMiddle('');
    setSelectedSub('');
  };

  const handleMiddleCategoryChange = (code: string) => {
    setSelectedMiddle(code);
    setSelectedSub('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || !channelName || !searchChannelId || !businessFile || !selectedSub) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    const phoneRegex = /^01[0-9]{8,9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/-/g, ''))) {
      alert('올바른 전화번호 형식이 아닙니다.');
      return;
    }

    // 파일 크기 체크 (5MB)
    if (businessFile.size > 5 * 1024 * 1024) {
      alert('사업자등록증 파일은 최대 5MB까지 업로드 가능합니다.');
      return;
    }

    try {
      setLoading(true);

      // FormData로 파일과 함께 전송
      const formData = new FormData();
      formData.append('phoneNumber', phoneNumber.replace(/-/g, ''));
      formData.append('channelName', channelName);
      formData.append('searchChannelId', searchChannelId);
      formData.append('businessNumber', businessNumber.replace(/-/g, ''));
      formData.append('categoryCode', selectedSub);
      formData.append('mainCategory', selectedMain);
      formData.append('middleCategory', selectedMiddle);
      formData.append('subCategory', selectedSub);
      formData.append('businessFile', businessFile);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/kakao/channels/register', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to register channel');
      }

      alert('카카오 채널 등록 신청이 완료되었습니다.\n승인까지 1-2일 소요될 수 있습니다.');
      
      setPhoneNumber('');
      setChannelName('');
      setSearchChannelId('');
      setBusinessNumber('');
      setBusinessFile(null);
      setSelectedMain('');
      setSelectedMiddle('');
      setSelectedSub('');
      
      // 파일 input 초기화
      const fileInput = document.getElementById('businessFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchMyChannels();
    } catch (error: any) {
      console.error('Failed to register channel:', error);
      alert(`카카오 채널 등록 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <AlertCircle className="w-3 h-3 mr-1" /> 승인 대기
        </Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" /> 승인 완료
        </Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
          <AlertCircle className="w-3 h-3 mr-1" /> 승인 거절
        </Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const middleCategories = selectedMain ? (categories.middleCategories[selectedMain] || []) : [];
  const subCategories = selectedMiddle ? (categories.subCategories[selectedMiddle] || []) : [];

  const getSelectedCategoryName = (code: string, list: Category[]) => {
    return list.find(c => c.code === code)?.name || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">카카오 채널 등록</h1>
                <p className="text-gray-600 mt-1">카카오톡 알림톡 발송을 위한 채널을 등록하세요</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/dashboard/kakao-business-guide')}
              variant="outline"
              className="flex items-center gap-2 h-12 px-6 bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
            >
              <BookOpen className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-yellow-700">연동가이드 보기</span>
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 등록 폼 - 2열 */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Building className="w-6 h-6 text-green-600" />
                  채널 기본 정보
                </CardTitle>
                <CardDescription className="text-base">
                  채널로 사용할 전화번호와 채널명을 입력하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 전화번호 */}
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="flex items-center gap-2 text-base font-semibold">
                      <Phone className="w-4 h-4 text-green-600" />
                      전화번호 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                      placeholder="010-1234-5678"
                      required
                      className="h-12 text-lg"
                    />
                    <p className="text-sm text-gray-500">
                      카카오톡 알림톡 발신번호로 사용할 전화번호
                    </p>
                  </div>

                  {/* 채널명 */}
                  <div className="space-y-2">
                    <Label htmlFor="channelName" className="flex items-center gap-2 text-base font-semibold">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      채널명 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="channelName"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="예: 슈퍼플레이스 스터디"
                      required
                      className="h-12 text-lg"
                    />
                  </div>

                  {/* 검색용 카카오 채널 ID */}
                  <div className="space-y-2">
                    <Label htmlFor="searchChannelId" className="flex items-center gap-2 text-base font-semibold">
                      <MessageCircle className="w-4 h-4 text-yellow-600" />
                      검색용 카카오 채널 ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="searchChannelId"
                      value={searchChannelId}
                      onChange={(e) => setSearchChannelId(e.target.value)}
                      placeholder="예: @superplacestudy"
                      required
                      className="h-12 text-lg"
                    />
                    <p className="text-sm text-gray-500">
                      카카오톡에서 검색할 때 사용되는 채널 ID (@로 시작)
                    </p>
                  </div>

                  {/* 사업자등록번호 */}
                  <div className="space-y-2">
                    <Label htmlFor="businessNumber" className="flex items-center gap-2 text-base font-semibold">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      사업자등록번호 <span className="text-gray-400">(선택)</span>
                    </Label>
                    <Input
                      id="businessNumber"
                      value={businessNumber}
                      onChange={(e) => setBusinessNumber(e.target.value)}
                      placeholder="123-45-67890"
                      className="h-12 text-lg"
                    />
                  </div>

                  {/* 사업자등록증 첨부 */}
                  <div className="space-y-2">
                    <Label htmlFor="businessFile" className="flex items-center gap-2 text-base font-semibold">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      사업자등록증 첨부 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="businessFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setBusinessFile(e.target.files?.[0] || null)}
                      required
                      className="h-12 text-lg"
                    />
                    <p className="text-sm text-gray-500">
                      사업자등록증 이미지 또는 PDF 파일 (최대 5MB)
                    </p>
                    {businessFile && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        {businessFile.name} ({(businessFile.size / 1024 / 1024).toFixed(2)}MB)
                      </div>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* 카테고리 선택 */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                  업종 카테고리 <span className="text-red-500">*</span>
                </CardTitle>
                <CardDescription className="text-base">
                  실제 업종과 일치하는 카테고리를 선택하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* 대분류 */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-bold">1</span>
                        </div>
                        <label className="text-lg font-bold text-gray-900">
                          대분류
                        </label>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {categories.mainCategories.map((cat) => (
                          <button
                            key={cat.code}
                            type="button"
                            onClick={() => handleMainCategoryChange(cat.code)}
                            className={`
                              p-4 rounded-xl border-2 transition-all duration-200 text-left
                              ${selectedMain === cat.code
                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                              }
                            `}
                          >
                            <div className="font-semibold text-gray-900">{cat.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 중분류 */}
                    {selectedMain && middleCategories.length > 0 && (
                      <div className="space-y-3 animate-in slide-in-from-top">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-green-600 font-bold">2</span>
                          </div>
                          <label className="text-lg font-bold text-gray-900">
                            중분류
                          </label>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-blue-600 font-medium">
                            {getSelectedCategoryName(selectedMain, categories.mainCategories)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {middleCategories.map((cat) => (
                            <button
                              key={cat.code}
                              type="button"
                              onClick={() => handleMiddleCategoryChange(cat.code)}
                              className={`
                                p-4 rounded-xl border-2 transition-all duration-200 text-left
                                ${selectedMiddle === cat.code
                                  ? 'border-green-500 bg-green-50 shadow-md'
                                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                                }
                              `}
                            >
                              <div className="text-xs text-gray-500 mt-1">{cat.code}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 소분류 */}
                    {selectedMiddle && subCategories.length > 0 && (
                      <div className="space-y-3 animate-in slide-in-from-top">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-purple-600 font-bold">3</span>
                          </div>
                          <label className="text-lg font-bold text-gray-900">
                            소분류
                          </label>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-green-600 font-medium">
                            {getSelectedCategoryName(selectedMiddle, middleCategories)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {subCategories.map((cat) => (
                            <button
                              key={cat.code}
                              type="button"
                              onClick={() => setSelectedSub(cat.code)}
                              className={`
                                p-4 rounded-xl border-2 transition-all duration-200 text-left
                                ${selectedSub === cat.code
                                  ? 'border-purple-500 bg-purple-50 shadow-md'
                                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                                }
                              `}
                            >
                              <div className="text-xs text-gray-500 mt-1">{cat.code}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 선택된 카테고리 요약 */}
                    {selectedSub && (
                      <div className="p-5 bg-gradient-to-r from-blue-50 via-green-50 to-purple-50 rounded-xl border-2 border-blue-200 animate-in slide-in-from-bottom">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">선택된 카테고리:</p>
                            <div className="flex flex-wrap items-center gap-2 text-base">
                              <Badge className="bg-blue-500 text-white px-3 py-1">
                                {getSelectedCategoryName(selectedMain, categories.mainCategories)}
                              </Badge>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                              <Badge className="bg-green-500 text-white px-3 py-1">
                                {getSelectedCategoryName(selectedMiddle, middleCategories)}
                              </Badge>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                              <Badge className="bg-purple-500 text-white px-3 py-1">
                                {getSelectedCategoryName(selectedSub, subCategories)}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                              코드: {selectedSub}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 제출 버튼 */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedSub}
              className="w-full h-14 text-lg font-bold shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  등록 중...
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5 mr-2" />
                  채널 등록 신청하기
                </>
              )}
            </Button>

            {/* 안내 사항 */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="font-semibold text-amber-900">📋 등록 안내</p>
                    <ul className="space-y-1.5 ml-1">
                      <li>• 카카오 채널 등록 후 승인까지 <strong>1-2일</strong> 소요됩니다</li>
                      <li>• 전화번호는 <strong>실제 사용 가능한 번호</strong>여야 합니다</li>
                      <li>• 카테고리는 <strong>실제 업종과 일치</strong>해야 합니다</li>
                      <li>• 승인 후 카카오톡 알림톡 발송이 가능합니다</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 등록된 채널 목록 - 1열 */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 sticky top-6">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <List className="w-5 h-5 text-blue-600" />
                  등록된 채널
                </CardTitle>
                <CardDescription>
                  내가 등록한 채널 목록
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {myChannels.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">등록된 채널이 없습니다</p>
                    <p className="text-sm mt-1">첫 채널을 등록해보세요</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {myChannels.map((channel) => (
                      <div
                        key={channel.channelId}
                        className="p-4 border-2 rounded-xl hover:shadow-lg transition-all duration-200 bg-white"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 mb-1">
                              {channel.channelName}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" />
                              {channel.phoneNumber}
                            </p>
                          </div>
                          {getStatusBadge(channel.status)}
                        </div>
                        <div className="text-xs text-gray-500 pt-2 border-t">
                          등록일: {new Date(channel.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
