import { cn } from "@/lib/utils/cn";

type Variant = "default" | "gold" | "blue" | "red" | "green" | "amber" | "grey" | "ink";

const VARIANTS: Record<Variant, string> = {
  default: "bg-[rgba(17,17,17,0.06)] text-ink border-[rgba(17,17,17,0.12)]",
  gold: "bg-[rgba(214,168,79,0.12)] text-[#B8882A] border-[rgba(214,168,79,0.3)]",
  blue: "bg-[rgba(36,87,255,0.08)] text-[#2457FF] border-[rgba(36,87,255,0.2)]",
  red: "bg-[rgba(200,52,45,0.08)] text-[#C8342D] border-[rgba(200,52,45,0.2)]",
  green: "bg-[rgba(46,157,104,0.08)] text-[#2E9D68] border-[rgba(46,157,104,0.2)]",
  amber: "bg-[rgba(242,169,59,0.1)] text-[#C87E1A] border-[rgba(242,169,59,0.25)]",
  grey: "bg-[rgba(139,138,132,0.12)] text-[#8B8A84] border-[rgba(139,138,132,0.2)]",
  ink: "bg-ink text-canvas border-ink",
};

export default function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 border text-[10px] font-financial uppercase tracking-widest",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
