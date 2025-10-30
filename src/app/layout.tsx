import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SessionProvider from "@/components/providers/SessionProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SUPER PLACE - 마케팅 플랫폼",
  description: "통합 소셜미디어 마케팅 모니터링 및 관리 플랫폼",
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
