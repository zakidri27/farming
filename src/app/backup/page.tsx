"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import TopBar from "@/components/TopBar";
import { appAlert, appConfirm } from "@/components/AppDialog";
import { useApp } from "@/lib/i18n";

const isNative = () => typeof Capacitor !== "undefined" && Capacitor.isNativePlatform();

export default function BackupPage() {
  const { t } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState<"json" | "excel" | "import" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const download = async (kind: "json" | "excel") => {
    setBusy(kind);
    try {
      const url = kind === "json" ? "/api/backup" : "/api/backup/excel";
      const r = await fetch(url);
      if (!r.ok) throw new Error();
      const blob = await r.blob();
      const filename = kind === "json"
        ? `farm-backup-${new Date().toISOString().slice(0, 10)}.json`
        : `farm-backup-${new Date().toISOString().slice(0, 10)}.xlsx`;
      if (isNative()) {
const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const idx = result.indexOf(",");
          resolve(idx >= 0 ? result.slice(idx + 1) : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const file = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Documents,
      });
        await Share.share({ title: filename, url: file.uri });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch { await appAlert("فشل التصدير"); } finally { setBusy(null); }
  };

  const summaryOf = (counts?: Record<string, number>) => {
    if (!counts) return "";
    const entries = Object.entries(counts);
    const tables = entries.length;
    const records = entries.reduce((s, [, v]) => s + v, 0);
    return `\nاستُعيدت ${tables} جداول (${records} سجلاً)`;
  };

  const handleImport = async (f: File) => {
    const isExcel = /\.xlsx?$/i.test(f.name);
    if (!isExcel && !/\.json$/i.test(f.name)) { await appAlert("اختر ملف JSON أو Excel"); return; }
    if (!(await appConfirm(t("backup_warn") + "\n\nتأكيد الاستيراد؟"))) return;
    setBusy("import");
    try {
      let counts: Record<string, number> | undefined;
      if (isExcel) {
        const form = new FormData();
        form.append("file", f);
        const r = await fetch("/api/backup/excel", { method: "POST", body: form });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "");
        counts = d?.counts;
      } else {
        const body = JSON.parse(await f.text());
        const r = await fetch("/api/backup", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "");
        counts = d?.counts;
      }
      await appAlert("✅ تمت استعادة البيانات بنجاح" + summaryOf(counts));
      router.replace("/");
    } catch { await appAlert("فشل الاستيراد — تأكد من الملف"); } finally { setBusy(null); }
  };

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title={t("backup_title")} subtitle={t("backup_sub")} />

      <div className="px-4 py-3 space-y-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-bold text-gray-800 text-sm mb-3">{t("backup_export")}</p>
          <button
            onClick={() => download("json")}
            disabled={busy !== null}
            className="w-full mb-2 py-3 rounded-xl text-sm font-bold bg-green-600 text-white disabled:opacity-50"
          >
            {busy === "json" ? "..." : `📄 ${t("backup_export_json")}`}
          </button>
          <button
            onClick={() => download("excel")}
            disabled={busy !== null}
            className="w-full py-3 rounded-xl text-sm font-bold bg-emerald-700 text-white disabled:opacity-50"
          >
            {busy === "excel" ? "..." : `📊 ${t("backup_export_excel")}`}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-bold text-gray-800 text-sm mb-1">{t("backup_import")}</p>
          <p className="text-xs text-gray-500 mb-3">{t("backup_import_desc")}</p>
          <input
            ref={fileRef} type="file" accept=".json,.xlsx,.xls" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy !== null}
            className="w-full py-3 rounded-xl text-sm font-bold bg-blue-600 text-white disabled:opacity-50"
          >
            {busy === "import" ? "..." : `📥 ${t("backup_import_btn")}`}
          </button>
          <p className="mt-3 text-xs text-center bg-red-50 border border-red-200 rounded-xl p-2 text-red-700">{t("backup_warn")}</p>
        </div>
      </div>
    </div>
  );
}
