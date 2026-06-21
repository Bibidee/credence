import { cn } from "@/lib/utils/cn";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-canvas hover:bg-ledger-black",
  secondary: "bg-panel-cream text-ink border border-[rgba(17,17,17,0.16)] hover:border-ink",
  ghost: "text-ink hover:bg-[rgba(17,17,17,0.05)]",
  danger: "bg-[#C8342D] text-white hover:bg-[#a82920]",
  gold: "bg-[#D6A84F] text-[#15130F] hover:bg-[#c09640] font-bold",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    const sizeClass = { sm: "px-3 py-1.5 text-[12px]", md: "px-4 py-2 text-[13px]", lg: "px-6 py-3 text-[14px]" }[size];
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2 font-body transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
          VARIANTS[variant],
          sizeClass,
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
export default Button;
