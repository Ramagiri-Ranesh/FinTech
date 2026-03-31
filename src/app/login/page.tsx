"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#111318]">
      {/* Background glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00e5ff] rounded-full blur-[120px] opacity-[0.05]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#98d0da] rounded-full blur-[100px] opacity-[0.05]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-panel p-10 rounded-2xl flex flex-col items-center shadow-[0_0_40px_-10px_rgba(0,229,255,0.15)] relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#c3f5ff] to-[#00e5ff] opacity-80" />

          {/* Logo Area */}
          <div className="w-16 h-16 rounded-2xl bg-[#1e2024] flex items-center justify-center mb-6 shadow-inner border-t border-[#3b494c]/30">
            <ShieldCheck className="w-8 h-8 text-[#00e5ff]" />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight mb-2 text-white">
            Digital Vault
          </h1>
          <p className="text-[#bac9cc] text-center mb-10 text-sm">
            Secure, intelligent wealth management. Welcome to the future of finance.
          </p>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full relative group overflow-hidden rounded-xl p-[1px]"
          >
            {/* Gradient border effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-[#00e5ff] to-[#9cf0ff] rounded-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative bg-[#1a1c20] px-6 py-4 rounded-xl flex items-center justify-center gap-3 w-full h-full">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.68 17.59V20.34H19.24C21.32 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.24 20.34L15.68 17.59C14.72 18.23 13.47 18.63 12 18.63C9.15 18.63 6.74 16.71 5.88 14.14H2.21V16.98C4.01 20.55 7.72 23 12 23Z" fill="#34A853"/>
                <path d="M5.88 14.14C5.66 13.49 5.53 12.77 5.53 12C5.53 11.23 5.66 10.51 5.88 9.86V7.02H2.21C1.47 8.5 1.05 10.19 1.05 12C1.05 13.81 1.47 15.5 2.21 16.98L5.88 14.14Z" fill="#FBBC05"/>
                <path d="M12 5.38C13.62 5.38 15.06 5.94 16.2 7.02L19.33 3.89C17.45 2.13 14.97 1 12 1C7.72 1 4.01 3.45 2.21 7.02L5.88 9.86C6.74 7.29 9.15 5.38 12 5.38Z" fill="#EA4335"/>
              </svg>
              <span className="font-medium text-white">Continue with Google</span>
              <ArrowRight className="w-5 h-5 text-[#bac9cc] ml-auto group-hover:text-white transition-colors" />
            </div>
          </motion.button>
          
          <div className="mt-8 text-center text-xs text-[#bac9cc]/60">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
