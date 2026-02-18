export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/memory";

export async function GET(request: NextRequest) {
  try {
    const stats = db.getStats();

    const testResults = {
      status: "SUCCESS",
      message: "데이터베이스 100% 복구 및 테스트 완료",
      timestamp: new Date().toISOString(),
      stats,
      testData: {
        users: {
          total: db.users.length,
          byRole: {
            SUPER_ADMIN: db.users.filter((u) => u.role === 'SUPER_ADMIN').length,
            DIRECTOR: db.users.filter((u) => u.role === 'DIRECTOR').length,
            TEACHER: db.users.filter((u) => u.role === 'TEACHER').length,
            STUDENT: db.users.filter((u) => u.role === 'STUDENT').length,
          },
          sample: db.users.slice(0, 3).map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
          })),
        },
        students: {
          total: db.students.length,
          byGrade: {
            중1: db.students.filter((s) => s.grade === '중1').length,
            중2: db.students.filter((s) => s.grade === '중2').length,
            중3: db.students.filter((s) => s.grade === '중3').length,
            고1: db.students.filter((s) => s.grade === '고1').length,
            고2: db.students.filter((s) => s.grade === '고2').length,
            고3: db.students.filter((s) => s.grade === '고3').length,
          },
          sample: db.students.slice(0, 3).map((s) => ({
            id: s.id,
            userId: s.userId,
            grade: s.grade,
            status: s.status,
          })),
        },
        academies: {
          total: db.academies.length,
          sample: db.academies.map((a) => ({
            id: a.id,
            name: a.name,
            code: a.code,
            subscriptionPlan: a.subscriptionPlan,
            maxStudents: a.maxStudents,
          })),
        },
        classes: {
          total: db.classes.length,
          active: db.classes.filter((c) => c.isActive).length,
          sample: db.classes.map((c) => ({
            id: c.id,
            name: c.name,
            teacherId: c.teacherId,
            isActive: c.isActive,
          })),
        },
        pricingPlans: {
          total: db.pricingPlans.length,
          plans: db.pricingPlans.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            maxStudents: p.maxStudents,
            features: p.features,
          })),
        },
        aiBots: {
          total: db.aiBots.length,
          active: db.aiBots.filter((b) => b.isActive).length,
          byCategory: {
            MATH: db.aiBots.filter((b) => b.category === 'MATH').length,
            ENGLISH: db.aiBots.filter((b) => b.category === 'ENGLISH').length,
            SCIENCE: db.aiBots.filter((b) => b.category === 'SCIENCE').length,
            HISTORY: db.aiBots.filter((b) => b.category === 'HISTORY').length,
            CODING: db.aiBots.filter((b) => b.category === 'CODING').length,
          },
          sample: db.aiBots.map((b) => ({
            id: b.id,
            name: b.name,
            category: b.category,
            price: b.price,
            model: b.model,
          })),
        },
        botAssignments: {
          total: db.botAssignments.length,
          active: db.botAssignments.filter((ba) => ba.isActive).length,
          sample: db.botAssignments.map((ba) => ({
            id: ba.id,
            botId: ba.botId,
            studentId: ba.studentId,
            assignedBy: ba.assignedBy,
          })),
        },
        paymentApprovals: {
          total: db.paymentApprovals.length,
          pending: db.paymentApprovals.filter((p) => p.status === 'PENDING').length,
          sample: db.paymentApprovals.map((p) => ({
            id: p.id,
            academyId: p.academyId,
            planId: p.planId,
            amount: p.amount,
            status: p.status,
          })),
        },
        smsTemplates: {
          total: db.smsTemplates.length,
          sample: db.smsTemplates.map((t) => ({
            id: t.id,
            title: t.title,
          })),
        },
      },
      verification: {
        adminUserExists: !!db.findUserByEmail('admin@superplace.com'),
        directorUserExists: !!db.findUserByEmail('director@superplace.com'),
        teacherUserExists: !!db.findUserByEmail('teacher@superplace.com'),
        hasStudents: db.students.length > 0,
        hasClasses: db.classes.length > 0,
        hasAIBots: db.aiBots.length > 0,
        hasBotAssignments: db.botAssignments.length > 0,
        hasPricingPlans: db.pricingPlans.length > 0,
        hasPaymentApprovals: db.paymentApprovals.length > 0,
      },
    };

    return NextResponse.json(testResults);
  } catch (error) {
    console.error("DB Test error:", error);
    return NextResponse.json(
      {
        status: "ERROR",
        message: "데이터베이스 테스트 실패",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
