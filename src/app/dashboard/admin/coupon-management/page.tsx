"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Edit, Trash2, Ticket, Calendar, Users, 
  DollarSign, TrendingUp, Copy, Check
} from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount: number;
  usageLimit: number;
  usageCount: number;
  userUsageLimit: number;
  validFrom: string;
  validUntil: string;
  isActive: number;
  applicableProducts: string; // JSON array
  createdAt: string;
}

export default function CouponManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minPurchaseAmount: "0",
    maxDiscountAmount: "0",
    usageLimit: "-1",
    userUsageLimit: "1",
    validFrom: "",
    validUntil: "",
    applicableProducts: "",
    isActive: 1
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    if (userData.role !== 'ADMIN' && userData.role !== 'SUPER_ADMIN') {
      alert("관리자만 접근할 수 있습니다.");
      router.push("/dashboard");
      return;
    }

    fetchCoupons();
  }, [router]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/coupons', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch coupons');
      
      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
      alert('쿠폰 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const url = editingCoupon 
        ? `/api/admin/coupons/${editingCoupon.id}`
        : '/api/admin/coupons';
      
      const method = editingCoupon ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          discountValue: Number(formData.discountValue),
          minPurchaseAmount: Number(formData.minPurchaseAmount),
          maxDiscountAmount: Number(formData.maxDiscountAmount),
          usageLimit: Number(formData.usageLimit),
          userUsageLimit: Number(formData.userUsageLimit)
        })
      });

      if (!response.ok) throw new Error('Failed to save coupon');

      alert(editingCoupon ? '쿠폰이 수정되었습니다.' : '쿠폰이 생성되었습니다.');
      setShowModal(false);
      resetForm();
      fetchCoupons();
    } catch (error) {
      console.error('Failed to save coupon:', error);
      alert('쿠폰 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('이 쿠폰을 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete coupon');

      alert('쿠폰이 삭제되었습니다.');
      fetchCoupons();
    } catch (error) {
      console.error('Failed to delete coupon:', error);
      alert('쿠폰 삭제에 실패했습니다.');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minPurchaseAmount: coupon.minPurchaseAmount.toString(),
      maxDiscountAmount: coupon.maxDiscountAmount.toString(),
      usageLimit: coupon.usageLimit.toString(),
      userUsageLimit: coupon.userUsageLimit.toString(),
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      applicableProducts: coupon.applicableProducts,
      isActive: coupon.isActive
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minPurchaseAmount: "0",
      maxDiscountAmount: "0",
      usageLimit: "-1",
      userUsageLimit: "1",
      validFrom: "",
      validUntil: "",
      applicableProducts: "",
      isActive: 1
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDiscount = (type: string, value: number) => {
    return type === 'percentage' ? `${value}%` : `${value.toLocaleString()}원`;
  };

  if (loading && coupons.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Ticket className="w-8 h-8" />
            쿠폰 관리
          </h1>
          <p className="text-gray-600">쇼핑몰 할인 쿠폰을 생성하고 관리합니다</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          새 쿠폰 추가
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">전체 쿠폰</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}개</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">활성 쿠폰</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {coupons.filter(c => c.isActive).length}개
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 사용 횟수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {coupons.reduce((sum, c) => sum + c.usageCount, 0)}회
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">만료 예정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {coupons.filter(c => {
                const until = new Date(c.validUntil);
                const now = new Date();
                const diffDays = (until.getTime() - now.getTime()) / (1000 * 3600 * 24);
                return diffDays > 0 && diffDays <= 7;
              }).length}개
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 쿠폰 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => {
          const isExpired = new Date(coupon.validUntil) < new Date();
          const isLimitReached = coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit;
          
          return (
            <Card key={coupon.id} className={`${!coupon.isActive || isExpired || isLimitReached ? 'opacity-50' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{coupon.name}</CardTitle>
                    <CardDescription className="mt-1">{coupon.description}</CardDescription>
                  </div>
                  {coupon.isActive && !isExpired && !isLimitReached && (
                    <Badge variant="default" className="bg-green-500">활성</Badge>
                  )}
                  {isExpired && <Badge variant="secondary">만료</Badge>}
                  {isLimitReached && <Badge variant="secondary">소진</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* 쿠폰 코드 */}
                  <div 
                    className="flex items-center justify-between p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200"
                    onClick={() => copyToClipboard(coupon.code)}
                  >
                    <code className="font-mono text-lg font-bold">{coupon.code}</code>
                    {copiedCode === coupon.code ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </div>

                  {/* 할인 정보 */}
                  <div className="flex items-center gap-2 text-2xl font-bold text-blue-600">
                    <DollarSign className="w-6 h-6" />
                    {formatDiscount(coupon.discountType, coupon.discountValue)} 할인
                  </div>

                  {/* 상세 정보 */}
                  <div className="space-y-2 text-sm text-gray-600">
                    {coupon.minPurchaseAmount > 0 && (
                      <div>최소 구매: {coupon.minPurchaseAmount.toLocaleString()}원</div>
                    )}
                    {coupon.maxDiscountAmount > 0 && coupon.discountType === 'percentage' && (
                      <div>최대 할인: {coupon.maxDiscountAmount.toLocaleString()}원</div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(coupon.validFrom).toLocaleDateString()} ~ {new Date(coupon.validUntil).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      사용: {coupon.usageCount}회
                      {coupon.usageLimit > 0 && ` / ${coupon.usageLimit}회`}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEdit(coupon)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      수정
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(coupon.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      삭제
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {coupons.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">쿠폰이 없습니다</h3>
            <p className="text-gray-600 mb-4">새로운 할인 쿠폰을 생성해보세요</p>
            <Button onClick={() => { resetForm(); setShowModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              첫 쿠폰 만들기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 쿠폰 생성/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingCoupon ? '쿠폰 수정' : '새 쿠폰 생성'}</CardTitle>
              <CardDescription>할인 쿠폰 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 쿠폰 코드 */}
                <div>
                  <label className="block text-sm font-medium mb-1">쿠폰 코드*</label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="SUMMER2024"
                      required
                      className="flex-1"
                    />
                    <Button type="button" onClick={generateCouponCode}>
                      자동 생성
                    </Button>
                  </div>
                </div>

                {/* 쿠폰 이름 */}
                <div>
                  <label className="block text-sm font-medium mb-1">쿠폰 이름*</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="여름 특별 할인"
                    required
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-medium mb-1">설명</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="쿠폰에 대한 설명을 입력하세요"
                    rows={2}
                  />
                </div>

                {/* 할인 유형 및 값 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">할인 유형*</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="percentage">퍼센트 할인 (%)</option>
                      <option value="fixed">고정 금액 할인 (원)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">할인 값*</label>
                    <Input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      placeholder={formData.discountType === 'percentage' ? '10' : '5000'}
                      required
                    />
                  </div>
                </div>

                {/* 최소 구매 금액 및 최대 할인 금액 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">최소 구매 금액 (원)</label>
                    <Input
                      type="number"
                      value={formData.minPurchaseAmount}
                      onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">최대 할인 금액 (원)</label>
                    <Input
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      placeholder="0 (무제한)"
                    />
                  </div>
                </div>

                {/* 사용 제한 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">전체 사용 제한</label>
                    <Input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      placeholder="-1 (무제한)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">1인당 사용 제한</label>
                    <Input
                      type="number"
                      value={formData.userUsageLimit}
                      onChange={(e) => setFormData({ ...formData, userUsageLimit: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                </div>

                {/* 유효 기간 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">시작일*</label>
                    <Input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">종료일*</label>
                    <Input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* 활성 상태 */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive === 1}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium">쿠폰 활성화</label>
                </div>

                {/* 버튼 */}
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? '처리 중...' : (editingCoupon ? '수정하기' : '생성하기')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => { setShowModal(false); resetForm(); }}
                  >
                    취소
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
