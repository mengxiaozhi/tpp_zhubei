"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

const navItems = [
  { href: "#about", label: "認識文軒" },
  { href: "#policies", label: "6F 政見" },
  { href: "#action", label: "一起行動" },
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
      className="size-5"
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <a
          href="#top"
          aria-label="劉文軒首頁"
          className="font-display text-2xl font-black tracking-[-0.05em] text-foreground"
          onClick={() => setOpen(false)}
        >
          劉文軒<span className="ml-2 text-xs font-bold tracking-[0.16em] text-primary">LIU</span>
        </a>

        <nav aria-label="主要導覽" className="hidden items-center gap-9 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[15px] font-bold tracking-[0.04em] text-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href="#policies"
          className="hidden h-11 items-center justify-center border border-primary bg-primary px-5 text-sm font-bold tracking-[0.06em] text-primary-foreground transition-colors hover:bg-primary/90 md:inline-flex"
        >
          看見改變
        </a>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={open ? "關閉選單" : "開啟選單"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
          className="md:hidden"
        >
          <MenuIcon open={open} />
        </Button>
      </div>

      {open ? (
        <nav
          id="mobile-navigation"
          aria-label="行動版導覽"
          className="border-t border-border bg-background px-5 py-4 md:hidden"
        >
          <div className="mx-auto flex max-w-[1440px] flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="border-b border-border px-1 py-4 text-base font-bold"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
