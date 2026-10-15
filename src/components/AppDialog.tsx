"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/i18n";

type DialogState =
  | { kind: "alert"; msg: string; resolve: () => void }
  | { kind: "confirm"; msg: string; resolve: (v: boolean) => void }
  | null;

let setDialogState: ((d: DialogState) => void) | null = null;

// In-app message sent by the app itself (never the browser)
export function appAlert(msg: string): Promise<void> {
  return new Promise((resolve) => {
    if (setDialogState) setDialogState({ kind: "alert", msg, resolve });
    else { console.warn(msg); resolve(); }
  });
}

// In-app confirmation sent by the app itself (never the browser)
export function appConfirm(msg: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (setDialogState) setDialogState({ kind: "confirm", msg, resolve: (v: boolean) => resolve(v) });
    else resolve(false);
  });
}

export default function AppDialog() {
  const { t } = useApp();
  const [dlg, setDlg] = useState<DialogState>(null);

  useEffect(() => {
    setDialogState = setDlg;
    return () => { setDialogState = null; };
  }, []);

  if (!dlg) return null;

  const close = (v: boolean) => {
    const d = dlg;
    setDlg(null);
    if (d.kind === "alert") d.resolve();
    else d.resolve(v);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center" onClick={() => close(false)}>
      <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up" onClick={(e) => e.stopPropagation()}>
        <p className="text-2xl text-center mb-2">{dlg.kind === "alert" ? "⚠️" : "❓"}</p>
        <p className="text-center text-gray-800 text-sm font-medium leading-relaxed whitespace-pre-line">{dlg.msg}</p>
        {dlg.kind === "alert" ? (
          <button onClick={() => close(true)} className="w-full mt-4 bg-green-600 text-white py-3 rounded-xl font-bold">
            {t("c_ok")}
          </button>
        ) : (
          <div className="flex gap-2 mt-4">
            <button onClick={() => close(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">
              {t("common_cancel")}
            </button>
            <button onClick={() => close(true)} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold">
              {t("c_confirm")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
