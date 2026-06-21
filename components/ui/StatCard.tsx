import { cn } from "@/lib/utils/cn";

export default function StatCard({
  label,
  value,
  sub,
  accent,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "gold" | "blue" | "green" | "red" | "amber";
  className?: string;
}) {
  const accentColor = {
    gold: "#D6A84F",
    blue: "#2457FF",
    green: "#2E9D68",
    red: "#C8342D",
    amber: "#F2A93B",
  }[accent ?? "gold"];

  return (
    <div className={cn("panel p-4 flex flex-col gap-1", className)}>
      <p className="text-[10px] font-financial uppercase tracking-widest text-muted-ink">{label}</p>
      <p className="font-heading font-bold text-2xl text-ink" style={accent ? { color: accentColor } : {}}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-ink">{sub}</p>}
    </div>
  );
}
