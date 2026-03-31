"use client";

import { useSession } from "next-auth/react";
import { Navbar } from "./Navbar";

export function PageWrapper({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  
  // If loading or string unauthenticated, don't show navigation spacer
  const isAuth = status === "authenticated";

  return (
    <div className="flex bg-[#111318] min-h-screen text-[#e2e2e8]">
      <Navbar />
      <main className={`flex-1 flex w-full transition-all duration-300 ${isAuth ? 'md:ml-64 p-4 md:p-6 mt-16 md:mt-0' : 'p-0'}`}>
        <div className="w-full max-w-[1400px] mx-auto relative overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
