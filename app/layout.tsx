import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
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
        url: "/images/liu-wen-hsuan-hero.png",
        width: 1672,
        height: 941,
        alt: "劉文軒候選人形象照",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101719",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant-TW">
      <body>{children}</body>
    </html>
  );
}
