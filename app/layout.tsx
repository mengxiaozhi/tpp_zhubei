import type { Metadata, Viewport } from "next";

import { shareCardSiteUrl } from "@/lib/share-card";

import "./globals.css";
import "./editorial.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? shareCardSiteUrl),
  title: "劉文軒｜6F 行動政見",
  description:
    "劉文軒，台灣民眾黨。以 FAST、FAMILY、FAIR、FUTURE、FRESH、FIX 六大行動政見，推動效率、家園、公平、未來、清新與改革。",
  openGraph: {
    title: "劉文軒｜6F 行動政見",
    description: "六個 F，讓改變真正發生。",
    type: "website",
    locale: "zh_TW",
    images: [
      {
        url: "/images/liu-wen-hsuan-campaign.jpg",
        width: 1920,
        height: 1080,
        alt: "劉文軒候選人主視覺",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fffaf3",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant-TW">
      <body>{children}</body>
    </html>
  );
}
