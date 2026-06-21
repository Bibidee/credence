import { cn } from "@/lib/utils/cn";

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      {icon && <div className="mb-4 text-[rgba(17,17,17,0.2)]">{icon}</div>}
      <p className="font-heading font-bold text-[15px] text-ink mb-1">{title}</p>
      {description && <p className="text-[13px] text-muted-ink max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
