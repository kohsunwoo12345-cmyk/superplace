import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TossPaymentService } from "@/services/payment";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { paymentKey, orderId, amount } = await req.json();

    // Confirm payment with Toss
    const paymentResult = await TossPaymentService.confirmPayment({
      paymentKey,
      orderId,
      amount,
    });

    // Update payment record
    const payment = await prisma.payment.update({
      where: { orderId },
      data: {
        status: "COMPLETED",
        transactionId: paymentKey,
      },
    });

    // Create or update subscription
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        planType: getPlanTypeFromAmount(amount),
        status: "ACTIVE",
        startDate: new Date(),
        endDate,
        autoRenew: true,
      },
    });

    // Update payment with subscription ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        subscriptionId: subscription.id,
      },
    });

    return NextResponse.json({
      success: true,
      payment: paymentResult,
      subscription,
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { error: "결제 확인에 실패했습니다" },
      { status: 500 }
    );
  }
}

function getPlanTypeFromAmount(amount: number): "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE" {
  if (amount === 29000) return "BASIC";
  if (amount === 49000) return "PREMIUM";
  if (amount > 49000) return "ENTERPRISE";
  return "FREE";
}
