import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TossPaymentService } from "@/services/payment";
import { z } from "zod";

const paymentSchema = z.object({
  planType: z.enum(["BASIC", "PREMIUM", "ENTERPRISE"]),
  amount: z.number().positive(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { planType, amount } = paymentSchema.parse(body);

    // Generate unique order ID
    const orderId = `ORDER-${session.user.id}-${Date.now()}`;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Initialize payment
    const paymentData = await TossPaymentService.initializePayment({
      amount,
      orderId,
      orderName: `SUPER PLACE ${planType} 구독`,
      customerName: user.name || "고객",
      customerEmail: user.email,
      successUrl: `${process.env.NEXTAUTH_URL}/api/payment/success`,
      failUrl: `${process.env.NEXTAUTH_URL}/api/payment/fail`,
    });

    // Create pending payment record
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount,
        currency: "KRW",
        status: "PENDING",
        paymentMethod: "CARD",
        orderId,
        subscriptionId: "", // Will be updated after successful payment
      },
    });

    return NextResponse.json(paymentData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Payment initialization error:", error);
    return NextResponse.json(
      { error: "결제 초기화에 실패했습니다" },
      { status: 500 }
    );
  }
}
