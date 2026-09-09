export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "0.00 دج";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0.00 دج";
  return new Intl.NumberFormat("ar-DZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num) + " دج";
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ar-DZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function getAnimalLabel(type: string): string {
  const labels: Record<string, string> = {
    cow: "أبقار",
    goat: "ماعز",
    sheep: "أغنام",
    chicken: "دجاج",
    quail: "سمان",
  };
  return labels[type] || type;
}

export function getAnimalEmoji(type: string): string {
  const emojis: Record<string, string> = {
    cow: "🐄",
    goat: "🐐",
    sheep: "🐑",
    chicken: "🐔",
    quail: "🦅",
  };
  return emojis[type] || "🐾";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "نشط",
    sold: "مباع",
    dead: "نافق",
    healthy: "صحي",
    sick: "مريض",
    treatment: "تحت العلاج",
    recovered: "تعافى",
    paid: "مدفوع",
    pending: "معلق",
    partial: "جزئي",
    owed_to_us: "لنا",
    we_owe: "علينا",
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    sold: "bg-blue-100 text-blue-700",
    dead: "bg-gray-100 text-gray-600",
    healthy: "bg-green-100 text-green-700",
    sick: "bg-red-100 text-red-700",
    treatment: "bg-amber-100 text-amber-700",
    recovered: "bg-emerald-100 text-emerald-700",
    paid: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    partial: "bg-orange-100 text-orange-700",
    owed_to_us: "bg-blue-100 text-blue-700",
    we_owe: "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
}

export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}
