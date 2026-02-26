"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Star } from "lucide-react";
import BotPurchaseDialog from "@/components/BotPurchaseDialog";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  pricePerStudent?: number;
  category: string;
  imageUrl: string;
  keywords: string[];
  featured?: boolean;
}

interface ProductDetailDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onPurchase?: () => void;
}

export default function ProductDetailDialog({ open, onClose, product, onPurchase }: ProductDetailDialogProps) {
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'detail' | 'reviews' | 'qna'>('detail');

  if (!product) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {/* Header */}
          <div className="sticky top-0 z-50 bg-white border-b p-4">
            <DialogHeader>
              <DialogTitle className="text-2xl">{product.name}</DialogTitle>
            </DialogHeader>
          </div>

          {/* Product Image */}
          <div className="relative w-full bg-gray-100">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-80 object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = 'https://placehold.co/800x600/e2e8f0/94a3b8?text=No+Image';
              }}
            />
          </div>

          {/* Product Info */}
          <div className="p-6">
            {/* Category */}
            <div className="text-sm text-gray-500 mb-2">{product.category}</div>

            {/* Price */}
            <div className="text-3xl font-bold text-blue-600 mb-4">{product.price}</div>

            {/* Description */}
            <p className="text-gray-700 leading-relaxed mb-6">{product.description}</p>

            {/* Keywords */}
            {product.keywords && product.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    #{keyword}
                  </span>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="border-b mb-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('detail')}
                  className={`py-2 px-4 font-medium transition-colors ${
                    activeTab === 'detail'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  상세 정보
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`py-2 px-4 font-medium transition-colors ${
                    activeTab === 'reviews'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  리뷰
                </button>
                <button
                  onClick={() => setActiveTab('qna')}
                  className={`py-2 px-4 font-medium transition-colors ${
                    activeTab === 'qna'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  문의
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'detail' && (
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-bold mb-3">제품 특징</h3>
                <p className="text-gray-700">{product.description}</p>
                <ul className="mt-4 space-y-2">
                  <li>✓ AI 기반 자동화 솔루션</li>
                  <li>✓ 24시간 언제든지 사용 가능</li>
                  <li>✓ 학생별 맞춤 관리</li>
                  <li>✓ 실시간 데이터 분석</li>
                </ul>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="text-center py-8 text-gray-500">
                <p>아직 등록된 리뷰가 없습니다.</p>
                <p className="text-sm mt-2">첫 번째 리뷰를 남겨보세요!</p>
              </div>
            )}

            {activeTab === 'qna' && (
              <div className="text-center py-8 text-gray-500">
                <p>문의사항이 있으시면</p>
                <p className="text-sm mt-2">
                  <a href="https://geru.kr/ln/40582" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    고객센터
                  </a>
                  로 연락주세요.
                </p>
              </div>
            )}
          </div>

          {/* Footer with Purchase Button */}
          <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              닫기
            </Button>
            <Button
              onClick={() => {
                if (product.pricePerStudent && product.pricePerStudent > 0) {
                  setPurchaseDialogOpen(true);
                } else {
                  alert('이 제품은 현재 구매 신청이 불가능합니다. 관리자에게 문의하세요.');
                }
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              구매하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      {product.pricePerStudent && product.pricePerStudent > 0 && (
        <BotPurchaseDialog
          open={purchaseDialogOpen}
          onClose={() => setPurchaseDialogOpen(false)}
          product={{
            id: product.id,
            name: product.name,
            pricePerStudent: product.pricePerStudent
          }}
        />
      )}
    </>
  );
}
