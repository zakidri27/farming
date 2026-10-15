"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp, TKey } from "@/lib/i18n";

interface NavItem {
  href: string;
  key: TKey;
  icon: string;
  color: string;
}

const navItems: NavItem[] = [
  { href: "/", key: "nav_dashboard", icon: "🏠", color: "bg-green-500" },
  { href: "/animals", key: "nav_animals", icon: "🐄", color: "bg-green-600" },
  { href: "/feed", key: "nav_feed", icon: "🌾", color: "bg-yellow-600" },
  { href: "/purchases", key: "nav_purchases", icon: "🛒", color: "bg-blue-500" },
  { href: "/births", key: "nav_births", icon: "🍼", color: "bg-pink-400" },
  { href: "/health", key: "nav_health", icon: "🏥", color: "bg-pink-500" },
  { href: "/production", key: "nav_production", icon: "🥛", color: "bg-orange-400" },
  { href: "/sales", key: "nav_sales", icon: "💵", color: "bg-emerald-500" },
  { href: "/treasury", key: "nav_treasury", icon: "🏦", color: "bg-amber-500" },
  { href: "/expenses", key: "nav_expenses", icon: "💸", color: "bg-red-500" },
  { href: "/reports", key: "nav_reports", icon: "📑", color: "bg-cyan-500" },
  { href: "/contacts", key: "nav_contacts", icon: "👥", color: "bg-purple-500" },
  { href: "/tracking", key: "nav_tracking", icon: "🔍", color: "bg-indigo-500" },
  { href: "/records", key: "nav_records", icon: "📦", color: "bg-stone-500" },
  { href: "/settings", key: "nav_settings", icon: "⚙️", color: "bg-gray-500" },
  { href: "/backup", key: "nav_backup", icon: "💾", color: "bg-slate-500" },
];

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { t } = useApp();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // === الموبايل: قائمة منبثقة ===
  if (isMobile) {
    return (
      <div className="lg:hidden fixed top-0 right-0 w-80 h-full bg-white z-50 shadow-2xl overflow-y-auto">
        {/* رأس القائمة */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-xl">
              🌿
            </div>
            <div>
              <h2 className="font-bold text-lg">مزرعتي</h2>
              <p className="text-green-100 text-xs">إدارة المزرعة المتكاملة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* قائمة التنقل */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-green-50 text-green-700 font-semibold shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                    active ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  {item.icon}
                </div>
                <span className="text-sm">{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  // === سطح المكتب: قائمة جانبية ثابتة ===
  return (
    <aside className="hidden lg:flex lg:flex-col w-72 bg-white border-l border-gray-200 h-screen fixed right-0 top-0 z-40 shadow-sm">
      {/* رأس القائمة */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-5 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-xl">
          🌿
        </div>
        <div>
          <h2 className="font-bold text-lg">مزرعتي</h2>
          <p className="text-green-100 text-xs">إدارة المزرعة المتكاملة</p>
        </div>
      </div>

      {/* قائمة التنقل */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                active
                  ? "bg-green-50 text-green-700 font-semibold shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-all ${
                  active ? "bg-green-100" : "bg-gray-100 group-hover:bg-gray-200"
                }`}
              >
                {item.icon}
              </div>
              <span className="text-sm">{t(item.key)}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-600" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
