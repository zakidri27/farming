import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import ResponsiveLayout from "@/components/ResponsiveLayout";
import OfflineInit from "@/components/OfflineInit";

export const metadata: Metadata = {
  title: "مزرعتي - إدارة المزرعة",
  description: "تطبيق إدارة مزرعة متكامل للحيوانات والمالية",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <title>مزرعتي - إدارة المزرعة</title>
        <meta name="description" content="تطبيق إدارة مزرعة متكامل للحيوانات والمالية" />
      </head>
      <body className="bg-green-50 text-gray-900 antialiased">
        <OfflineInit />
        <ResponsiveLayout>{children}</ResponsiveLayout>
      </body>
    </html>
  );
}
