"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // 페이지 접속 로그 기록
    const logVisitor = async () => {
      try {
        // 사용자 정보 가져오기 (있으면)
        let userEmail = "guest";
        let userId = null;
        
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            userEmail = user.email || "guest";
            userId = user.id?.toString() || null;
          } catch (e) {
            // 파싱 실패 시 guest로 처리
          }
        }

        // 페이지 타이틀 가져오기
        const pageTitle = document.title || pathname;

        // 토큰 가져오기 (있으면)
        const token = localStorage.getItem("token");

        await fetch("/api/admin/page-view-log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            user_email: userEmail,
            user_id: userId,
            page_path: pathname,
            page_title: pageTitle,
            action: "페이지 접속",
            details: `${userEmail === "guest" ? "비회원" : userEmail}이(가) ${pathname} 페이지에 접속했습니다`,
          }),
        });

        console.log(`📝 접속자 로그 기록: ${userEmail} → ${pathname}`);
      } catch (error) {
        // 로그 실패는 조용히 무시 (사용자 경험에 영향 없음)
        console.debug("접속자 로그 기록 실패:", error);
      }
    };

    // 페이지 로드 후 로그 기록
    logVisitor();
  }, [pathname]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}
