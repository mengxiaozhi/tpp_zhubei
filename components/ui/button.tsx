import * as React from "react";

type ButtonVariant = "default" | "outline" | "ghost" | "dark";
type ButtonSize = "default" | "sm" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
  outline:
    "border-primary/40 bg-transparent text-primary hover:border-primary hover:bg-secondary",
  ghost: "border-transparent bg-transparent text-foreground hover:bg-muted",
  dark: "border-white/40 bg-white/10 text-white hover:border-white hover:bg-white hover:text-primary",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "min-h-12 px-3 py-2.5 text-sm sm:px-5",
  sm: "h-10 px-4 text-sm",
  icon: "size-11 p-0",
};

export function buttonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  className = "",
) {
  return `inline-flex shrink-0 items-center justify-center gap-2 rounded-full border font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.1rem] [&_svg]:shrink-0 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
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
