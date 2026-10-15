"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import { appAlert } from "@/components/AppDialog";
import { useApp } from "@/lib/i18n";

interface Contact {
  id: number; name: string; type: string; phone: string | null;
  email: string | null; address: string | null; notes: string | null;
}

const L: Record<string, Record<"ar" | "en" | "fr", string>> = {
  sub_unit: { ar: "جهة اتصال", en: "contacts", fr: "contacts" },
  hint: { ar: "المورّدون تُشترى منهم المستلزمات في صفحة الشراء • العملاء يُباع لهم في صفحة البيع.", en: "Buy supplies from suppliers on the Purchases page • Sell to customers on the Sales page.", fr: "Achetez les fournitures auprès des fournisseurs dans Achats • Vendez aux clients dans Ventes." },
  f_customers: { ar: "🧑 عملاء", en: "🧑 Customers", fr: "🧑 Clients" },
  f_suppliers: { ar: "🚚 مورّدون", en: "🚚 Suppliers", fr: "🚚 Fournisseurs" },
  empty: { ar: "لا توجد جهات اتصال", en: "No contacts", fr: "Aucun contact" },
  type_customer: { ar: "🧑 عميل (نبيع له)", en: "🧑 Customer (we sell to them)", fr: "🧑 Client (nous lui vendons)" },
  type_supplier: { ar: "🚚 مورّد (نشتري منه)", en: "🚚 Supplier (we buy from them)", fr: "🚚 Fournisseur (nous achetons chez lui)" },
  type_both: { ar: "👥 عميل ومورّد", en: "👥 Customer & supplier", fr: "👥 Client & fournisseur" },
  form_title: { ar: "👥 إضافة جهة اتصال", en: "👥 Add contact", fr: "👥 Ajouter un contact" },
  alert_name: { ar: "الاسم مطلوب", en: "Name is required", fr: "Le nom est requis" },
  details: { ar: "📄 تفاصيل جهة الاتصال", en: "📄 Contact details", fr: "📄 Détails du contact" },
  f_email: { ar: "البريد الإلكتروني", en: "Email", fr: "E-mail" },
  f_address: { ar: "العنوان", en: "Address", fr: "Adresse" },
};

export default function ContactsPage() {
  const { lang, t } = useApp();
  const tx = (k: string) => L[k][lang] ?? L[k].ar;
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", type: "both", phone: "", notes: "" });
  const [selected, setSelected] = useState<Contact | null>(null);

  const detailRow = (label: string, value: string) => (
    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 gap-3">
      <span className="text-gray-500 text-xs flex-shrink-0">{label}</span>
      <span className="font-bold text-gray-800 text-sm text-end min-w-0 break-words">{value}</span>
    </div>
  );

  const fetchAll = () => {
    setLoading(true);
    fetch("/api/contacts").then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([])).finally(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const handleSave = async () => {
    if (!form.name) { await appAlert(tx("alert_name")); return; }
    setSaving(true);
    try {
      await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, phone: form.phone || null, notes: form.notes || null }) });
      setShowForm(false);
      setForm({ name: "", type: "both", phone: "", notes: "" });
      fetchAll();
    } catch { await appAlert(t("c_error")); } finally { setSaving(false); }
  };

  const filtered = filter ? items.filter((c) => c.type === filter || c.type === "both") : items;
  const typeLabel = (tp: string) => tp === "customer" ? tx("type_customer") : tp === "supplier" ? tx("type_supplier") : tx("type_both");

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title={t("nav_contacts")} subtitle={`${filtered.length} ${tx("sub_unit")}`} action={{ label: t("c_add"), icon: "➕", onClick: () => setShowForm(true) }} />
      <div className="px-4 py-3">
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 mb-3">
          <p className="text-purple-700 text-xs">{tx("hint")}</p>
        </div>
        <div className="flex gap-2 mb-3">
          {[[ "", t("c_all")], ["customer", tx("f_customers")], ["supplier", tx("f_suppliers")]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={`flex-1 py-2 rounded-xl text-sm font-medium ${filter === v ? "bg-purple-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>{l}</button>
          ))}
        </div>
        <div className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16"><p className="text-5xl mb-3">👥</p><p className="text-gray-500">{tx("empty")}</p></div>
          ) : filtered.map((c) => (
            <button key={c.id} onClick={() => setSelected(c)} className="w-full bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 text-start">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-lg flex-shrink-0">{c.type === "supplier" ? "🚚" : c.type === "customer" ? "🧑" : "👥"}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{c.name}</p>
                <p className="text-xs text-gray-500 truncate">{typeLabel(c.type)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{tx("details")}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-2xl flex-shrink-0">{selected.type === "supplier" ? "🚚" : selected.type === "customer" ? "🧑" : "👥"}</div>
              <p className="font-bold text-gray-900 text-lg flex-1 min-w-0">{selected.name}</p>
            </div>
            <div className="space-y-2">
              {detailRow(t("c_type"), typeLabel(selected.type))}
              {detailRow(t("c_phone"), selected.phone || "—")}
              {detailRow(tx("f_email"), selected.email || "—")}
              {detailRow(tx("f_address"), selected.address || "—")}
              {detailRow(t("c_notes"), selected.notes || "—")}
            </div>
            {selected.phone && (
              <a href={`tel:${selected.phone}`} className="block text-center w-full mt-4 bg-purple-500 text-white py-3 rounded-xl font-bold">📞 {selected.phone}</a>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{tx("form_title")}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{t("c_name")} *</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("c_type")}</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="both">{tx("type_both")}</option>
                    <option value="customer">{tx("type_customer")}</option>
                    <option value="supplier">{tx("type_supplier")}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("c_phone")}</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{t("c_notes")}</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-purple-500 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {saving ? t("common_saving") : t("common_save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
