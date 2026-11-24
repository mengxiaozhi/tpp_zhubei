import type { Metadata, Viewport } from "next";
import Link from "next/link";

import { CampaignBrand } from "@/components/campaign-brand";
import { StreetRunner } from "@/components/street-runner";
import { projectCopyright, projectSourceUrl } from "@/lib/copyright";

import styles from "@/components/street-runner.module.css";

export const metadata: Metadata = {
  title: "竹北 6F 街區跑酷｜劉文軒",
  description: "在竹北 3D 街區換道、跳躍，體驗轉乘、照明到號誌備援等六個政見任務。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#302631",
};

export default function GamePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" aria-label="劉文軒首頁"><CampaignBrand /></Link>
        <Link className={styles.back} href="/"><span aria-hidden="true">←</span> 回網站</Link>
      </header>
      <main className={styles.main}>
        <h1>竹北 6F 街區跑酷</h1>
        <p className={styles.intro}>跑過六個 3D 街區，體驗六個政見任務。</p>
        <StreetRunner />
      </main>
      <footer className={styles.footer}>
        <p>{projectCopyright}｜網站與遊戲設計</p>
        <a href={projectSourceUrl}>GitHub 原始碼</a>
      </footer>
    </div>
  );
}
