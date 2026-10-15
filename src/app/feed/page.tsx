"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { formatDate, getTodayDate } from "@/lib/utils";
import { useApp } from "@/lib/i18n";
import { appAlert, appConfirm } from "@/components/AppDialog";

interface FeedItem {
  id: number;
  name: string;
  type: string;
  quantity: string;
  unit: string;
  unitCost: string | null;
  minQuantity: string;
  maxQuantity: string | null;
  animalType: string | null;
  notes: string | null;
}

interface FeedTransaction {
  id: number;
  date: string;
  feedName: string;
  transactionType: string;
  quantity: string;
  unit: string;
  cost: string | null;
  animalType: string | null;
  headcount: number | null;
  perHeadQty: string | null;
  notes: string | null;
  createdAt: string | null;
}

const L: Record<string, Record<"ar" | "en" | "fr", string>> = {
  feed_stock: { ar: "مخزون الغذاء", en: "Feed stock", fr: "Stock d'aliments" },
  kind: { ar: "صنف", en: "items", fr: "articles" },
  feed_now: { ar: "إطعام", en: "Feed", fr: "Nourrir" },
  buy_only: { ar: "🛒 شراء الغذاء يتم من صفحة الشراء فقط", en: "🛒 Feed can only be bought from the Purchases page", fr: "🛒 Les aliments s'achètent uniquement depuis la page Achats" },
  tab_stock: { ar: "🌾 المخزون", en: "🌾 Stock", fr: "🌾 Stock" },
  tab_tx: { ar: "📋 الحركات", en: "📋 Movements", fr: "📋 Mouvements" },
  no_stock: { ar: "لا يوجد مخزون", en: "No stock", fr: "Aucun stock" },
  capacity_btn: { ar: "⚙️ السعة", en: "⚙️ Capacity", fr: "⚙️ Capacité" },
  low_warn: { ar: "⚠️ اقترب النفاد", en: "⚠️ Running low", fr: "⚠️ Bientôt épuisé" },
  over_cap: { ar: "فوق السعة", en: "over capacity", fr: "au-dessus de la capacité" },
  cap_unset: { ar: "غير محددة — حددها بزر السعة", en: "Not set — set it with the Capacity button", fr: "Non définie — définissez-la avec le bouton Capacité" },
  cap_label: { ar: "السعة", en: "Capacity", fr: "Capacité" },
  min_label: { ar: "الحد الأدنى", en: "Minimum", fr: "Minimum" },
  tx_in: { ar: "دخول إلى", en: "Stock in:", fr: "Entrée :" },
  feed_verb: { ar: "إطعام", en: "Fed", fr: "Repas" },
  src_buy: { ar: "المصدر: شراء", en: "Source: purchase", fr: "Source : achat" },
  consumer_is: { ar: "المستهلك", en: "Consumer", fr: "Consommateur" },
  head1: { ar: "رأس", en: "head", fr: "tête" },
  headN: { ar: "رؤوس", en: "heads", fr: "têtes" },
  at_time: { ar: "الساعة", en: "at", fr: "à" },
  no_tx: { ar: "لا توجد حركات", en: "No movements", fr: "Aucun mouvement" },
  modal_title: { ar: "🌾 إطعام الحيوانات", en: "🌾 Feed animals", fr: "🌾 Nourrir les animaux" },
  choose_feed: { ar: "اختر الغذاء *", en: "Choose feed *", fr: "Choisir l'aliment *" },
  no_stock_buy: { ar: "لا يوجد مخزون — اشترِ من صفحة الشراء", en: "No stock — buy from the Purchases page", fr: "Aucun stock — achetez depuis la page Achats" },
  qty_in: { ar: "الكمية (بـ", en: "Quantity (in ", fr: "Quantité (en " },
  who_eats: { ar: "من سيستهلك الغذاء؟ *", en: "Who will consume the feed? *", fr: "Qui consommera l'aliment ? *" },
  split_on: { ar: "سيُقسم على", en: "Will be split over", fr: "Sera réparti sur" },
  no_animals: { ar: "لا توجد حيوانات نشطة من هذا النوع", en: "No active animals of this type", fr: "Aucun animal actif de ce type" },
  confirm_feed: { ar: "تأكيد الإطعام (يخصم من المخزون)", en: "Confirm feeding (deducts from stock)", fr: "Confirmer (déduit du stock)" },
  edit_title: { ar: "⚙️ سعة وتنبيه", en: "⚙️ Capacity & alert:", fr: "⚙️ Capacité et alerte :" },
  max_cap: { ar: "السعة القصوى (= 100%) *", en: "Max capacity (= 100%) *", fr: "Capacité max (= 100 %) *" },
  min_alert: { ar: "الحد الأدنى (تنبيه اقتراب النفاد) *", en: "Minimum (low-stock alert) *", fr: "Minimum (alerte de stock bas) *" },
  alert_pick: { ar: "اختر الغذاء والكمية", en: "Choose the feed and quantity", fr: "Choisissez l'aliment et la quantité" },
  alert_max: { ar: "حدد السعة القصوى (100%)", en: "Set the max capacity (100%)", fr: "Définissez la capacité max (100 %)" },
  cons_general: { ar: "عام", en: "General", fr: "Général" },
  cons_cow: { ar: "أبقار", en: "Cows", fr: "Vaches" },
  cons_goat: { ar: "ماعز", en: "Goats", fr: "Chèvres" },
  cons_sheep: { ar: "أغنام", en: "Sheep", fr: "Moutons" },
  cons_chicken: { ar: "دجاج", en: "Chickens", fr: "Poulets" },
  cons_quail: { ar: "سمان", en: "Quail", fr: "Cailles" },
  d_title: { ar: "تفاصيل الغذاء", en: "Feed details", fr: "Détails de l'aliment" },
  d_tx_title: { ar: "تفاصيل الحركة", en: "Movement details", fr: "Détails du mouvement" },
  d_type: { ar: "النوع", en: "Type", fr: "Type" },
  d_unit_price: { ar: "سعر الوحدة", en: "Unit price", fr: "Prix unitaire" },
  d_notes: { ar: "ملاحظات", en: "Notes", fr: "Notes" },
  d_date: { ar: "التاريخ", en: "Date", fr: "Date" },
  d_qty: { ar: "الكمية", en: "Quantity", fr: "Quantité" },
  d_cost: { ar: "التكلفة", en: "Cost", fr: "Coût" },
  d_animal: { ar: "الحيوان", en: "Animal", fr: "Animal" },
  d_close: { ar: "إغلاق", en: "Close", fr: "Fermer" },
};

export default function FeedPage() {
  const { lang, t } = useApp();
  const tx = (k: string) => L[k][lang] ?? L[k].ar;
  const [stock, setStock] = useState<FeedItem[]>([]);
  const [transactions, setTransactions] = useState<FeedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stock" | "transactions">("stock");
  const [showFeed, setShowFeed] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [detailStock, setDetailStock] = useState<FeedItem | null>(null);
  const [detailTx, setDetailTx] = useState<FeedTransaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [txForm, setTxForm] = useState({ date: getTodayDate(), feedId: "", feedName: "", unit: "كغ", quantity: "", animalType: "", notes: "" });
  const [herd, setHerd] = useState<{ id: number; type: string }[]>([]);
  const [editForm, setEditForm] = useState({ feedId: "", name: "", maxQuantity: "", minQuantity: "" });

  const consumers = [
    { value: "", label: tx("cons_general"), emoji: "🐾" },
    { value: "cow", label: tx("cons_cow"), emoji: "🐄" },
    { value: "goat", label: tx("cons_goat"), emoji: "🐐" },
    { value: "sheep", label: tx("cons_sheep"), emoji: "🐑" },
    { value: "chicken", label: tx("cons_chicken"), emoji: "🐔" },
    { value: "quail", label: tx("cons_quail"), emoji: "🦅" },
  ];

  const consumerLabel = (v: string | null) => {
    const c = consumers.find((x) => x.value === (v || ""));
    return c ? `${c.emoji} ${c.label}` : `🐾 ${tx("cons_general")}`;
  };

  const locale = lang === "fr" ? "fr-FR" : lang === "en" ? "en-GB" : "ar-DZ";

  const fetchData = () => {
    setLoading(true);
    fetch("/api/feed").then((r) => r.json()).then((d) => {
      setStock(Array.isArray(d?.stock) ? d.stock : []);
      setTransactions(Array.isArray(d?.transactions) ? d.transactions : []);
    }).catch(() => { setStock([]); setTransactions([]); }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    fetch("/api/animals?status=active").then((r) => r.json()).then((d) => setHerd(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const headcountFor = txForm.animalType ? herd.filter((a) => a.type === txForm.animalType).length : herd.length;
  const perHeadPreview = headcountFor > 0 && parseFloat(txForm.quantity || "0") > 0
    ? (parseFloat(txForm.quantity) / headcountFor).toFixed(2) : null;

  const pickFeed = (id: string) => {
    const it = stock.find((s) => String(s.id) === id);
    setTxForm((f) => ({ ...f, feedId: id, feedName: it?.name || "", unit: it?.unit || "كغ" }));
  };

  const openFeedForm = () => {
    setTxForm({ date: getTodayDate(), feedId: "", feedName: "", unit: "كغ", quantity: "", animalType: "", notes: "" });
    setShowFeed(true);
  };

  const handleFeed = async () => {
    if (!txForm.feedId || !txForm.quantity) { await appAlert(tx("alert_pick")); return; }
    setSaving(true);
    try {
      await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // "إطعام الحيوانات" is a DB-stored default note value — keep Arabic
        body: JSON.stringify({ action: "transaction", date: txForm.date, feedId: Number(txForm.feedId), feedName: txForm.feedName, transactionType: "out", quantity: txForm.quantity, unit: txForm.unit, animalType: txForm.animalType || null, notes: txForm.notes || "إطعام الحيوانات" }),
      });
      setShowFeed(false);
      fetchData();
    } catch { await appAlert(t("c_error")); } finally { setSaving(false); }
  };

  const openEdit = (item: FeedItem) => {
    setEditForm({ feedId: String(item.id), name: item.name, maxQuantity: item.maxQuantity || item.quantity, minQuantity: item.minQuantity || "0" });
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!editForm.maxQuantity) { await appAlert(tx("alert_max")); return; }
    setSaving(true);
    try {
      await fetch("/api/feed", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_stock", feedId: Number(editForm.feedId), maxQuantity: editForm.maxQuantity, minQuantity: editForm.minQuantity || "0" }),
      });
      setShowEdit(false);
      fetchData();
    } catch { await appAlert(t("c_error")); } finally { setSaving(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm";
  const labelCls = "text-sm text-gray-600 mb-1 block";

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title={t("nav_feed")} subtitle={`${tx("feed_stock")} • ${stock.length} ${tx("kind")}`} action={{ label: tx("feed_now"), icon: "🌾", onClick: openFeedForm }} />

      <div className="px-4 py-3">
        <Link href="/purchases" className="block bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-3 text-center">
          <p className="text-blue-700 text-sm font-medium">{tx("buy_only")}</p>
        </Link>

        <div className="flex gap-2 mb-4">
          {[{ value: "stock", label: tx("tab_stock") }, { value: "transactions", label: tx("tab_tx") }].map((tab) => (
            <button key={tab.value} onClick={() => setActiveTab(tab.value as "stock" | "transactions")}
              className={`flex-1 py-2 rounded-xl text-sm font-medium ${activeTab === tab.value ? "bg-yellow-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : activeTab === "stock" ? (
          stock.length === 0 ? (
            <div className="text-center py-16"><p className="text-5xl mb-3">🌾</p><p className="text-gray-500">{tx("no_stock")}</p></div>
          ) : (
            <div className="space-y-2">
              {stock.map((item) => {
                const qty = parseFloat(item.quantity || "0");
                const min = parseFloat(item.minQuantity || "0");
                const max = parseFloat(item.maxQuantity || "0");
                const low = qty <= min;
                const pct = max > 0 ? Math.round((qty / max) * 100) : 100;
                const over = pct > 100;
                return (
                  <button key={item.id} onClick={() => setDetailStock(item)} className={`w-full text-right bg-white rounded-xl p-3 shadow-sm ${low ? "border border-amber-300" : ""}`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center text-lg flex-shrink-0">🌾</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-gray-900 text-sm truncate">{item.name}</p>
                          <p className={`font-bold text-sm flex-shrink-0 ${low ? "text-amber-600" : over ? "text-blue-700" : "text-green-700"}`}>{item.quantity} {item.unit}</p>
                        </div>
                        <div className="mt-1.5 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${low ? "bg-amber-500" : over ? "bg-blue-500" : "bg-green-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          <div className="space-y-2">
            {transactions.map((tr) => {
              const inn = tr.transactionType === "in";
              return (
                <button key={tr.id} onClick={() => setDetailTx(tr)} className="w-full text-right bg-white rounded-xl px-3 py-2.5 shadow-sm flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${inn ? "bg-green-100" : "bg-red-100"}`}>
                    {inn ? "📥" : "📤"}
                  </div>
                  <p className="flex-1 min-w-0 truncate text-sm font-medium text-gray-900">
                    {inn ? `${tx("tx_in")} ${tr.feedName}` : `${tx("feed_verb")} ${consumerLabel(tr.animalType)} ${t("c_from")} ${tr.feedName}`}
                  </p>
                  <p className={`font-bold text-sm flex-shrink-0 ${inn ? "text-green-600" : "text-red-600"}`}>
                    {inn ? "+" : "-"}{tr.quantity} {tr.unit}
                  </p>
                </button>
              );
            })}
            {transactions.length === 0 && (
              <div className="text-center py-16"><p className="text-5xl mb-3">📋</p><p className="text-gray-500">{tx("no_tx")}</p></div>
            )}
          </div>
        )}
      </div>

      {/* تفاصيل المخزون */}
      {detailStock && (() => {
        const qty = parseFloat(detailStock.quantity || "0");
        const min = parseFloat(detailStock.minQuantity || "0");
        const max = parseFloat(detailStock.maxQuantity || "0");
        const low = qty <= min;
        const pct = max > 0 ? Math.round((qty / max) * 100) : 100;
        const row = "flex items-center justify-between py-1.5 border-b border-gray-100 text-sm";
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setDetailStock(null)}>
            <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">🌾 {detailStock.name}</h2>
                <button onClick={() => setDetailStock(null)} className="text-gray-400 text-2xl">×</button>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm">
                  <p className={`font-bold ${low ? "text-amber-600" : pct > 100 ? "text-blue-700" : "text-green-700"}`}>{detailStock.quantity} {detailStock.unit} {low && tx("low_warn")}</p>
                  <p className="text-xs text-gray-400">{pct}%</p>
                </div>
                <div className="mt-1.5 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${low ? "bg-amber-500" : pct > 100 ? "bg-blue-500" : "bg-green-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className={row}><span className="text-gray-500">{tx("d_type")}</span><span className="font-medium">{detailStock.type || "—"}</span></div>
                <div className={row}><span className="text-gray-500">{tx("cap_label")}</span><span className="font-medium">{max > 0 ? `${detailStock.maxQuantity} ${detailStock.unit}` : tx("cap_unset")}</span></div>
                <div className={row}><span className="text-gray-500">{tx("min_label")}</span><span className="font-medium">{detailStock.minQuantity} {detailStock.unit}</span></div>
                <div className={row}><span className="text-gray-500">{tx("d_unit_price")}</span><span className="font-medium">{detailStock.unitCost ? `${detailStock.unitCost} دج` : "—"}</span></div>
                <div className={row}><span className="text-gray-500">{tx("d_animal")}</span><span className="font-medium">{detailStock.animalType ? consumerLabel(detailStock.animalType) : consumerLabel(null)}</span></div>
                {detailStock.notes && <p className="py-1.5 text-sm text-gray-600">{tx("d_notes")}: {detailStock.notes}</p>}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { openEdit(detailStock); setDetailStock(null); }} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-bold">{tx("capacity_btn")}</button>
                <button onClick={() => { pickFeed(String(detailStock.id)); setDetailStock(null); setShowFeed(true); }} className="flex-1 bg-yellow-600 text-white py-2.5 rounded-xl text-sm font-bold">{tx("feed_now")}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* تفاصيل الحركة */}
      {detailTx && (() => {
        const inn = detailTx.transactionType === "in";
        const time = detailTx.createdAt ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(detailTx.createdAt)) : "";
        const headWord = detailTx.headcount === 1 ? tx("head1") : tx("headN");
        const row = "flex items-center justify-between py-1.5 border-b border-gray-100 text-sm";
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setDetailTx(null)}>
            <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">{inn ? `${tx("tx_in")} ${detailTx.feedName}` : `${tx("feed_verb")} ${detailTx.feedName}`}</h2>
                <button onClick={() => setDetailTx(null)} className="text-gray-400 text-2xl">×</button>
              </div>
              <div>
                <div className={row}><span className="text-gray-500">{tx("d_date")}</span><span className="font-medium">{formatDate(detailTx.date)}{time ? ` • ${tx("at_time")} ${time}` : ""}</span></div>
                <div className={row}><span className="text-gray-500">{tx("d_qty")}</span><span className={`font-bold ${inn ? "text-green-600" : "text-red-600"}`}>{inn ? "+" : "-"}{detailTx.quantity} {detailTx.unit}</span></div>
                <div className={row}><span className="text-gray-500">{tx("consumer_is")}</span><span className="font-medium">{inn ? tx("src_buy") : consumerLabel(detailTx.animalType)}</span></div>
                {detailTx.headcount ? <div className={row}><span className="text-gray-500">{tx("headN")}</span><span className="font-medium">{detailTx.headcount} {headWord}{detailTx.perHeadQty ? ` × ${detailTx.perHeadQty} ${detailTx.unit}` : ""}</span></div> : null}
                {detailTx.cost && Number(detailTx.cost) > 0 && <div className={row}><span className="text-gray-500">{tx("d_cost")}</span><span className="font-medium">{detailTx.cost} دج</span></div>}
                {detailTx.notes && <p className="py-1.5 text-sm text-gray-600">{tx("d_notes")}: {detailTx.notes}</p>}
              </div>
              <button onClick={() => setDetailTx(null)} className="w-full mt-4 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-bold">{tx("d_close")}</button>
            </div>
          </div>
        );
      })()}

      {/* إطعام */}
      {showFeed && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowFeed(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{tx("modal_title")}</h2>
              <button onClick={() => setShowFeed(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>{tx("choose_feed")}</label>
                {stock.length === 0 ? <p className="text-sm text-gray-500">{tx("no_stock_buy")}</p> : (
                  <div className="grid grid-cols-2 gap-2">
                    {stock.map((s) => {
                      const active = txForm.feedId === String(s.id);
                      const low = parseFloat(s.quantity) <= parseFloat(s.minQuantity || "0");
                      return (
                        <button key={s.id} onClick={() => pickFeed(String(s.id))}
                          className={`border rounded-xl p-2.5 text-right transition-all ${active ? "bg-yellow-600 text-white border-yellow-600 shadow" : "bg-gray-50 border-gray-200"}`}>
                          <p className={`text-sm font-bold ${active ? "text-white" : "text-gray-900"}`}>{s.name}</p>
                          <p className={`text-xs mt-0.5 ${active ? "text-yellow-100" : "text-gray-500"}`}>{s.quantity} {s.unit} {low && "⚠️"}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{tx("qty_in")}{txForm.unit}) *</label>
                  <input type="number" className={inputCls} value={txForm.quantity} onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>{t("c_date")}</label>
                  <input type="date" className={inputCls} value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={labelCls}>{tx("who_eats")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {consumers.map((c) => (
                    <button key={c.value} onClick={() => setTxForm({ ...txForm, animalType: c.value })}
                      className={`flex flex-col items-center py-2 rounded-xl text-xs font-medium border ${txForm.animalType === c.value ? "bg-green-600 text-white border-green-600" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                      <span className="text-xl">{c.emoji}</span>{c.label}
                    </button>
                  ))}
                </div>
                {perHeadPreview && (
                  <div className="mt-2 bg-green-50 border border-green-200 rounded-xl p-2.5 text-center text-xs text-green-800">
                    {tx("split_on")} {headcountFor} {headcountFor === 1 ? tx("head1") : tx("headN")} = <b>{perHeadPreview} {txForm.unit}/{headcountFor === 1 ? tx("head1") : tx("headN")}</b>
                  </div>
                )}
                {txForm.quantity && headcountFor === 0 && (
                  <p className="mt-2 text-xs text-red-500 text-center">{tx("no_animals")}</p>
                )}
              </div>
            </div>
            <button onClick={handleFeed} disabled={saving} className="w-full mt-4 bg-yellow-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {saving ? t("common_saving") : tx("confirm_feed")}
            </button>
          </div>
        </div>
      )}

      {/* تعديل السعة والحد الأدنى */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowEdit(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{tx("edit_title")} {editForm.name}</h2>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>{tx("max_cap")}</label>
                <input type="number" className={inputCls} value={editForm.maxQuantity} onChange={(e) => setEditForm({ ...editForm, maxQuantity: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>{tx("min_alert")}</label>
                <input type="number" className={inputCls} value={editForm.minQuantity} onChange={(e) => setEditForm({ ...editForm, minQuantity: e.target.value })} />
              </div>
            </div>
            <button onClick={handleEdit} disabled={saving} className="w-full mt-4 bg-gray-800 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {saving ? t("common_saving") : t("common_save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
