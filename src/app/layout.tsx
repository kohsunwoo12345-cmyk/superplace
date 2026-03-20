import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "슈퍼플레이스 스터디",
  description: "체계적인 학습 관리로 성적 향상을 실현하는 스마트 학습 관리 시스템",
  keywords: ["학원", "학습 관리", "온라인 교육", "성적 관리", "과제 제출", "학습 자료", "슈퍼플레이스"],
  authors: [{ name: "SUPER PLACE" }],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo-suplace.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  verification: {
    google: "rAfiAnVUcei580-5s7tP3ixaDc8FTGJyt_DTQpe47h8",
    other: {
      "naver-site-verification": "6817ba67ed17ecfd7f621742b503a0b5cff117cf",
    },
  },
  openGraph: {
    title: "슈퍼플레이스 스터디",
    description: "체계적인 학습 관리로 성적 향상을 실현하는 스마트 학습 관리 시스템",
    url: "https://superplacestudy.pages.dev",
    siteName: "슈퍼플레이스 스터디",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/thumbnail-default.png",
        width: 1024,
        height: 576,
        alt: "슈퍼플레이스 스터디 - 학원 AI 자동화 시스템",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "슈퍼플레이스 스터디",
    description: "체계적인 학습 관리로 성적 향상을 실현하는 스마트 학습 관리 시스템",
    images: ["/thumbnail-default.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://superplacestudy.pages.dev"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
