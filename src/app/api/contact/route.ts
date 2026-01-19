import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "이름은 최소 2자 이상이어야 합니다"),
  email: z.string().email("유효한 이메일을 입력해주세요"),
  phone: z.string().optional(),
  subject: z.string().min(2, "문의 유형을 입력해주세요"),
  message: z.string().min(10, "문의 내용은 최소 10자 이상이어야 합니다"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = contactSchema.parse(body);

    // Create contact in database
    const contact = await prisma.contact.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        subject: validatedData.subject,
        message: validatedData.message,
        status: "PENDING",
      },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "문의가 성공적으로 접수되었습니다",
        contact,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Contact submission error:", error);
    return NextResponse.json(
      {
        error: "문의 제출 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET: Get all contacts (for admin)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const contacts = await prisma.contact.findMany({
      where: status ? { status } : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        contacts,
        total: contacts.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get contacts error:", error);
    return NextResponse.json(
      {
        error: "문의 목록을 가져오는 중 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}
