"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AIBotAssignPage() {
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    
    console.log("Page loaded successfully");
  }, [router]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">AI 봇 할당 테스트</h1>
      <p className="mt-4">페이지가 정상적으로 로드되었습니다.</p>
    </div>
  );
}
