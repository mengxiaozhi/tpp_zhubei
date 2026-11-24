"use client";

import { useRef, useState } from "react";

import { CampaignBrand } from "./campaign-brand";
import { ShareCardLink } from "./share-card-link";
import styles from "./site-chrome.module.css";

const navItems = [
  { href: "#about", label: "認識文軒" },
  { href: "#video", label: "影片" },
  { href: "#policies", label: "6F 政見" },
  { href: "/game", label: "街區跑酷" },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={styles.menuIcon}
    >
      {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  return (
    <header
      className={styles.header}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          toggleRef.current?.focus();
        }
      }}
    >
      <a href="#top" className={styles.skipLink}>
        跳至主要內容
      </a>
      <div className={`site-container ${styles.headerInner}`}>
        <a href="#top" aria-label="劉文軒首頁" onClick={() => setOpen(false)}>
          <CampaignBrand />
        </a>

        <nav aria-label="主要導覽" className={styles.desktopNav}>
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={styles.navLink}
            >
              {item.label}
            </a>
          ))}
          <ShareCardLink className={styles.navLink}>竹北小卡</ShareCardLink>
          <a href="#action" className={styles.actionLink}>
            一起行動
            <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.actionArrow}>
              <path d="M3.5 12h16m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          aria-label={open ? "關閉選單" : "開啟選單"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
          className={styles.menuToggle}
        >
          <MenuIcon open={open} />
        </button>
      </div>

      <nav
        id="mobile-navigation"
        aria-label="行動版導覽"
        hidden={!open}
        className={styles.mobileNav}
      >
        <div className="site-container">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={styles.mobileLink}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <ShareCardLink className={styles.mobileLink} onClick={() => setOpen(false)}>竹北小卡</ShareCardLink>
          <a href="#action" className={styles.mobileLink} onClick={() => setOpen(false)}>一起行動</a>
        </div>
      </nav>
    </header>
  );
}
