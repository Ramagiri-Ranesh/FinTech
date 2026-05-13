"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  Landmark, 
  PieChart, 
  Settings,
  LogOut,
  Menu,
  X,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Income", href: "/income", icon: Wallet },
  { name: "Expenses", href: "/expenses", icon: PieChart },
  { name: "Cards & EMI", href: "/cards", icon: CreditCard },
  { name: "Banks", href: "/banks", icon: Landmark },
  { name: "Notes", href: "/notes", icon: FileText },
  { name: "Reports", href: "/reports", icon: Settings },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (!session) return null; // Don't render if not logged in

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 w-full h-16 bg-[#111318]/80 backdrop-blur-md border-b border-[#3b494c]/30 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00e5ff] to-[#006875] flex items-center justify-center text-[#001f24] font-bold text-lg shadow-lg">
            V
          </div>
          <h2 className="text-white font-[Manrope] font-bold tracking-tight">Digital Vault</h2>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 text-[#bac9cc] hover:text-white hover:bg-[#1a1c20] rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/60 z-40" 
            onClick={() => setIsOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <nav className={`fixed left-0 top-0 h-screen w-64 bg-[#111318] md:bg-transparent md:glass-panel border-r border-[#3b494c]/30 flex flex-col pt-8 pb-6 px-4 z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00e5ff] to-[#006875] flex items-center justify-center text-[#001f24] font-bold text-xl shadow-lg">
              V
            </div>
            <div>
              <h2 className="text-white font-[Manrope] font-bold tracking-tight leading-tight">Digital Vault</h2>
              <p className="text-[#00daf3] text-[10px] font-medium tracking-wide">FINANCE MGR</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-[#bac9cc] hover:text-white rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                <div
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative overflow-hidden group ${
                    isActive 
                      ? "text-[#00e5ff] bg-[#00e5ff]/10 border border-[#00e5ff]/20" 
                      : "text-[#bac9cc] hover:text-white hover:bg-[#1a1c20]"
                  }`}
                >
                  {isActive && (
                    <motion.div layoutId="activeNavIndicator" className="absolute left-0 top-0 bottom-0 w-1 bg-[#00e5ff]" />
                  )}
                  <item.icon size={20} className={isActive ? "text-[#00e5ff]" : "text-[#bac9cc] group-hover:text-white transition-colors"} />
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {session.user && (
          <div className="mt-auto pt-6 border-t border-[#3b494c]/30">
            <div className="flex items-center gap-3 px-2 mb-6">
              <img 
                src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name}&background=1e2024&color=00e5ff`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border border-[#3b494c]"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
                <p className="text-xs text-[#849396] truncate">{session.user.email}</p>
              </div>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-3 px-3 py-2 text-[#ffb4ab] hover:text-[#ffdad6] hover:bg-[#93000a]/10 rounded-xl transition-colors text-sm font-medium"
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
