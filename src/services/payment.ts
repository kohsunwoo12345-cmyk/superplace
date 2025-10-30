// Toss Payments Integration Service

interface PaymentRequest {
  amount: number;
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail: string;
  successUrl: string;
  failUrl: string;
}

interface PaymentConfirm {
  paymentKey: string;
  orderId: string;
  amount: number;
}

const TOSS_CLIENT_KEY = process.env.TOSS_CLIENT_KEY || "";
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "";
const TOSS_API_URL = "https://api.tosspayments.com/v1";

export class TossPaymentService {
  // Initialize payment widget
  static async initializePayment(request: PaymentRequest) {
    const { amount, orderId, orderName, customerName, customerEmail, successUrl, failUrl } = request;

    return {
      clientKey: TOSS_CLIENT_KEY,
      amount,
      orderId,
      orderName,
      customerName,
      customerEmail,
      successUrl,
      failUrl,
    };
  }

  // Confirm payment after user approval
  static async confirmPayment(data: PaymentConfirm) {
    const { paymentKey, orderId, amount } = data;

    try {
      const response = await fetch(`${TOSS_API_URL}/payments/confirm`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "결제 승인에 실패했습니다");
      }

      return await response.json();
    } catch (error) {
      console.error("Payment confirmation error:", error);
      throw error;
    }
  }

  // Cancel payment
  static async cancelPayment(paymentKey: string, cancelReason: string) {
    try {
      const response = await fetch(`${TOSS_API_URL}/payments/${paymentKey}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cancelReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "결제 취소에 실패했습니다");
      }

      return await response.json();
    } catch (error) {
      console.error("Payment cancellation error:", error);
      throw error;
    }
  }

  // Get payment details
  static async getPaymentDetails(paymentKey: string) {
    try {
      const response = await fetch(`${TOSS_API_URL}/payments/${paymentKey}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64")}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "결제 정보 조회에 실패했습니다");
      }

      return await response.json();
    } catch (error) {
      console.error("Get payment details error:", error);
      throw error;
    }
  }
}

// Plan pricing
export const PLANS = {
  FREE: {
    name: "무료",
    price: 0,
    features: [
      "계정 1개",
      "기본 분석",
      "월간 리포트",
      "이메일 지원",
    ],
  },
  BASIC: {
    name: "베이직",
    price: 29000,
    features: [
      "계정 3개",
      "고급 분석",
      "주간 리포트",
      "실시간 알림",
      "이메일 지원",
    ],
  },
  PREMIUM: {
    name: "프리미엄",
    price: 49000,
    features: [
      "계정 5개",
      "고급 분석",
      "실시간 알림",
      "우선 지원",
      "API 접근",
      "커스텀 리포트",
    ],
  },
  ENTERPRISE: {
    name: "엔터프라이즈",
    price: null, // Custom pricing
    features: [
      "무제한 계정",
      "커스텀 분석",
      "전담 매니저",
      "24/7 지원",
      "맞춤 개발",
      "SLA 보장",
    ],
  },
};
