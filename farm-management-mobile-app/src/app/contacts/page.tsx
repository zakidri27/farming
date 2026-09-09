"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";

interface Contact {
  id: number;
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
}

const contactTypes = [
  { value: "", label: "الكل" },
  { value: "customer", label: "عميل" },
  { value: "supplier", label: "مورد" },
  { value: "both", label: "عميل ومورد" },
];

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    customer: "bg-blue-100 text-blue-700",
    supplier: "bg-green-100 text-green-700",
    both: "bg-purple-100 text-purple-700",
  };
  return colors[type] || "bg-gray-100 text-gray-700";
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = { customer: "عميل", supplier: "مورد", both: "عميل ومورد" };
  return labels[type] || type;
};

const defaultForm = { name: "", type: "both", phone: "", email: "", address: "", notes: "" };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = () => {
    setLoading(true);
    fetch("/api/contacts").then((r) => r.json()).then(setContacts).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditContact(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (c: Contact) => {
    setEditContact(c);
    setForm({ name: c.name, type: c.type, phone: c.phone || "", email: c.email || "", address: c.address || "", notes: c.notes || "" });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) return alert("الاسم مطلوب");
    setSaving(true);
    try {
      if (editContact) {
        await fetch(`/api/contacts/${editContact.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      setShowForm(false);
      fetchData();
    } catch { alert("حدث خطأ"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف جهة الاتصال؟")) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    fetchData();
  };

  const filtered = contacts
    .filter((c) => !filterType || c.type === filterType)
    .filter((c) => !search || c.name.includes(search) || (c.phone && c.phone.includes(search)));

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title="العملاء والموردون" subtitle={`${filtered.length} جهة اتصال`} action={{ label: "إضافة", icon: "➕", onClick: openAdd }} />

      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <input
          className="w-full bg-gray-100 rounded-xl px-4 py-2 text-sm mb-2"
          placeholder="🔍 البحث بالاسم أو الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {contactTypes.map((t) => (
            <button key={t.value} onClick={() => setFilterType(t.value)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium ${filterType === t.value ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><p className="text-5xl mb-3">👥</p><p className="text-gray-500">لا توجد جهات اتصال</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm fade-in">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl font-bold text-purple-600">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{c.name}</h3>
                      <span className={`badge ${getTypeColor(c.type)}`}>{getTypeLabel(c.type)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">✏️</button>
                    <button onClick={() => handleDelete(c.id)} className="w-8 h-8 bg-red-100 text-red-500 rounded-lg flex items-center justify-center text-sm">🗑️</button>
                  </div>
                </div>
                {(c.phone || c.email || c.address) && (
                  <div className="mt-3 space-y-1">
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-sm text-blue-600">
                        <span>📞</span><span>{c.phone}</span>
                      </a>
                    )}
                    {c.email && <p className="flex items-center gap-2 text-sm text-gray-600"><span>📧</span><span>{c.email}</span></p>}
                    {c.address && <p className="flex items-center gap-2 text-sm text-gray-600"><span>📍</span><span>{c.address}</span></p>}
                  </div>
                )}
                {c.notes && <p className="mt-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-2">{c.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editContact ? "تعديل جهة الاتصال" : "إضافة جهة اتصال"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">الاسم *</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">النوع</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ value: "customer", label: "عميل" }, { value: "supplier", label: "مورد" }, { value: "both", label: "كليهما" }].map((t) => (
                    <button key={t.value} onClick={() => setForm({ ...form, type: t.value })} className={`py-2 rounded-xl text-sm font-medium ${form.type === t.value ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">رقم الهاتف</label>
                <input type="tel" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">البريد الإلكتروني</label>
                <input type="email" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">العنوان</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">ملاحظات</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-purple-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {saving ? "جاري الحفظ..." : editContact ? "تحديث" : "حفظ"}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
