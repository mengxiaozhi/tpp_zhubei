import * as React from "react";

type ButtonVariant = "default" | "outline" | "ghost" | "dark";
type ButtonSize = "default" | "sm" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
  outline:
    "border-primary bg-transparent text-foreground hover:bg-primary hover:text-primary-foreground",
  ghost: "border-transparent bg-transparent text-foreground hover:bg-muted",
  dark: "border-white/20 bg-white/5 text-white hover:border-primary hover:bg-primary hover:text-primary-foreground",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-12 px-6 py-3 text-[15px]",
  sm: "h-10 px-4 text-sm",
  icon: "size-11 p-0",
};

function buttonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  className = "",
) {
  return `inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border font-bold tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export function ButtonLink({
  className = "",
  variant = "default",
  size = "default",
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <a className={buttonClasses(variant, size, className)} {...props} />;
}
