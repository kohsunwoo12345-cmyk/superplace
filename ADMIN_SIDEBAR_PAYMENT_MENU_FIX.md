# 관리자 사이드바 결제 승인 메뉴 추가

## 📋 문제점
- 관리자(ADMIN) 역할로 로그인했을 때 왼쪽 사이드바에 "결제 승인" 메뉴가 표시되지 않음
- `navigationByRole` 객체에 `ADMIN` 역할에 대한 정의가 없었음
- `SUPER_ADMIN` 역할만 정의되어 있어 `ADMIN` 역할은 기본값(`STUDENT`)으로 처리됨

## 🔧 해결 방법
`src/components/dashboard/Sidebar.tsx` 파일에 `ADMIN` 역할에 대한 네비게이션 메뉴 추가

### 변경 내용
```typescript
const navigationByRole = {
  SUPER_ADMIN: [
    // ... 기존 메뉴들 ...
    { name: "결제 승인", href: "/dashboard/admin/payment-approvals", icon: CreditCard },
    // ... 나머지 메뉴들 ...
  ],
  ADMIN: [  // ✨ 새로 추가
    { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
    { name: "사용자 관리", href: "/dashboard/admin/users", icon: Users },
    { name: "학원 관리", href: "/dashboard/admin/academies", icon: Building2 },
    { name: "학생 관리", href: "/dashboard/students", icon: GraduationCap },
    { name: "반 배정", href: "/dashboard/classes", icon: GraduationCap },
    { name: "학습 기록", href: "/dashboard/learning-records", icon: BookOpen },
    { name: "출석 통계", href: "/dashboard/attendance-statistics", icon: Calendar },
    { name: "Cloudflare 동기화", href: "/dashboard/sync", icon: Cloud },
    { name: "요금제 관리", href: "/dashboard/admin/pricing", icon: CreditCard },
    { name: "결제 승인", href: "/dashboard/admin/payment-approvals", icon: CreditCard },
    { name: "매출 관리", href: "/dashboard/admin/revenue", icon: DollarSign },
    { name: "통합 AI 봇 관리", href: "/dashboard/admin/bots-unified", icon: Bot },
    { name: "AI 봇", href: "/dashboard/ai-gems", icon: Sparkles },
    { name: "꾸메땅 AI 봇", href: "/dashboard/ai-bot-ggumettang", icon: BookOpen },
    { name: "접속자 분석", href: "/dashboard/admin/access-analytics", icon: Activity },
    { name: "문의 관리", href: "/dashboard/contacts", icon: MessageSquare },
    { name: "전체 통계", href: "/dashboard/stats", icon: TrendingUp },
    { name: "시스템 설정", href: "/dashboard/settings", icon: Settings },
  ],
  DIRECTOR: [
    // ... 학원장 메뉴들 (결제 승인 없음) ...
  ],
  // ...
};
```

## ✅ 결과
- **ADMIN** 역할로 로그인하면 왼쪽 사이드바에 "결제 승인" 메뉴가 표시됨
- **SUPER_ADMIN** 역할도 동일하게 "결제 승인" 메뉴 표시
- **DIRECTOR** 역할은 "결제 승인" 메뉴가 표시되지 않음 (의도된 동작)

## 🚀 배포 정보
- **Commit**: `0cfe76a` - "feat: ADMIN 역할에 결제 승인 메뉴 추가 (사이드바)"
- **배포 시간**: 2026-02-13 17:05
- **배포 URL**: https://superplacestudy.pages.dev
- **예상 반영 시간**: 2-3분 후

## 🧪 테스트 방법
1. 브라우저 강제 새로고침 (Ctrl+Shift+R / Cmd+Shift+R)
2. ADMIN 또는 SUPER_ADMIN 역할의 계정으로 로그인
3. 왼쪽 사이드바에서 "결제 승인" 메뉴 확인
4. 클릭 시 `/dashboard/admin/payment-approvals` 페이지로 이동 확인

## 📝 역할별 메뉴 표시 현황
| 역할 | 사이드바 결제 승인 메뉴 |
|------|------------------------|
| SUPER_ADMIN | ✅ 표시 |
| ADMIN | ✅ 표시 (새로 추가) |
| DIRECTOR | ❌ 미표시 |
| TEACHER | ❌ 미표시 |
| STUDENT | ❌ 미표시 |

## 📂 수정된 파일
- `src/components/dashboard/Sidebar.tsx`
