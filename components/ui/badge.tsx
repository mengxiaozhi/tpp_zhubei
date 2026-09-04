import * as React from "react";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  inverse?: boolean;
};

export function Badge({ inverse = false, className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex min-h-7 shrink-0 items-center justify-center border px-2.5 text-xs font-bold tracking-[0.06em] ${
        inverse
          ? "border-primary/70 text-primary"
          : "border-primary/70 bg-white text-foreground"
      } ${className}`}
      {...props}
    />
  );
}
