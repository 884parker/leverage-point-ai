import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InsightPanel({ title, content, loading, className }) {
  return (
    <div className={cn("bg-card rounded-xl border border-border overflow-hidden", className)}>
      {/* Header bar */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-muted/40">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title || "AI Insight"}</h3>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="flex items-center gap-3 py-3">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing your data...</p>
          </div>
        ) : content ? (
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{content}</div>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">No insight generated yet. Add data and click generate.</p>
        )}
      </div>
    </div>
  );
}