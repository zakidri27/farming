"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";

interface Settings {
  farmName?: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  currency?: string;
  taxNumber?: string;
}

const menuItems = [
  { label: "الحيوانات", href: "/animals", icon: "🐄", color: "bg-green-100 text-green-600" },
  { label: "المشتريات", href: "/purchases", icon: "🛒", color: "bg-blue-100 text-blue-600" },
  { label: "المبيعات", href: "/sales", icon: "💵", color: "bg-emerald-100 text-emerald-600" },
  { label: "المصاريف", href: "/expenses", icon: "💸", color: "bg-red-100 text-red-600" },
  { label: "المداخيل", href: "/incomes", icon: "📈", color: "bg-teal-100 text-teal-600" },
  { label: "الخزينة", href: "/treasury", icon: "🏦", color: "bg-amber-100 text-amber-600" },
  { label: "العلف", href: "/feed", icon: "🌾", color: "bg-yellow-100 text-yellow-600" },
  { label: "الصحة والبيطرة", href: "/health", icon: "🏥", color: "bg-pink-100 text-pink-600" },
  { label: "العملاء والموردون", href: "/contacts", icon: "👥", color: "bg-purple-100 text-purple-600" },
  { label: "الديون", href: "/debts", icon: "📋", color: "bg-orange-100 text-orange-600" },
  { label: "الأرباح والخسائر", href: "/profits", icon: "📊", color: "bg-indigo-100 text-indigo-600" },
  { label: "التقارير", href: "/reports", icon: "📑", color: "bg-cyan-100 text-cyan-600" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    farmName: "مزرعتي",
    ownerName: "",
    phone: "",
    address: "",
    currency: "دج",
    taxNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings((prev) => ({ ...prev, ...data }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("حدث خطأ في الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title="الإعدادات" subtitle="إعدادات المزرعة" />

      <div className="px-4 py-3 space-y-4">
        {/* Farm Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 gradient-green rounded-2xl flex items-center justify-center text-4xl">
              🌿
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{settings.farmName || "مزرعتي"}</h2>
              <p className="text-sm text-gray-500">{settings.ownerName || "مالك المزرعة"}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">اسم المزرعة</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                value={settings.farmName || ""}
                onChange={(e) => setSettings({ ...settings, farmName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">اسم المالك</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                value={settings.ownerName || ""}
                onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">رقم الهاتف</label>
              <input
                type="tel"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                value={settings.phone || ""}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">العنوان</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                value={settings.address || ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">العملة</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                value={settings.currency || "دج"}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              >
                <option value="دج">دج - دينار جزائري</option>
                <option value="MAD">درهم مغربي</option>
                <option value="TND">دينار تونسي</option>
                <option value="EGP">جنيه مصري</option>
                <option value="SAR">ريال سعودي</option>
                <option value="USD">دولار أمريكي</option>
                <option value="EUR">يورو</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">رقم السجل الضريبي</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                value={settings.taxNumber || ""}
                onChange={(e) => setSettings({ ...settings, taxNumber: e.target.value })}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full mt-4 py-3 rounded-xl font-bold transition-all ${saved ? "bg-green-500 text-white" : "bg-green-600 text-white"} disabled:opacity-50`}
          >
            {saving ? "جاري الحفظ..." : saved ? "✅ تم الحفظ!" : "💾 حفظ الإعدادات"}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">📱 قائمة التطبيق</h3>
          <div className="grid grid-cols-2 gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 p-3 rounded-xl ${item.color} card-hover`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">ℹ️ معلومات التطبيق</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>اسم التطبيق</span>
              <span className="font-medium text-gray-900">🌿 مزرعتي</span>
            </div>
            <div className="flex justify-between">
              <span>الإصدار</span>
              <span className="font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>الحيوانات المدعومة</span>
              <span className="font-medium text-gray-900">أبقار، ماعز، أغنام، دجاج، سمان</span>
            </div>
            <div className="flex justify-between">
              <span>اللغة</span>
              <span className="font-medium text-gray-900">العربية</span>
            </div>
          </div>
        </div>

        {/* Animal Types */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">🐾 أنواع الحيوانات</h3>
          <div className="grid grid-cols-5 gap-2">
            {[
              { emoji: "🐄", label: "أبقار" },
              { emoji: "🐐", label: "ماعز" },
              { emoji: "🐑", label: "أغنام" },
              { emoji: "🐔", label: "دجاج" },
              { emoji: "🦅", label: "سمان" },
            ].map((a) => (
              <div key={a.label} className="flex flex-col items-center bg-green-50 rounded-xl p-2">
                <span className="text-2xl">{a.emoji}</span>
                <span className="text-xs text-gray-600 mt-1">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
