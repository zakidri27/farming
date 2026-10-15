"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { formatCurrency, formatDate, getTodayDate } from "@/lib/utils";
import { useApp } from "@/lib/i18n";
import { appAlert, appConfirm } from "@/components/AppDialog";

interface LedgerRow {
  id: number; date: string; type: string; category: string;
  description: string; amount: string;
  balance: string | null; referenceType: string | null; referenceId: number | null;
  notes: string | null;
}
interface Debt {
  id: number; date: string; type: string; contactName: string;
  description: string; totalAmount: string; paidAmount: string; status: string;
  dueDate: string | null; notes: string | null;
}
interface TreasuryData {
  capital: number; balance: number; totalIn: number; totalOut: number;
  ledger: LedgerRow[]; debts: Debt[]; weOweTotal: number; owedToUsTotal: number;
}

const L: Record<string, Record<"ar" | "en" | "fr", string>> = {
  sub: { ar: "محاسب التطبيق — كل الأموال تمر من هنا", en: "App accountant — all money passes through here", fr: "Comptable de l'app — tout l'argent passe par ici" },
  balance_now: { ar: "الرصيد الحالي 🏦", en: "Current balance 🏦", fr: "Solde actuel 🏦" },
  capital_btn: { ar: "⚙️ رأس المال", en: "⚙️ Capital", fr: "⚙️ Capital" },
  base_capital: { ar: "رأس المال الأساسي", en: "Base capital", fr: "Capital de base" },
  in_lbl: { ar: "📈 داخل", en: "📈 In", fr: "📈 Entrées" },
  out_lbl: { ar: "📉 خارج", en: "📉 Out", fr: "📉 Sorties" },
  set_capital_first: { ar: "⚠️ حدد رأس المال الأساسي أولاً — بدونه لا يمكن الشراء نقداً", en: "⚠️ Set the base capital first — cash purchases are impossible without it", fr: "⚠️ Définissez d'abord le capital de base — sans lui aucun achat au comptant" },
  debts_on_us: { ar: "📋 ديون علينا", en: "📋 Debts we owe", fr: "📋 Dettes à payer" },
  debts_for_us: { ar: "📋 ديون لنا", en: "📋 Debts owed to us", fr: "📋 Dettes à recevoir" },
  sec_weowe: { ar: "💳 ديون علينا (تسديد من الخزينة)", en: "💳 Debts we owe (pay from treasury)", fr: "💳 Dettes à payer (payer depuis la trésorerie)" },
  sec_owed: { ar: "💰 ديون لنا (تحصيل إلى الخزينة)", en: "💰 Debts owed to us (collect into treasury)", fr: "💰 Dettes à recevoir (encaisser)" },
  ledger_title: { ar: "📜 حركة رأس المال", en: "📜 Capital movements", fr: "📜 Mouvements du capital" },
  ledger_empty: { ar: "لا توجد حركات بعد — حدد رأس المال وابدأ الشراء والبيع", en: "No movements yet — set the capital and start buying and selling", fr: "Aucun mouvement — définissez le capital et commencez à acheter et vendre" },
  modal_desc: { ar: "كل عمليات الشراء والمصاريف النقدية تُخصم منه، والمبيعات تُضاف إليه. لا يمكن الشراء نقداً بما يتجاوز الرصيد.", en: "All cash purchases and expenses are deducted from it, sales are added to it. Cash purchases cannot exceed the balance.", fr: "Tous les achats et dépenses au comptant en sont déduits, les ventes y sont ajoutées. Les achats au comptant ne peuvent dépasser le solde." },
  save_capital: { ar: "حفظ رأس المال", en: "Save capital", fr: "Enregistrer le capital" },
  alert_capital: { ar: "أدخل رأس المال", en: "Enter the capital", fr: "Saisissez le capital" },
  alert_valid: { ar: "أدخل مبلغاً صحيحاً", en: "Enter a valid amount", fr: "Saisissez un montant valide" },
  alert_exceed: { ar: "المبلغ يتجاوز المتبقي", en: "Amount exceeds the remainder", fr: "Le montant dépasse le restant" },
  alert_insufficient: { ar: "الرصيد لا يكفي", en: "Insufficient balance", fr: "Solde insuffisant" },
  details_debt: { ar: "📄 تفاصيل الدين", en: "📄 Debt details", fr: "📄 Détails de la dette" },
  details_ledger: { ar: "📄 تفاصيل الحركة", en: "📄 Movement details", fr: "📄 Détails du mouvement" },
  f_contact: { ar: "جهة الاتصال", en: "Contact", fr: "Contact" },
  f_total: { ar: "المبلغ الكلي", en: "Total amount", fr: "Montant total" },
  f_paid: { ar: "المدفوع", en: "Paid", fr: "Payé" },
  f_due: { ar: "تاريخ الاستحقاق", en: "Due date", fr: "Échéance" },
  f_type: { ar: "النوع", en: "Type", fr: "Type" },
  f_ref: { ar: "المرجع", en: "Reference", fr: "Référence" },
  f_balance: { ar: "الرصيد بعد الحركة", en: "Balance after movement", fr: "Solde après mouvement" },
  ty_income: { ar: "📈 دخل", en: "📈 Income", fr: "📈 Entrée" },
  ty_expense: { ar: "📉 مصروف", en: "📉 Expense", fr: "📉 Sortie" },
  st_pending: { ar: "⏳ معلق", en: "⏳ Pending", fr: "⏳ En attente" },
  st_partial: { ar: "◐ مدفوع جزئياً", en: "◐ Partially paid", fr: "◐ Partiellement payé" },
  st_paid: { ar: "✅ مدفوع", en: "✅ Paid", fr: "✅ Payé" },
};

const remain = (d: Debt) => parseFloat(d.totalAmount || "0") - parseFloat(d.paidAmount || "0");

export default function TreasuryPage() {
  const { lang, t } = useApp();
  const tx = (k: string) => L[k][lang] ?? L[k].ar;
  const [data, setData] = useState<TreasuryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCapital, setShowCapital] = useState(false);
  const [capitalInput, setCapitalInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [payAmounts, setPayAmounts] = useState<Record<number, string>>({});
  const [selLedger, setSelLedger] = useState<LedgerRow | null>(null);
  const [selDebt, setSelDebt] = useState<{ d: Debt; kind: "pay_debt" | "collect_debt" } | null>(null);

  const detailRow = (label: string, value: string) => (
    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 gap-3">
      <span className="text-gray-500 text-xs flex-shrink-0">{label}</span>
      <span className="font-bold text-gray-800 text-sm text-end min-w-0 break-words">{value}</span>
    </div>
  );
  const statusLabel = (d: Debt) =>
    d.status === "paid" ? tx("st_paid") : parseFloat(d.paidAmount || "0") > 0 ? tx("st_partial") : tx("st_pending");

  const fetchData = () => {
    setLoading(true);
    fetch("/api/treasury").then((r) => r.json()).then((d) => {
      if (d && !d.error) setData(d);
    }).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, []);

  const handleCapital = async () => {
    if (!capitalInput) { await appAlert(tx("alert_capital")); return; }
    setSaving(true);
    try {
      await fetch("/api/treasury", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_capital", amount: capitalInput }),
      });
      setShowCapital(false);
      fetchData();
    } catch { await appAlert(t("c_error")); } finally { setSaving(false); }
  };

  const handleDebt = async (debt: Debt, kind: "pay_debt" | "collect_debt") => {
    const amount = parseFloat(payAmounts[debt.id] || String(remain(debt)));
    if (!amount || amount <= 0) { await appAlert(tx("alert_valid")); return; }
    if (amount > remain(debt) + 0.001) { await appAlert(tx("alert_exceed")); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/treasury", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: kind, debtId: debt.id, amount: String(amount), date: getTodayDate() }),
      });
      const d = await r.json();
      if (!r.ok) {
        if (d.error === "INSUFFICIENT_FUNDS") { await appAlert(`${tx("alert_insufficient")} (${t("c_available")}: ${formatCurrency(d.balance)})`); return; }
        await appAlert(t("c_error")); return;
      }
      setPayAmounts((p) => ({ ...p, [debt.id]: "" }));
      setSelDebt(null);
      fetchData();
    } catch { await appAlert(t("c_error")); } finally { setSaving(false); }
  };

  const td = data ?? { capital: 0, balance: 0, totalIn: 0, totalOut: 0, ledger: [], debts: [], weOweTotal: 0, owedToUsTotal: 0 };
  const weOwe = (data?.debts || []).filter((d) => d.type === "we_owe" && d.status !== "paid");
  const owedToUs = (data?.debts || []).filter((d) => d.type === "owed_to_us" && d.status !== "paid");

  const debtCard = (d: Debt, kind: "pay_debt" | "collect_debt") => (
    <button key={d.id} onClick={() => setSelDebt({ d, kind })} className="w-full bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 text-start">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${kind === "pay_debt" ? "bg-red-100" : "bg-green-100"}`}>
        {kind === "pay_debt" ? "💳" : "💰"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm truncate">{d.contactName}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatDate(d.date)} • {statusLabel(d)}</p>
      </div>
      <div className="text-end flex-shrink-0">
        <p className={`font-bold text-sm ${kind === "pay_debt" ? "text-red-600" : "text-green-600"}`}>{formatCurrency(remain(d))}</p>
        <p className="text-[11px] text-gray-400">{t("c_from")} {formatCurrency(d.totalAmount)}</p>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title={t("nav_treasury")} subtitle={tx("sub")} />

      <div className="px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            {/* الرصيد */}
            <div className={`rounded-2xl p-5 text-white ${td.balance >= 0 ? "bg-gradient-to-br from-amber-500 to-amber-600" : "bg-gradient-to-br from-red-500 to-red-600"}`}>
              <div className="flex items-center justify-between">
                <p className="text-white/80 text-sm">{tx("balance_now")}</p>
                <button onClick={() => { setCapitalInput(String(td.capital || "")); setShowCapital(true); }} className="text-xs bg-white/20 rounded-lg px-2.5 py-1.5 font-medium">{tx("capital_btn")}</button>
              </div>
              <p className="text-3xl font-bold mt-1">{formatCurrency(td.balance)}</p>
              <div className="flex justify-between mt-4 pt-4 border-t border-white/20 text-sm">
                <div><p className="text-white/70 text-xs">{tx("base_capital")}</p><p className="font-bold">{formatCurrency(td.capital)}</p></div>
                <div className="text-center"><p className="text-white/70 text-xs">{tx("in_lbl")}</p><p className="font-bold">{formatCurrency(td.totalIn)}</p></div>
                <div className="text-right"><p className="text-white/70 text-xs">{tx("out_lbl")}</p><p className="font-bold">{formatCurrency(td.totalOut)}</p></div>
              </div>
            </div>

            {td.capital <= 0 && (
              <button onClick={() => { setCapitalInput(""); setShowCapital(true); }} className="block w-full bg-amber-50 border border-amber-300 rounded-2xl p-4 text-center">
                <p className="text-amber-800 text-sm font-bold">{tx("set_capital_first")}</p>
              </button>
            )}

            {/* الديون */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-center">
                <p className="text-red-600 text-xs">{tx("debts_on_us")}</p>
                <p className="text-red-800 font-bold mt-1">{formatCurrency(td.weOweTotal)}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
                <p className="text-emerald-600 text-xs">{tx("debts_for_us")}</p>
                <p className="text-emerald-800 font-bold mt-1">{formatCurrency(td.owedToUsTotal)}</p>
              </div>
            </div>

            {weOwe.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-700">{tx("sec_weowe")}</p>
                {weOwe.map((d) => debtCard(d, "pay_debt"))}
              </div>
            )}
            {owedToUs.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-700">{tx("sec_owed")}</p>
                {owedToUs.map((d) => debtCard(d, "collect_debt"))}
              </div>
            )}

            {/* حركة رأس المال */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 text-sm">{tx("ledger_title")}</h3>
              {td.ledger.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-3">{tx("ledger_empty")}</p>
              ) : (
                <div className="space-y-2">
                  {td.ledger.map((r) => (
                    <button key={r.id} onClick={() => setSelLedger(r)} className="w-full flex items-center gap-3 bg-gray-50 rounded-xl p-2.5 text-start">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${r.type === "income" ? "bg-green-100" : "bg-red-100"}`}>
                        {r.type === "income" ? "📈" : "📉"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium truncate">{r.description}</p>
                        <p className="text-[11px] text-gray-400">{formatDate(r.date)}</p>
                      </div>
                      <p className={`font-bold text-sm flex-shrink-0 ${r.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {r.type === "income" ? "+" : "-"}{formatCurrency(r.amount)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Link href="/purchases" className="text-center bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium">🛒 {t("nav_purchases")}</Link>
              <Link href="/sales" className="text-center bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium">💵 {t("nav_sales")}</Link>
              <Link href="/expenses" className="text-center bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium">💸 {t("nav_expenses")}</Link>
            </div>
          </>
        )}
      </div>

      {/* نافذة تفاصيل الدين + تسديد/تحصيل */}
      {selDebt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setSelDebt(null)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{tx("details_debt")}</h2>
              <button onClick={() => setSelDebt(null)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${selDebt.kind === "pay_debt" ? "bg-red-100" : "bg-green-100"}`}>
                {selDebt.kind === "pay_debt" ? "💳" : "💰"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{selDebt.d.contactName}</p>
                <p className={`font-bold text-lg ${selDebt.kind === "pay_debt" ? "text-red-600" : "text-green-600"}`}>{formatCurrency(remain(selDebt.d))}</p>
              </div>
            </div>
            <div className="space-y-2">
              {detailRow(t("c_date"), formatDate(selDebt.d.date))}
              {detailRow(tx("f_contact"), selDebt.d.contactName)}
              {detailRow(t("c_desc"), selDebt.d.description)}
              {detailRow(tx("f_total"), formatCurrency(selDebt.d.totalAmount))}
              {detailRow(tx("f_paid"), formatCurrency(selDebt.d.paidAmount))}
              {detailRow(t("c_remaining"), formatCurrency(remain(selDebt.d)))}
              {detailRow(tx("f_due"), selDebt.d.dueDate ? formatDate(selDebt.d.dueDate) : "—")}
              {detailRow(t("c_status"), statusLabel(selDebt.d))}
              {detailRow(t("c_notes"), selDebt.d.notes || "—")}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="number"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                placeholder={String(remain(selDebt.d))}
                value={payAmounts[selDebt.d.id] ?? ""}
                onChange={(e) => setPayAmounts({ ...payAmounts, [selDebt.d.id]: e.target.value })}
              />
              <button
                onClick={() => handleDebt(selDebt.d, selDebt.kind)}
                disabled={saving}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 ${selDebt.kind === "pay_debt" ? "bg-red-500" : "bg-green-600"}`}
              >
                {selDebt.kind === "pay_debt" ? t("c_pay") : t("c_collect")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل حركة */}
      {selLedger && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setSelLedger(null)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{tx("details_ledger")}</h2>
              <button onClick={() => setSelLedger(null)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${selLedger.type === "income" ? "bg-green-100" : "bg-red-100"}`}>
                {selLedger.type === "income" ? "📈" : "📉"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{selLedger.description}</p>
                <p className={`font-bold text-lg ${selLedger.type === "income" ? "text-green-600" : "text-red-600"}`}>
                  {selLedger.type === "income" ? "+" : "-"}{formatCurrency(selLedger.amount)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {detailRow(t("c_date"), formatDate(selLedger.date))}
              {detailRow(tx("f_type"), selLedger.type === "income" ? tx("ty_income") : tx("ty_expense"))}
              {detailRow(t("c_category"), selLedger.category)}
              {detailRow(t("c_desc"), selLedger.description)}
              {detailRow(t("c_amount"), formatCurrency(selLedger.amount))}
              {detailRow(tx("f_balance"), selLedger.balance != null ? formatCurrency(selLedger.balance) : "—")}
              {detailRow(tx("f_ref"), selLedger.referenceType ? `${selLedger.referenceType}${selLedger.referenceId ? ` #${selLedger.referenceId}` : ""}` : "—")}
              {detailRow(t("c_notes"), selLedger.notes || "—")}
            </div>
          </div>
        </div>
      )}

      {/* رأس المال */}
      {showCapital && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowCapital(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">🏦 {tx("base_capital")}</h2>
              <button onClick={() => setShowCapital(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <p className="text-xs text-gray-500 mb-3">{tx("modal_desc")}</p>
            <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="مثال: 500000" value={capitalInput} onChange={(e) => setCapitalInput(e.target.value)} />
            <button onClick={handleCapital} disabled={saving} className="w-full mt-4 bg-amber-500 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {saving ? t("common_saving") : tx("save_capital")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
