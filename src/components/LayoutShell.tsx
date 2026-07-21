"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] flex">
      <Sidebar onCollapseChange={setIsCollapsed} />
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300
          ${isCollapsed ? "pl-16 md:pl-20" : "pl-16 md:pl-64"}
        `}
      >
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
