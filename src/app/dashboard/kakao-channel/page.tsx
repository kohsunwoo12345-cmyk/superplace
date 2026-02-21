"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, Phone, Building2, ChevronRight,
  CheckCircle, AlertCircle, Loader2, Info
} from "lucide-react";

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
  const [businessNumber, setBusinessNumber] = useState('');

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
      // 로딩 실패 시 기본 카테고리 사용
      loadDefaultCategories();
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadDefaultCategories = () => {
    // Solapi 카카오톡 채널 기본 카테고리
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
      ],
      middleCategories: {
        '001': [
          { code: '001001', name: '학원' },
          { code: '001002', name: '교육기관' },
          { code: '001003', name: '온라인교육' },
          { code: '001004', name: '유아교육' },
          { code: '001005', name: '어학' },
        ],
        '002': [
          { code: '002001', name: '은행' },
          { code: '002002', name: '증권' },
          { code: '002003', name: '보험' },
          { code: '002004', name: '대부/캐피탈' },
        ],
        '003': [
          { code: '003001', name: '백화점/마트' },
          { code: '003002', name: '온라인쇼핑' },
          { code: '003003', name: '패션/의류' },
          { code: '003004', name: '식품' },
        ],
      },
      subCategories: {
        '001001': [
          { code: '001001001', name: '입시학원' },
          { code: '001001002', name: '보습학원' },
          { code: '001001003', name: '예체능학원' },
          { code: '001001004', name: '직업/취업학원' },
        ],
        '001002': [
          { code: '001002001', name: '초등학교' },
          { code: '001002002', name: '중학교' },
          { code: '001002003', name: '고등학교' },
          { code: '001002004', name: '대학교' },
        ],
        '001003': [
          { code: '001003001', name: '인터넷강의' },
          { code: '001003002', name: 'VOD강의' },
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

    if (!phoneNumber || !channelName || !selectedSub) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    // 전화번호 형식 검증
    const phoneRegex = /^01[0-9]{8,9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/-/g, ''))) {
      alert('올바른 전화번호 형식이 아닙니다.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/kakao/channels/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/-/g, ''),
          channelName,
          businessNumber: businessNumber.replace(/-/g, ''),
          categoryCode: selectedSub,
          mainCategory: selectedMain,
          middleCategory: selectedMiddle,
          subCategory: selectedSub
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to register channel');
      }

      const result = await response.json();
      
      alert('카카오 채널 등록 신청이 완료되었습니다.\n승인까지 1-2일 소요될 수 있습니다.');
      
      // 폼 초기화
      setPhoneNumber('');
      setChannelName('');
      setBusinessNumber('');
      setSelectedMain('');
      setSelectedMiddle('');
      setSelectedSub('');
      
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

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="w-8 h-8 text-green-600" />
          카카오 채널 등록
        </h1>
        <p className="text-gray-600 mt-2">카카오톡 알림톡 발송을 위한 채널을 등록하세요</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 등록 폼 */}
        <Card>
          <CardHeader>
            <CardTitle>새 채널 등록</CardTitle>
            <CardDescription>
              전화번호와 카테고리를 선택하여 카카오 채널을 등록하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 전화번호 */}
              <div>
                <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  전화번호 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                  placeholder="010-1234-5678"
                  required
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  카카오톡 알림톡 발신번호로 사용할 전화번호
                </p>
              </div>

              {/* 채널명 */}
              <div>
                <Label htmlFor="channelName">
                  채널명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="channelName"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="예: 슈퍼플레이스 스터디"
                  required
                  className="mt-1"
                />
              </div>

              {/* 사업자등록번호 */}
              <div>
                <Label htmlFor="businessNumber">
                  사업자등록번호 (선택)
                </Label>
                <Input
                  id="businessNumber"
                  value={businessNumber}
                  onChange={(e) => setBusinessNumber(e.target.value)}
                  placeholder="123-45-67890"
                  className="mt-1"
                />
              </div>

              {/* 카테고리 선택 */}
              <div className="space-y-3">
                <Label>업종 카테고리 <span className="text-red-500">*</span></Label>
                
                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    {/* 대분류 */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        대분류
                      </label>
                      <select
                        value={selectedMain}
                        onChange={(e) => handleMainCategoryChange(e.target.value)}
                        className="w-full border rounded-md p-2"
                        required
                      >
                        <option value="">선택하세요</option>
                        {categories.mainCategories.map((cat) => (
                          <option key={cat.code} value={cat.code}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 중분류 */}
                    {selectedMain && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1">
                          <ChevronRight className="w-4 h-4" />
                          중분류
                        </label>
                        <select
                          value={selectedMiddle}
                          onChange={(e) => handleMiddleCategoryChange(e.target.value)}
                          className="w-full border rounded-md p-2"
                          required
                        >
                          <option value="">선택하세요</option>
                          {middleCategories.map((cat) => (
                            <option key={cat.code} value={cat.code}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* 소분류 */}
                    {selectedMiddle && subCategories.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1">
                          <ChevronRight className="w-4 h-4" />
                          <ChevronRight className="w-4 h-4" />
                          소분류
                        </label>
                        <select
                          value={selectedSub}
                          onChange={(e) => setSelectedSub(e.target.value)}
                          className="w-full border rounded-md p-2"
                          required
                        >
                          <option value="">선택하세요</option>
                          {subCategories.map((cat) => (
                            <option key={cat.code} value={cat.code}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 선택된 카테고리 표시 */}
              {selectedSub && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-1">선택된 카테고리:</p>
                  <p className="text-sm text-blue-700">
                    {categories.mainCategories.find(c => c.code === selectedMain)?.name}
                    {' > '}
                    {middleCategories.find(c => c.code === selectedMiddle)?.name}
                    {subCategories.length > 0 && (
                      <>
                        {' > '}
                        {subCategories.find(c => c.code === selectedSub)?.name}
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* 안내 사항 */}
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>• 카카오 채널 등록 후 승인까지 1-2일 소요됩니다</p>
                    <p>• 전화번호는 실제 사용 가능한 번호여야 합니다</p>
                    <p>• 카테고리는 실제 업종과 일치해야 합니다</p>
                    <p>• 승인 후 카카오톡 알림톡 발송이 가능합니다</p>
                  </div>
                </div>
              </div>

              {/* 제출 버튼 */}
              <Button
                type="submit"
                disabled={loading || !selectedSub}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    채널 등록 신청
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 등록된 채널 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>등록된 채널 목록</CardTitle>
            <CardDescription>
              내가 등록한 카카오 채널 목록입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myChannels.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>등록된 채널이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myChannels.map((channel) => (
                  <div
                    key={channel.channelId}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{channel.channelName}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {channel.phoneNumber}
                        </p>
                      </div>
                      {getStatusBadge(channel.status)}
                    </div>
                    <div className="text-xs text-gray-500">
                      등록일: {new Date(channel.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
