"use client";
// Boots the offline SQLite database as soon as the app hydrates.
// The fetch bridge is installed by "@/lib/offline-api" at module load (already
// armed by the time any page effect can fire). This component only kicks off
// the async DB creation, and renders nothing.
import { useEffect } from "react";
import { initOfflineDB } from "@/db/local";
import "@/lib/offline-api";

export default function OfflineInit() {
  useEffect(() => {
    initOfflineDB().catch((e) => {
      console.error("[offline] DB init failed:", e);
    });
  }, []);
  return null;
}