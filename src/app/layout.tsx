import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/components/Providers";
import { PageWrapper } from "@/components/PageWrapper";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinTech App",
  description: "Modern personal finance management app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased min-h-screen bg-[#111318] text-[#e2e2e8] selection:bg-[#00daf3] selection:text-[#001f24]`}
      >
        <NextAuthProvider>
          <PageWrapper>
            {children}
          </PageWrapper>
        </NextAuthProvider>
      </body>
    </html>
  );
}
