import * as React from "react";

export function Separator({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={`h-px w-full bg-border ${className}`}
      {...props}
    />
  );
}
