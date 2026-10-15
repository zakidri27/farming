"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "ar" | "en" | "fr";
export type Theme = "light" | "dark";

const dict = {
  nav_dashboard: { ar: "لوحة التحكم", en: "Dashboard", fr: "Tableau de bord" },
  nav_animals: { ar: "الحيوانات", en: "Animals", fr: "Animaux" },
  nav_feed: { ar: "الغذاء", en: "Feed", fr: "Alimentation" },
  nav_purchases: { ar: "شراء", en: "Purchases", fr: "Achats" },
  nav_births: { ar: "مواليد", en: "Births", fr: "Naissances" },
  nav_health: { ar: "صحة وبيطرة", en: "Health & Vet", fr: "Santé & Véto" },
  nav_production: { ar: "إنتاج", en: "Production", fr: "Production" },
  nav_sales: { ar: "بيع", en: "Sales", fr: "Ventes" },
  nav_treasury: { ar: "الخزينة", en: "Treasury", fr: "Trésorerie" },
  nav_expenses: { ar: "مصاريف", en: "Expenses", fr: "Dépenses" },
  nav_reports: { ar: "تقارير", en: "Reports", fr: "Rapports" },
  nav_contacts: { ar: "عملاء وموردون", en: "Clients & Suppliers", fr: "Clients & Fournisseurs" },
  nav_tracking: { ar: "تتبع", en: "Tracking", fr: "Suivi" },
  nav_records: { ar: "سجلات الحيوانات", en: "Animal Records", fr: "Registres" },
  nav_settings: { ar: "الإعدادات", en: "Settings", fr: "Paramètres" },
  nav_backup: { ar: "النسخ الاحتياطي", en: "Backup", fr: "Sauvegarde" },
  settings_title: { ar: "الإعدادات", en: "Settings", fr: "Paramètres" },
  settings_sub: { ar: "اللغة والمظهر والنسخ الاحتياطي", en: "Language, appearance & backup", fr: "Langue, apparence et sauvegarde" },
  settings_lang: { ar: "🌍 لغة التطبيق", en: "🌍 App language", fr: "🌍 Langue de l'application" },
  settings_theme: { ar: "🌙 المظهر", en: "🌙 Appearance", fr: "🌙 Apparence" },
  theme_light: { ar: "☀️ فاتح", en: "☀️ Light", fr: "☀️ Clair" },
  theme_dark: { ar: "🌙 داكن", en: "🌙 Dark", fr: "🌙 Sombre" },
  settings_backup: { ar: "💾 النسخ الاحتياطي", en: "💾 Backup", fr: "💾 Sauvegarde" },
  settings_backup_desc: { ar: "صدّر بياناتك أو استعدها عند تغيير الجهاز", en: "Export or restore your data when changing devices", fr: "Exportez ou restaurez vos données" },
  settings_open: { ar: "فتح النسخ الاحتياطي ←", en: "Open backup →", fr: "Ouvrir la sauvegarde →" },
  settings_wipe: { ar: "🗑️ حذف جميع البيانات", en: "🗑️ Delete all data", fr: "🗑️ Supprimer toutes les données" },
  settings_wipe_desc: { ar: "يعود التطبيق كأنه جديد تماماً — لا يمكن التراجع عن هذا", en: "Reset the app to a fresh, empty state — this cannot be undone", fr: "Réinitialise l'application à l'état neuf — action irréversible" },
  settings_wipe_btn: { ar: "حذف جميع البيانات", en: "Delete all data", fr: "Supprimer toutes les données" },
  settings_wipe_confirm: { ar: "⚠️ هل أنت متأكد؟\nسيتم حذف جميع البيانات نهائياً ولن يمكن استرجاعها.", en: "⚠️ Are you sure?\nAll data will be permanently deleted and cannot be recovered.", fr: "⚠️ Êtes-vous sûr ?\nToutes les données seront définitivement supprimées." },
  settings_wipe_done: { ar: "تم حذف جميع البيانات — التطبيق الآن فارغ وجديد.", en: "All data deleted — the app is now fresh and empty.", fr: "Toutes les données ont été supprimées — l'application est maintenant vide." },
  settings_wipe_fail: { ar: "تعذر حذف البيانات:", en: "Could not delete data:", fr: "Impossible de supprimer les données :" },
  backup_title: { ar: "النسخ الاحتياطي", en: "Backup", fr: "Sauvegarde" },
  backup_sub: { ar: "حماية بياناتك عند تلف الجهاز أو تغييره", en: "Protect your data when the device is lost or changed", fr: "Protégez vos données en cas de perte ou changement d'appareil" },
  backup_export: { ar: "📤 تصدير البيانات", en: "📤 Export data", fr: "📤 Exporter les données" },
  backup_export_json: { ar: "ملف JSON (كامل ودقيق)", en: "JSON file (full & exact)", fr: "Fichier JSON (complet et exact)" },
  backup_export_excel: { ar: "ملف Excel (جداول احترافية)", en: "Excel file (professional sheets)", fr: "Fichier Excel (tableaux professionnels)" },
  backup_import: { ar: "📥 استيراد البيانات", en: "📥 Import data", fr: "📤 Importer les données" },
  backup_import_desc: { ar: "اختر ملف JSON أو Excel سبق تصديره — ستحل البيانات المستوردة محل الحالية", en: "Choose a previously exported JSON or Excel file — imported data will replace current data", fr: "Choisissez un fichier JSON ou Excel exporté — les données importées remplaceront les actuelles" },
  backup_import_btn: { ar: "اختيار ملف واستيراد", en: "Choose file & import", fr: "Choisir un fichier et importer" },
  backup_warn: { ar: "⚠️ الاستيراد يمسح البيانات الحالية نهائياً — صدّر نسخة أولاً", en: "⚠️ Import permanently erases current data — export a copy first", fr: "⚠️ L'import efface définitivement les données actuelles — exportez d'abord une copie" },
  dash_herd: { ar: "القطيع", en: "Herd", fr: "Troupeau" },
  dash_balance: { ar: "رصيد الخزينة", en: "Treasury balance", fr: "Solde de trésorerie" },
  dash_month_in: { ar: "داخل الشهر", en: "Month income", fr: "Entrées du mois" },
  dash_month_out: { ar: "خارج الشهر", en: "Month expenses", fr: "Dépenses du mois" },
  dash_health_alerts: { ar: "⚠️ تنبيهات صحية", en: "⚠️ Health alerts", fr: "⚠️ Alertes santé" },
  dash_low_feed: { ar: "🌾 غذاء منخفض", en: "🌾 Low feed", fr: "🌾 Stock bas" },
  dash_quick: { ar: "وصول سريع", en: "Quick access", fr: "Accès rapide" },
  common_save: { ar: "حفظ", en: "Save", fr: "Enregistrer" },
  common_cancel: { ar: "إلغاء", en: "Cancel", fr: "Annuler" },
  common_close: { ar: "إغلاق", en: "Close", fr: "Fermer" },
  common_search: { ar: "بحث...", en: "Search...", fr: "Rechercher..." },
  common_loading: { ar: "جاري التحميل...", en: "Loading...", fr: "Chargement..." },
  common_saving: { ar: "جاري الحفظ...", en: "Saving...", fr: "Enregistrement..." },
  c_add: { ar: "إضافة", en: "Add", fr: "Ajouter" },
  c_new: { ar: "جديد", en: "New", fr: "Nouveau" },
  c_edit: { ar: "تعديل", en: "Edit", fr: "Modifier" },
  c_delete: { ar: "حذف", en: "Delete", fr: "Supprimer" },
  c_confirm: { ar: "تأكيد", en: "Confirm", fr: "Confirmer" },
  c_back: { ar: "رجوع", en: "Back", fr: "Retour" },
  c_all: { ar: "الكل", en: "All", fr: "Tous" },
  c_name: { ar: "الاسم", en: "Name", fr: "Nom" },
  c_type: { ar: "النوع", en: "Type", fr: "Type" },
  c_date: { ar: "التاريخ", en: "Date", fr: "Date" },
  c_quantity: { ar: "الكمية", en: "Quantity", fr: "Quantité" },
  c_unit: { ar: "الوحدة", en: "Unit", fr: "Unité" },
  c_price: { ar: "السعر", en: "Price", fr: "Prix" },
  c_total: { ar: "الإجمالي", en: "Total", fr: "Total" },
  c_desc: { ar: "الوصف", en: "Description", fr: "Description" },
  c_notes: { ar: "ملاحظات", en: "Notes", fr: "Notes" },
  c_status: { ar: "الحالة", en: "Status", fr: "Statut" },
  c_category: { ar: "الصنف", en: "Category", fr: "Catégorie" },
  c_phone: { ar: "الهاتف", en: "Phone", fr: "Téléphone" },
  c_breed: { ar: "السلالة", en: "Breed", fr: "Race" },
  c_gender: { ar: "الجنس", en: "Gender", fr: "Sexe" },
  c_male: { ar: "ذكر", en: "Male", fr: "Mâle" },
  c_female: { ar: "أنثى", en: "Female", fr: "Femelle" },
  c_weight: { ar: "الوزن", en: "Weight", fr: "Poids" },
  c_age: { ar: "العمر", en: "Age", fr: "Âge" },
  c_customer: { ar: "العميل", en: "Customer", fr: "Client" },
  c_supplier: { ar: "المورّد", en: "Supplier", fr: "Fournisseur" },
  c_amount: { ar: "المبلغ", en: "Amount", fr: "Montant" },
  c_available: { ar: "المتوفر", en: "Available", fr: "Disponible" },
  c_remaining: { ar: "المتبقي", en: "Remaining", fr: "Restant" },
  c_required: { ar: "مطلوب", en: "required", fr: "requis" },
  c_unit_price: { ar: "سعر الوحدة", en: "Unit price", fr: "Prix unitaire" },
  c_view_all: { ar: "عرض الكل", en: "View all", fr: "Tout voir" },
  c_no_data: { ar: "لا توجد بيانات", en: "No data", fr: "Aucune donnée" },
  c_error: { ar: "حدث خطأ", en: "An error occurred", fr: "Une erreur est survenue" },
  c_next: { ar: "التالي", en: "Next", fr: "Suivant" },
  c_prev: { ar: "السابق", en: "Previous", fr: "Précédent" },
  c_today: { ar: "اليوم", en: "Today", fr: "Aujourd'hui" },
  c_from: { ar: "من", en: "From", fr: "De" },
  c_to: { ar: "إلى", en: "To", fr: "À" },
  c_cash: { ar: "نقدي", en: "Cash", fr: "Espèces" },
  c_debt: { ar: "دين", en: "Debt", fr: "Dette" },
  c_code: { ar: "الرمز", en: "Code", fr: "Code" },
  c_reason: { ar: "السبب", en: "Reason", fr: "Motif" },
  c_product: { ar: "المنتج", en: "Product", fr: "Produit" },
  c_empty: { ar: "لا يوجد", en: "None", fr: "Aucun" },
  c_details: { ar: "التفاصيل", en: "Details", fr: "Détails" },
  c_history: { ar: "السجل", en: "History", fr: "Historique" },
  c_value: { ar: "القيمة", en: "Value", fr: "Valeur" },
  c_cost: { ar: "التكلفة", en: "Cost", fr: "Coût" },
  c_balance: { ar: "الرصيد", en: "Balance", fr: "Solde" },
  c_pay: { ar: "تسديد", en: "Pay", fr: "Payer" },
  c_collect: { ar: "تحصيل", en: "Collect", fr: "Encaisser" },
  c_ok: { ar: "حسناً", en: "OK", fr: "OK" },
  an_title: { ar: "الحيوانات", en: "Animals", fr: "Animaux" },
  an_sub_buy: { ar: "الشراء من صفحة الشراء", en: "Buy from the Purchases page", fr: "Acheter depuis la page Achats" },
  an_unit_head: { ar: "حيوان", en: "animals", fr: "animaux" },
  an_buy: { ar: "شراء حيوان", en: "Buy animal", fr: "Acheter" },
  an_chicken_msg: { ar: "دجاج بلغ 5 أشهر — أتمم بيانات كل دجاجة بالتفصيل", en: "chickens reached 5 months — complete each one's details", fr: "poulets de 5 mois — complétez les détails de chacun" },
  an_quail_msg: { ar: "سمان بلغ 40 يوماً — تأكيد البلوغ", en: "quail reached 40 days — confirm maturity", fr: "cailles de 40 jours — confirmez la maturité" },
  an_complete: { ar: "إتمام البيانات", en: "Complete data", fr: "Compléter" },
  an_confirm_ok: { ar: "تأكيد ✅", en: "Confirm ✅", fr: "Confirmer ✅" },
  an_batch: { ar: "دفعة", en: "Batch", fr: "Lot" },
  an_chick: { ar: "كتكوت", en: "chicks", fr: "poussins" },
  an_mother: { ar: "الأم", en: "Mother", fr: "Mère" },
  an_day: { ar: "يوم", en: "days", fr: "jours" },
  an_none: { ar: "لا توجد حيوانات", en: "No animals", fr: "Aucun animal" },
  an_none_hint: { ar: "الحيوانات تُشترى من صفحة الشراء وتُولد في صفحة المواليد", en: "Animals are bought from Purchases and born in Births", fr: "Les animaux s'achètent dans Achats et naissent dans Naissances" },
  an_chick_waiting: { ar: "بانتظار البلوغ", en: "Awaiting maturity", fr: "En attente de maturité" },
  an_edit_title: { ar: "تعديل الحيوان", en: "Edit animal", fr: "Modifier l'animal" },
  an_add_title: { ar: "إضافة حيوان", en: "Add animal", fr: "Ajouter un animal" },
  an_tag: { ar: "رقم الوسم", en: "Tag number", fr: "N° de boucle" },
  an_birth: { ar: "تاريخ الميلاد", en: "Birth date", fr: "Date de naissance" },
  an_buy_date: { ar: "تاريخ الشراء", en: "Purchase date", fr: "Date d'achat" },
  an_buy_price: { ar: "سعر الشراء", en: "Purchase price", fr: "Prix d'achat" },
  an_teeth: { ar: "الأسنان", en: "Teeth", fr: "Dents" },
  an_batch_for: { ar: "الدفعة مخصصة لـ", en: "Batch purpose", fr: "Lot destiné à" },
  an_auto_code: { ar: "الرمز التلقائي", en: "Auto code", fr: "Code auto" },
  an_update: { ar: "تحديث", en: "Update", fr: "Mettre à jour" },
  an_del_confirm: { ar: "هل تريد حذف هذا الحيوان؟", en: "Delete this animal?", fr: "Supprimer cet animal ?" },
  an_name_type_req: { ar: "الاسم والنوع مطلوبان", en: "Name and type are required", fr: "Nom et type requis" },
  an_quail_confirm: { ar: "تأكيد بلوغ", en: "Confirm maturity of", fr: "Confirmer la maturité de" },
} as const;

export type TKey = keyof typeof dict;

interface AppCtx {
  lang: Lang;
  theme: Theme;
  setLang: (l: Lang) => void;
  toggleTheme: () => void;
  t: (k: TKey) => string;
}

const Ctx = createContext<AppCtx>({ lang: "ar", theme: "light", setLang: () => {}, toggleTheme: () => {}, t: (k: TKey) => dict[k].ar });

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const l = (localStorage.getItem("app-lang") as Lang) || "ar";
    const th = (localStorage.getItem("app-theme") as Theme) || "light";
    setLangState(["ar", "en", "fr"].includes(l) ? l : "ar");
    setThemeState(th === "dark" ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("app-lang", lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const setLang = (l: Lang) => setLangState(l);
  const toggleTheme = () => setThemeState((t) => (t === "dark" ? "light" : "dark"));
  const t = (k: TKey): string => dict[k][lang] || dict[k].ar;

  return <Ctx.Provider value={{ lang, theme, setLang, toggleTheme, t }}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
