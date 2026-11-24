import { projectSourceUrl } from "@/lib/copyright";

import { CampaignBrand } from "./campaign-brand";
import styles from "./site-chrome.module.css";

const footerLinks = [
  { href: "#about", label: "認識文軒" },
  { href: "#policies", label: "6F 政見" },
  { href: projectSourceUrl, label: "GitHub 原始碼" },
  { href: "#top", label: "回到頂端" },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`site-container ${styles.footerMain}`}>
        <div className={styles.footerBrand}>
          <CampaignBrand />
        </div>
        <div className={styles.footerIdentity}>
          <p>竹北市第二選區</p>
          <p>台灣民眾黨推薦</p>
        </div>
        <nav aria-label="頁尾導覽" className={styles.footerNav}>
          {footerLinks.map(({ href, label }) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
      </div>
      <div className={styles.footerSource}>
        <div className={`site-container ${styles.footerNotes}`}>
          <p>資料來源｜竹北市第十一屆市民代表選舉第二選區選舉公報（9 號劉文軒）。</p>
          <p>劉訊志授權給劉文軒使用</p>
        </div>
      </div>
    </footer>
  );
}
