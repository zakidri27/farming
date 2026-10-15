"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TopBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: string;
  };
}

export default function TopBar({ title, subtitle, showBack, action }: TopBarProps) {
  const router = useRouter();

  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-base font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label="الإعدادات"
        >
          ⚙️
        </Link>
        {action && (
          action.href ? (
            <Link
              href={action.href}
              className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              {action.icon && <span>{action.icon}</span>}
              <span>{action.label}</span>
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              {action.icon && <span>{action.icon}</span>}
              <span>{action.label}</span>
            </button>
          )
        )}
        </div>
      </div>
    </div>
  );
}
