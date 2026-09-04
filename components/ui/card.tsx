import * as React from "react";

type CardTone = "light" | "mint" | "dark";

const toneClasses: Record<CardTone, string> = {
  light: "border-border bg-card text-card-foreground",
  mint: "border-primary/15 bg-secondary text-secondary-foreground",
  dark: "border-white/10 bg-foreground text-white",
};

export function Card({
  tone = "light",
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: CardTone }) {
  return (
    <article
      className={`border shadow-[0_1px_0_rgba(15,23,25,0.02)] transition-transform duration-300 hover:-translate-y-1 ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col gap-3 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`font-bold ${className}`} {...props} />;
}

export function CardDescription({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm leading-relaxed opacity-70 ${className}`} {...props} />;
}

export function CardContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}
