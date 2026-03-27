import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, className, valueColor }) {
  return (
    <div className={cn("bg-card rounded-xl border border-border p-5 relative overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
          <p className={cn("text-2xl font-bold tracking-tight", valueColor || "text-card-foreground")}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}