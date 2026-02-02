import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SuperPlace - 학원 관리 시스템",
  description: "학원 관리를 위한 통합 솔루션",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
