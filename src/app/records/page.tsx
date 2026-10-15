"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import { formatCurrency, formatDate, getAnimalLabel, getStatusLabel } from "@/lib/utils";
import { useApp } from "@/lib/i18n";
import { appAlert, appConfirm } from "@/components/AppDialog";

interface Animal {
  id: number; name: string; code: string | null; type: string;
  breed: string | null; gender: string | null; status: string;
  purchasePrice: string | null; purchaseDate: string | null;
  birthDate: string | null; updatedAt: string;
}
interface Sale { animalId: number | null; totalAmount: string; date: string; description: string; }

const typeEmoji: Record<string, string> = { cow: "🐄", sheep: "🐑", goat: "🐐", chicken: "🐔", quail: "🐦" };
const typeKeys = ["cow", "sheep", "goat", "chicken", "quail"];

const L: Record<string, Record<"ar" | "en" | "fr", string>> = {
  sub: { ar: "أرشيف المباع والنافق — خارج القطيع", en: "Archive of sold & dead — outside the herd", fr: "Archives des vendus et morts — hors troupeau" },
  dead_action: { ar: "تسجيل نفوق", en: "Record death", fr: "Enregistrer un décès" },
  archive: { ar: "الأرشيف", en: "Archive", fr: "Archives" },
  search_ph: { ar: "🔍 بحث بالاسم أو الرمز...", en: "🔍 Search by name or code...", fr: "🔍 Rechercher par nom ou code..." },
  empty: { ar: "لا توجد سجلات — الحيوان المباع يخرج من القطيع ويُحفظ هنا تلقائياً", en: "No records — a sold animal leaves the herd and is kept here automatically", fr: "Aucun registre — un animal vendu quitte le troupeau et est conservé ici automatiquement" },
  bought: { ar: "شراؤه", en: "Bought for", fr: "Acheté pour" },
  sold_price: { ar: "بيعه", en: "Sold for", fr: "Vendu pour" },
  left: { ar: "خرج", en: "Left", fr: "Sorti" },
  dead_title: { ar: "⚰️ تسجيل نفوق", en: "⚰️ Record death", fr: "⚰️ Enregistrer un décès" },
  choose: { ar: "اختر الحيوان من القطيع...", en: "Choose an animal from the herd...", fr: "Choisissez un animal du troupeau..." },
  confirm_dead: { ar: "تأكيد النفوق", en: "Confirm death", fr: "Confirmer le décès" },
  alert_choose: { ar: "اختر الحيوان", en: "Select an animal", fr: "Sélectionnez un animal" },
  confirm_msg: { ar: "تأكيد تسجيل النفوق؟ سيخرج من القطيع إلى السجلات", en: "Confirm recording the death? It will leave the herd to the records", fr: "Confirmer l'enregistrement du décès ? L'animal quittera le troupeau vers les registres" },
};

export default function RecordsPage() {
  const { lang, t } = useApp();
  const tx = (k: string) => L[k][lang] ?? L[k].ar;
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [filter, setFilter] = useState<"all" | "sold" | "dead">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDead, setShowDead] = useState(false);
  const [deadType, setDeadType] = useState("cow");
  const [deadId, setDeadId] = useState("");
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<Animal | null>(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/animals").then((r) => r.json()),
      fetch("/api/sales").then((r) => r.json()),
    ]).then(([a, s]) => {
      setAnimals(Array.isArray(a) ? a : []);
      setSales(Array.isArray(s) ? s : []);
    }).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const inactive = animals.filter((a) => a.status !== "active");
  const saleOf = (id: number) => sales.find((s) => s.animalId === id);
  const filtered = inactive.filter((a) =>
    (filter === "all" || a.status === filter) &&
    (!search || a.name.includes(search) || (a.code || "").includes(search))
  );
  const soldCount = inactive.filter((a) => a.status === "sold").length;
  const deadCount = inactive.filter((a) => a.status === "dead").length;
  const soldTotal = inactive.reduce((s, a) => s + (a.status === "sold" ? parseFloat(saleOf(a.id)?.totalAmount || "0") : 0), 0);

  const handleDead = async () => {
    if (!deadId) { await appAlert(tx("alert_choose")); return; }
    if (!(await appConfirm(tx("confirm_msg")))) return;
    setSaving(true);
    try {
      await fetch(`/api/animals/${deadId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dead" }),
      });
      setShowDead(false); setDeadId("");
      fetchAll();
    } catch { await appAlert(t("c_error")); } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title={t("nav_records")} subtitle={tx("sub")} action={{ label: tx("dead_action"), icon: "⚰️", onClick: () => setShowDead(true) }} />

      <div className="px-4 py-3 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm"><p className="text-gray-500 text-xs">{tx("archive")}</p><p className="font-bold">{inactive.length}</p></div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center"><p className="text-emerald-600 text-xs">💵 {getStatusLabel("sold", lang)} ({soldCount})</p><p className="font-bold text-emerald-800 text-sm">{formatCurrency(soldTotal)}</p></div>
          <div className="bg-gray-100 rounded-2xl p-3 text-center"><p className="text-gray-500 text-xs">⚰️ {getStatusLabel("dead", lang)}</p><p className="font-bold">{deadCount}</p></div>
        </div>

        <div className="flex gap-2">
          {[["all", `${t("c_all")} (${inactive.length})`], ["sold", `${getStatusLabel("sold", lang)} (${soldCount})`], ["dead", `${getStatusLabel("dead", lang)} (${deadCount})`]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v as typeof filter)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium ${filter === v ? "bg-gray-700 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>{l}</button>
          ))}
        </div>

        <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white" placeholder={tx("search_ph")} value={search} onChange={(e) => setSearch(e.target.value)} />

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-gray-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-500 text-sm">{tx("empty")}</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((a) => {
              const s = saleOf(a.id);
              return (
                <button key={a.id} onClick={() => setDetail(a)} className="w-full bg-white rounded-2xl p-3 shadow-sm opacity-95 text-right">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-gray-900 text-sm truncate">{a.name} <span className="text-xs text-gray-400 font-normal">{a.code}</span></p>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${a.status === "sold" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                      {a.status === "sold" ? `💵 ${getStatusLabel("sold", lang)}` : `⚰️ ${getStatusLabel("dead", lang)}`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {a.status === "sold" && s ? (
                      <>{tx("sold_price")}: <b className="text-emerald-700">{formatCurrency(s.totalAmount)}</b> • {formatDate(s.date)}</>
                    ) : (
                      <>{tx("left")}: {formatDate(a.updatedAt?.slice(0, 10) || "")}</>
                    )}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {detail && (() => {
        const s = saleOf(detail.id);
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setDetail(null)}>
            <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{detail.name} <span className="text-xs text-gray-400 font-normal">{detail.code}</span></p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {typeEmoji[detail.type] || "🐾"} {getAnimalLabel(detail.type, lang)} • {detail.breed || "—"}
                    {detail.gender ? ` • ${detail.gender === "male" ? `♂ ${t("c_male")}` : `♀ ${t("c_female")}`}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${detail.status === "sold" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                    {detail.status === "sold" ? `💵 ${getStatusLabel("sold", lang)}` : `⚰️ ${getStatusLabel("dead", lang)}`}
                  </span>
                  <button onClick={() => setDetail(null)} className="text-gray-400 text-2xl">×</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">{tx("bought")}</p>
                  <p className="text-sm font-semibold">{detail.purchasePrice ? formatCurrency(detail.purchasePrice) : "—"}</p>
                </div>
                {detail.status === "sold" && s ? (
                  <div className="bg-emerald-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-emerald-600">{tx("sold_price")}</p>
                    <p className="text-sm font-bold text-emerald-700">{formatCurrency(s.totalAmount)}</p>
                    <p className="text-xs text-gray-500">{formatDate(s.date)}</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">{tx("left")}</p>
                    <p className="text-sm font-semibold">{formatDate(detail.updatedAt?.slice(0, 10) || "")}</p>
                  </div>
                )}
                {detail.purchaseDate && (
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">{t("an_buy_date")}</p>
                    <p className="text-sm font-semibold">{formatDate(detail.purchaseDate)}</p>
                  </div>
                )}
                {detail.birthDate && (
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">{t("an_birth")}</p>
                    <p className="text-sm font-semibold">{formatDate(detail.birthDate)}</p>
                  </div>
                )}
              </div>
              {detail.status === "sold" && s?.description && (
                <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">{s.description}</p>
              )}
            </div>
          </div>
        );
      })()}

      {showDead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowDead(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{tx("dead_title")}</h2>
              <button onClick={() => setShowDead(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="flex gap-2 mb-3">
              {typeKeys.map((tp) => (
                <button key={tp} onClick={() => { setDeadType(tp); setDeadId(""); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium ${deadType === tp ? "bg-gray-700 text-white" : "bg-gray-50 border border-gray-200 text-gray-600"}`}>{typeEmoji[tp]} {getAnimalLabel(tp, lang)}</button>
              ))}
            </div>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={deadId} onChange={(e) => setDeadId(e.target.value)}>
              <option value="">{tx("choose")}</option>
              {animals.filter((a) => a.status === "active" && a.type === deadType).map((a) => (
                <option key={a.id} value={a.id}>{a.name} {a.code ? `(${a.code})` : ""}</option>
              ))}
            </select>
            <button onClick={handleDead} disabled={saving || !deadId} className="w-full mt-4 bg-gray-700 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {saving ? t("common_saving") : tx("confirm_dead")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
