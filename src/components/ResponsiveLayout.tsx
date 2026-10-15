"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import Sidebar from "@/components/Sidebar";
import AppDialog from "@/components/AppDialog";
import { AppProvider } from "@/lib/i18n";
import { useState } from "react";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  return (
    <AppProvider>
      <LayoutInner>{children}</LayoutInner>
    </AppProvider>
  );
}

function LayoutInner({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  return (
    <div className="min-h-screen">
      {/* القائمة الجانبية الكاملة (فقط على الشاشات الكبيرة) */}
      {!isMobile && desktopOpen && <Sidebar />}

      {/* زر إظهار/إخفاء القائمة (الشاشات الكبيرة) */}
      {!isMobile && (
        <button
          onClick={() => setDesktopOpen((v) => !v)}
          className="hidden lg:flex fixed top-4 right-4 z-[60] w-10 h-10 bg-white rounded-xl shadow-md items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="إظهار/إخفاء القائمة"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* زر القائمة المنبثقة (فقط على الموبايل) */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 right-4 z-50 w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="فتح القائمة"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* القائمة المنبثقة على الموبايل */}
      {isMobile && sidebarOpen && (
        <>
          {/* خلفية الإغلاق */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          {/* القائمة */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </>
      )}

      {/* محتوى الصفحة */}
      <main className={!isMobile && desktopOpen ? "lg:mr-72" : ""}>
        {children}
      </main>
      <AppDialog />
    </div>
  );
}
