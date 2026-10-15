"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { useApp, Lang } from "@/lib/i18n";
import { appAlert, appConfirm } from "@/components/AppDialog";
import { resetAllData } from "@/lib/offline-api";

export default function SettingsPage() {
  const { lang, setLang, theme, toggleTheme, t } = useApp();
  const router = useRouter();

  const handleWipe = async () => {
    const ok = await appConfirm(t("settings_wipe_confirm"));
    if (!ok) return;
    try {
      await resetAllData();
      await appAlert(t("settings_wipe_done"));
      router.replace("/");
    } catch (e) {
      await appAlert(`${t("settings_wipe_fail")} ${String(e)}`);
    }
  };

  const langs: { v: Lang; label: string }[] = [
    { v: "ar", label: "🇩🇿 العربية" },
    { v: "en", label: "🇬🇧 English" },
    { v: "fr", label: "🇫🇷 Français" },
  ];

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title={t("settings_title")} subtitle={t("settings_sub")} />

      <div className="px-4 py-3 space-y-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-bold text-gray-800 text-sm mb-3">{t("settings_lang")}</p>
          <div className="flex gap-2">
            {langs.map((l) => (
              <button
                key={l.v}
                onClick={() => setLang(l.v)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${lang === l.v ? "bg-green-600 text-white" : "bg-gray-50 border border-gray-200 text-gray-600"}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-bold text-gray-800 text-sm mb-3">{t("settings_theme")}</p>
          <button
            onClick={toggleTheme}
            className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${theme === "dark" ? "bg-gray-800 text-yellow-300" : "bg-amber-100 text-amber-800"}`}
          >
            {theme === "dark" ? t("theme_dark") + " ✓" : t("theme_light")}
            <span className="text-xs opacity-70">({t("theme_light")} / {t("theme_dark")})</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-bold text-gray-800 text-sm">{t("settings_backup")}</p>
          <p className="text-xs text-gray-500 mt-1 mb-3">{t("settings_backup_desc")}</p>
          <Link href="/backup" className="block text-center bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium">{t("settings_open")}</Link>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-red-200">
          <p className="font-bold text-red-700 text-sm">{t("settings_wipe")}</p>
          <p className="text-xs text-gray-500 mt-1 mb-3">{t("settings_wipe_desc")}</p>
          <button
            onClick={handleWipe}
            className="block w-full text-center bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium"
          >
            {t("settings_wipe_btn")}
          </button>
        </div>
      </div>
    </div>
  );
}
