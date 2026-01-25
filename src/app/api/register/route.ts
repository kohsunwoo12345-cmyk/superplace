import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { generateUniqueStudentCode, generateUniqueStudentId } from "@/lib/student-code";

const registerSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
  name: z.string().min(2, "이름은 최소 2자 이상이어야 합니다"),
  phone: z.string().optional(),
  role: z.enum(['DIRECTOR', 'TEACHER', 'STUDENT']),
  academyName: z.string().optional(),
  academyLocation: z.string().optional(),
  academyCode: z.string().optional(),
});

// Helper function to generate a unique academy code
function generateAcademyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📝 Registration request body:", JSON.stringify(body, null, 2));
    
    const validatedData = registerSchema.parse(body);
    console.log("✅ Validation passed:", JSON.stringify(validatedData, null, 2));

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      console.log("❌ User already exists:", validatedData.email);
      return NextResponse.json(
        { error: "이미 존재하는 이메일입니다" },
        { status: 400 }
      );
    }

    console.log("🔐 Hashing password...");
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    console.log("✅ Password hashed successfully");

    // Handle different roles
    if (validatedData.role === 'DIRECTOR') {
      console.log("🏫 Creating DIRECTOR account...");
      // 학원장: 새로운 학원 생성
      if (!validatedData.academyName) {
        console.log("❌ Academy name missing");
        return NextResponse.json(
          { error: "학원 이름을 입력해주세요" },
          { status: 400 }
        );
      }

      if (!validatedData.academyLocation) {
        console.log("❌ Academy location missing");
        return NextResponse.json(
          { error: "학원 위치를 입력해주세요" },
          { status: 400 }
        );
      }

      console.log("🔑 Generating academy code...");
      // Generate unique academy code
      let academyCode = generateAcademyCode();
      let existingAcademy = await prisma.academy.findUnique({
        where: { code: academyCode }
      });

      // Regenerate if code already exists
      while (existingAcademy) {
        academyCode = generateAcademyCode();
        existingAcademy = await prisma.academy.findUnique({
          where: { code: academyCode }
        });
      }
      console.log("✅ Academy code generated:", academyCode);

      console.log("💾 Creating academy and user in transaction...");
      // Create academy and user in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const academy = await tx.academy.create({
          data: {
            name: validatedData.academyName!,
            address: validatedData.academyLocation!,
            code: academyCode,
            subscriptionPlan: 'FREE',
            maxStudents: 10,
            maxTeachers: 2,
            aiUsageLimit: 100,
          },
        });
        console.log("✅ Academy created:", academy.id);

        const user = await tx.user.create({
          data: {
            email: validatedData.email,
            name: validatedData.name,
            password: hashedPassword,
            phone: validatedData.phone,
            role: 'DIRECTOR',
            academyId: academy.id,
            approved: true, // 학원장은 자동 승인
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            approved: true,
            createdAt: true,
          },
        });
        console.log("✅ User created:", user.id);

        return { user, academy };
      });

      console.log("🎉 DIRECTOR registration successful!");
      return NextResponse.json(
        { 
          message: "학원이 생성되었습니다! 로그인하여 선생님과 학생을 초대하세요.",
          user: result.user,
          academyCode: academyCode,
          academyName: validatedData.academyName,
        },
        { status: 201 }
      );

    } else if (validatedData.role === 'TEACHER' || validatedData.role === 'STUDENT') {
      // 선생님/학생: 학원 코드로 기존 학원에 가입
      console.log(`👨‍🎓 ${validatedData.role === 'STUDENT' ? 'STUDENT' : 'TEACHER'} registration attempt...`);
      
      if (!validatedData.academyCode) {
        console.log("❌ Academy code missing");
        return NextResponse.json(
          { error: "학원 코드를 입력해주세요" },
          { status: 400 }
        );
      }

      const trimmedCode = validatedData.academyCode.trim().toUpperCase();
      console.log(`🔍 Looking for academy with code: "${validatedData.academyCode}"`);
      console.log(`   Original code length: ${validatedData.academyCode.length} characters`);
      console.log(`   Trimmed & uppercase code: "${trimmedCode}"`);
      console.log(`   Code type: ${typeof validatedData.academyCode}`);

      const academy = await prisma.academy.findUnique({
        where: { code: trimmedCode },
        include: {
          _count: {
            select: {
              users: {
                where: {
                  role: validatedData.role
                }
              }
            }
          }
        }
      });

      console.log(`🏫 Academy search result:`, academy ? `Found: ${academy.name}` : 'Not found');

      if (!academy) {
        console.log("❌ Invalid academy code");
        
        // 디버깅을 위해 모든 학원 코드 출력
        const allAcademies = await prisma.academy.findMany({
          select: { code: true, name: true }
        });
        console.log("📋 Available academy codes:", allAcademies);
        
        return NextResponse.json(
          { 
            error: "유효하지 않은 학원 코드입니다. 학원 코드를 다시 확인해주세요.",
            hint: "학원 코드는 8자리 영문 대문자와 숫자로 구성되어 있습니다."
          },
          { status: 400 }
        );
      }

      console.log(`✅ Academy found: ${academy.name} (ID: ${academy.id})`);
      console.log(`   Current ${validatedData.role} count: ${academy._count.users}`);

      // Check subscription limits
      if (validatedData.role === 'STUDENT' && academy._count.users >= academy.maxStudents) {
        return NextResponse.json(
          { error: "학원의 학생 수가 정원에 도달했습니다. 학원장에게 문의하세요." },
          { status: 400 }
        );
      }

      if (validatedData.role === 'TEACHER' && academy._count.users >= academy.maxTeachers) {
        return NextResponse.json(
          { error: "학원의 선생님 수가 정원에 도달했습니다. 학원장에게 문의하세요." },
          { status: 400 }
        );
      }

      // 학생인 경우 학번과 학생 코드 자동 생성
      let studentId = undefined;
      let studentCode = undefined;
      
      if (validatedData.role === 'STUDENT') {
        console.log('🔢 Generating student ID and code...');
        studentId = await generateUniqueStudentId(academy.id);
        studentCode = await generateUniqueStudentCode();
        console.log(`✅ Generated student ID: ${studentId}, Code: ${studentCode}`);
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          password: hashedPassword,
          phone: validatedData.phone,
          role: validatedData.role,
          academyId: academy.id,
          studentId, // 학생인 경우에만 값이 있음
          studentCode, // 학생인 경우에만 값이 있음
          approved: false, // 학원장 승인 필요
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          studentId: true,
          studentCode: true,
          approved: true,
          createdAt: true,
        },
      });

      console.log(`✅ User created: ${user.id}${validatedData.role === 'STUDENT' ? ` (학번: ${user.studentId}, 코드: ${user.studentCode})` : ''}`);

      return NextResponse.json(
        { 
          message: `${academy.name}에 가입 신청이 완료되었습니다. 학원장 승인 후 로그인하실 수 있습니다.`,
          user,
          academyName: academy.name,
          pendingApproval: true,
          ...(validatedData.role === 'STUDENT' && {
            studentId: user.studentId,
            studentCode: user.studentCode,
          }),
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: "올바르지 않은 가입 유형입니다" },
      { status: 400 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { 
        error: "회원가입 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
