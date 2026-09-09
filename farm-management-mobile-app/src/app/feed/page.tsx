"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { formatCurrency, formatDate, getAnimalLabel, getTodayDate } from "@/lib/utils";

interface FeedItem {
  id: number;
  name: string;
  type: string;
  quantity: string;
  unit: string;
  unitCost: string | null;
  minQuantity: string;
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
  notes: string | null;
}

interface FeedData {
  stock: FeedItem[];
  transactions: FeedTransaction[];
}

const feedTypes = [
  { value: "hay", label: "تبن", icon: "🌾" },
  { value: "grain", label: "حبوب", icon: "🌽" },
  { value: "concentrate", label: "كونسونتري", icon: "🧺" },
  { value: "supplement", label: "مكملات", icon: "💊" },
  { value: "other", label: "أخرى", icon: "📦" },
];

export default function FeedPage() {
  const [data, setData] = useState<FeedData>({ stock: [], transactions: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stock" | "transactions">("stock");
  const [showAddStock, setShowAddStock] = useState(false);
  const [showTransaction, setShowTransaction] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<FeedItem | null>(null);

  const [stockForm, setStockForm] = useState({ name: "", type: "hay", quantity: "", unit: "كغ", unitCost: "", minQuantity: "10", animalType: "", notes: "" });
  const [txForm, setTxForm] = useState({ date: getTodayDate(), feedId: "", feedName: "", transactionType: "out", quantity: "", unit: "كغ", cost: "", animalType: "", notes: "" });

  const fetchData = () => {
    setLoading(true);
    fetch("/api/feed").then((r) => r.json()).then(setData).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddStock = async () => {
    if (!stockForm.name) return alert("اسم العلف مطلوب");
    setSaving(true);
    try {
      await fetch("/api/feed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_stock", ...stockForm }) });
      setShowAddStock(false);
      fetchData();
    } catch { alert("حدث خطأ"); } finally { setSaving(false); }
  };

  const handleTransaction = async () => {
    if (!txForm.feedName || !txForm.quantity) return alert("اسم العلف والكمية مطلوبان");
    setSaving(true);
    try {
      await fetch("/api/feed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "transaction", ...txForm }) });
      setShowTransaction(false);
      setTxForm({ date: getTodayDate(), feedId: "", feedName: "", transactionType: "out", quantity: "", unit: "كغ", cost: "", animalType: "", notes: "" });
      fetchData();
    } catch { alert("حدث خطأ"); } finally { setSaving(false); }
  };

  const handleDeleteStock = async (id: number) => {
    if (!confirm("هل تريد حذف هذا العلف؟")) return;
    await fetch(`/api/feed/${id}`, { method: "DELETE" });
    fetchData();
  };

  const isLowStock = (item: FeedItem) => parseFloat(item.quantity) <= parseFloat(item.minQuantity || "0");

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title="إدارة العلف" subtitle={`${data.stock.length} نوع علف`} action={{ label: "إضافة", icon: "➕", onClick: () => setShowAddStock(true) }} />

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-3">
        <button onClick={() => setActiveTab("stock")} className={`flex-1 py-2 rounded-xl text-sm font-medium ${activeTab === "stock" ? "bg-yellow-600 text-white" : "bg-gray-100 text-gray-600"}`}>
          📦 المخزون
        </button>
        <button onClick={() => setActiveTab("transactions")} className={`flex-1 py-2 rounded-xl text-sm font-medium ${activeTab === "transactions" ? "bg-yellow-600 text-white" : "bg-gray-100 text-gray-600"}`}>
          📋 الحركات
        </button>
        <button onClick={() => setShowTransaction(true)} className="px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium">
          ➕ حركة
        </button>
      </div>

      <div className="px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : activeTab === "stock" ? (
          data.stock.length === 0 ? (
            <div className="text-center py-16"><p className="text-5xl mb-3">🌾</p><p className="text-gray-500">لا يوجد مخزون علف</p></div>
          ) : (
            <div className="space-y-3">
              {data.stock.map((item) => (
                <div key={item.id} className={`bg-white rounded-2xl p-4 shadow-sm fade-in ${isLowStock(item) ? "border-2 border-red-300" : ""}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-xl">
                        {feedTypes.find((f) => f.value === item.type)?.icon || "🌾"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {feedTypes.find((f) => f.value === item.type)?.label || item.type}
                          {item.animalType ? ` • ${getAnimalLabel(item.animalType)}` : ""}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteStock(item.id)} className="w-7 h-7 bg-red-100 text-red-500 rounded-lg flex items-center justify-center text-xs">🗑️</button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className={`rounded-lg p-2 text-center ${isLowStock(item) ? "bg-red-50" : "bg-green-50"}`}>
                      <p className="text-xs text-gray-500">المخزون</p>
                      <p className={`text-sm font-bold ${isLowStock(item) ? "text-red-600" : "text-green-700"}`}>{item.quantity} {item.unit}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">الحد الأدنى</p>
                      <p className="text-sm font-bold text-gray-700">{item.minQuantity} {item.unit}</p>
                    </div>
                    {item.unitCost && (
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">سعر الوحدة</p>
                        <p className="text-sm font-bold text-gray-700">{formatCurrency(item.unitCost)}</p>
                      </div>
                    )}
                  </div>
                  {isLowStock(item) && (
                    <div className="mt-2 bg-red-50 rounded-lg p-2 text-center">
                      <p className="text-red-600 text-xs font-medium">⚠️ المخزون منخفض - يجب إعادة التزود</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          data.transactions.length === 0 ? (
            <div className="text-center py-16"><p className="text-5xl mb-3">📋</p><p className="text-gray-500">لا توجد حركات</p></div>
          ) : (
            <div className="space-y-2">
              {data.transactions.map((tx) => (
                <div key={tx.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 fade-in">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${tx.transactionType === "in" ? "bg-green-100" : "bg-orange-100"}`}>
                    {tx.transactionType === "in" ? "📥" : "📤"}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{tx.feedName}</p>
                    <p className="text-xs text-gray-500">{tx.transactionType === "in" ? "وارد" : "صادر"} • {formatDate(tx.date)}</p>
                    {tx.animalType && <p className="text-xs text-gray-400">{getAnimalLabel(tx.animalType)}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${tx.transactionType === "in" ? "text-green-600" : "text-orange-600"}`}>
                      {tx.transactionType === "in" ? "+" : "-"}{tx.quantity} {tx.unit}
                    </p>
                    {tx.cost && <p className="text-xs text-gray-500">{formatCurrency(tx.cost)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Add Stock Modal */}
      {showAddStock && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowAddStock(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">إضافة علف للمخزون</h2>
              <button onClick={() => setShowAddStock(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">اسم العلف *</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={stockForm.name} onChange={(e) => setStockForm({ ...stockForm, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">النوع</label>
                <div className="grid grid-cols-5 gap-1">
                  {feedTypes.map((t) => (
                    <button key={t.value} onClick={() => setStockForm({ ...stockForm, type: t.value })} className={`py-2 rounded-xl text-xs flex flex-col items-center gap-0.5 ${stockForm.type === t.value ? "bg-yellow-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                      <span>{t.icon}</span><span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">الكمية الأولية</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">الوحدة</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={stockForm.unit} onChange={(e) => setStockForm({ ...stockForm, unit: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">سعر الوحدة</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={stockForm.unitCost} onChange={(e) => setStockForm({ ...stockForm, unitCost: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">الحد الأدنى</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={stockForm.minQuantity} onChange={(e) => setStockForm({ ...stockForm, minQuantity: e.target.value })} />
                </div>
              </div>
            </div>
            <button onClick={handleAddStock} disabled={saving} className="w-full mt-4 bg-yellow-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransaction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowTransaction(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">تسجيل حركة علف</h2>
              <button onClick={() => setShowTransaction(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">نوع الحركة</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setTxForm({ ...txForm, transactionType: "in" })} className={`py-3 rounded-xl text-sm font-medium ${txForm.transactionType === "in" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                    📥 وارد (شراء)
                  </button>
                  <button onClick={() => setTxForm({ ...txForm, transactionType: "out" })} className={`py-3 rounded-xl text-sm font-medium ${txForm.transactionType === "out" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700"}`}>
                    📤 صادر (استهلاك)
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">العلف</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={txForm.feedId} onChange={(e) => {
                  const feed = data.stock.find((f) => f.id === parseInt(e.target.value));
                  setTxForm({ ...txForm, feedId: e.target.value, feedName: feed?.name || "", unit: feed?.unit || "كغ" });
                }}>
                  <option value="">اختر علف...</option>
                  {data.stock.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                {!txForm.feedId && (
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mt-2" placeholder="أو أدخل اسم العلف" value={txForm.feedName} onChange={(e) => setTxForm({ ...txForm, feedName: e.target.value })} />
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">التاريخ</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">الكمية *</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={txForm.quantity} onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">الوحدة</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={txForm.unit} onChange={(e) => setTxForm({ ...txForm, unit: e.target.value })} />
                </div>
              </div>
              {txForm.transactionType === "in" && (
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">التكلفة</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={txForm.cost} onChange={(e) => setTxForm({ ...txForm, cost: e.target.value })} />
                </div>
              )}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">ملاحظات</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" rows={2} value={txForm.notes} onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })} />
              </div>
            </div>
            <button onClick={handleTransaction} disabled={saving} className="w-full mt-4 bg-yellow-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
