"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, CreditCard, Users, Calendar, Upload } from "lucide-react";

interface PurchaseDialogProps {
  open: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    pricePerStudent: number;
  };
}

export default function BotPurchaseDialog({ open, onClose, product }: PurchaseDialogProps) {
  const [studentCount, setStudentCount] = useState<number>(10);
  const [months, setMonths] = useState<number>(1);
  const [depositBank, setDepositBank] = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const totalPrice = studentCount * months * product.pricePerStudent;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (studentCount < 1) {
      alert("학생 수는 최소 1명 이상이어야 합니다.");
      return;
    }

    if (months < 1) {
      alert("개월 수는 최소 1개월 이상이어야 합니다.");
      return;
    }

    if (!depositBank || !depositorName) {
      alert("입금 은행과 입금자명을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      // 파일 업로드 (있을 경우)
      let attachmentUrl = "";
      if (attachmentFile) {
        const formData = new FormData();
        formData.append("file", attachmentFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          attachmentUrl = uploadData.url;
        }
      }

      // 구매 신청 제출
      const token = localStorage.getItem("token");
      const response = await fetch("/api/bot-purchase-requests/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          studentCount,
          months,
          pricePerStudent: product.pricePerStudent,
          totalPrice,
          depositBank,
          depositorName,
          attachmentUrl,
          requestMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "구매 신청에 실패했습니다.");
      }

      alert(`구매 신청이 완료되었습니다!\n\n총 금액: ${totalPrice.toLocaleString()}원\n관리자 승인 후 사용 가능합니다.`);
      
      // 초기화
      setStudentCount(10);
      setMonths(1);
      setDepositBank("");
      setDepositorName("");
      setAttachmentFile(null);
      setRequestMessage("");
      onClose();
    } catch (error: any) {
      console.error("구매 신청 실패:", error);
      alert(error.message || "구매 신청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">AI 봇 구매 신청</DialogTitle>
          <DialogDescription>
            {product.name} - 학생당 {product.pricePerStudent.toLocaleString()}원/월
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 학생 수 및 개월 수 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="studentCount" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                학생 수
              </Label>
              <Input
                id="studentCount"
                type="number"
                min="1"
                value={studentCount}
                onChange={(e) => setStudentCount(Number(e.target.value))}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">최소 1명</p>
            </div>

            <div>
              <Label htmlFor="months" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                개월 수
              </Label>
              <Input
                id="months"
                type="number"
                min="1"
                max="12"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">최소 1개월, 최대 12개월</p>
            </div>
          </div>

          {/* 총 금액 계산 */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">총 금액 계산</h3>
            </div>
            <div className="space-y-1 text-sm text-gray-700">
              <p>학생 수: {studentCount}명</p>
              <p>개월 수: {months}개월</p>
              <p>학생당 월 가격: {product.pricePerStudent.toLocaleString()}원</p>
              <div className="border-t border-blue-200 my-2 pt-2">
                <p className="text-lg font-bold text-blue-600">
                  총 금액: {totalPrice.toLocaleString()}원
                </p>
                <p className="text-xs text-gray-600">
                  ({studentCount} × {months} × {product.pricePerStudent.toLocaleString()})
                </p>
              </div>
            </div>
          </div>

          {/* 입금 정보 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <h3 className="font-semibold">입금 정보</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="depositBank">입금 은행</Label>
                <Input
                  id="depositBank"
                  value={depositBank}
                  onChange={(e) => setDepositBank(e.target.value)}
                  placeholder="예: 국민은행"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="depositorName">입금자명</Label>
                <Input
                  id="depositorName"
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="mt-2"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="attachment" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                입금 증빙 (선택)
              </Label>
              <Input
                id="attachment"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="mt-2"
              />
              {attachmentFile && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ {attachmentFile.name}
                </p>
              )}
            </div>
          </div>

          {/* 신청 메시지 */}
          <div>
            <Label htmlFor="requestMessage">신청 메시지 (선택)</Label>
            <Textarea
              id="requestMessage"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="관리자에게 전달할 메시지를 입력하세요..."
              rows={3}
              className="mt-2"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "신청 중..." : `${totalPrice.toLocaleString()}원 구매 신청`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
