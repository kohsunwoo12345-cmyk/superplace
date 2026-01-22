import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SessionProvider from "@/components/providers/SessionProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "슈퍼플레이스 스터디",
  description: "체계적인 학습 관리로 성적 향상을 실현하는 스마트 학습 관리 시스템",
  keywords: ["학원", "학습 관리", "온라인 교육", "성적 관리", "과제 제출", "학습 자료", "슈퍼플레이스"],
  authors: [{ name: "SUPER PLACE" }],
  verification: {
    other: {
      "naver-site-verification": "f0716e4a61fc6144eec195ebe09f93fe452ada21",
    },
  },
  openGraph: {
    title: "슈퍼플레이스 스터디",
    description: "체계적인 학습 관리로 성적 향상을 실현하는 스마트 학습 관리 시스템",
    url: "https://superplace-study.vercel.app",
    siteName: "슈퍼플레이스 스터디",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "슈퍼플레이스 스터디",
    description: "체계적인 학습 관리로 성적 향상을 실현하는 스마트 학습 관리 시스템",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://superplace-study.vercel.app"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
