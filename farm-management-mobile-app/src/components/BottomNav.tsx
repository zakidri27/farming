"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "الرئيسية", icon: "🏠" },
  { href: "/animals", label: "الحيوانات", icon: "🐄" },
  { href: "/treasury", label: "الخزينة", icon: "💰" },
  { href: "/reports", label: "التقارير", icon: "📊" },
  { href: "/settings", label: "الإعدادات", icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 rounded-xl mx-0.5 transition-all duration-200 ${
                isActive
                  ? "text-green-600 bg-green-50"
                  : "text-gray-500 hover:text-green-500"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
