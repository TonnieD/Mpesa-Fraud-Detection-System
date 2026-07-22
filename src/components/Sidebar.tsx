"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Files, 
  Info, 
  Menu, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function Sidebar({ onCollapseChange }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (onCollapseChange) {
      onCollapseChange(nextState);
    }
  };

  const navItems = [
    {
      name: "About",
      href: "/",
      icon: Info,
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Single Prediction",
      href: "/single-prediction",
      icon: ShieldCheck,
    },
    {
      name: "Batch Prediction",
      href: "/batch-prediction",
      icon: Files,
    },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-[#0D1F0D] text-white flex flex-col justify-between border-r border-[#1B5E20]/30 transition-all duration-300 z-50
        ${isCollapsed ? "w-16 md:w-20" : "w-16 md:w-64"}
      `}
    >
      <div className="flex flex-col flex-1">
        {/* Header/Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1B5E20]/20">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-lg bg-[#4CAF50] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-6 w-6 text-[#0D1F0D]" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-sm md:text-base text-[#4CAF50] tracking-tight whitespace-nowrap hidden md:inline">
                M-Pesa Fraud Ops
              </span>
            )}
          </div>
          
          {/* Desktop Toggle Button */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex h-6 w-6 rounded-full bg-[#1B5E20]/40 border border-[#4CAF50]/30 items-center justify-center hover:bg-[#4CAF50]/20 text-[#4CAF50] transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === "/" && pathname === "/about");

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${isActive 
                    ? "bg-[#4CAF50] text-[#0D1F0D]" 
                    : "text-gray-400 hover:bg-[#1B5E20]/20 hover:text-[#4CAF50]"
                  }
                `}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105
                  ${isActive ? "text-[#0D1F0D]" : "text-gray-400 group-hover:text-[#4CAF50]"}
                `} />
                <span 
                  className={`transition-all duration-300 hidden md:inline
                    ${isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"}
                  `}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding */}
      <div className="p-4 border-t border-[#1B5E20]/20 overflow-hidden">
        {!isCollapsed ? (
          <div className="hidden md:block">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Powered by</p>
            <p className="text-sm text-[#4CAF50] font-semibold whitespace-nowrap">Safaricom ML Engine</p>
          </div>
        ) : (
          <div className="hidden md:flex justify-center">
            <div className="h-2 w-2 rounded-full bg-[#4CAF50] animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}
