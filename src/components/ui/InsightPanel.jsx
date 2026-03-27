import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InsightPanel({ title, content, loading, className }) {
  return (
    <div className={cn("bg-card rounded-xl border border-border p-6", className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-card-foreground">{title || "AI Insight"}</h3>
      </div>
      {loading ? (
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing your data...</p>
        </div>
      ) : content ? (
        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{content}</div>
      ) : (
        <p className="text-sm text-muted-foreground/60 italic">No insight generated yet. Add data and click generate.</p>
      )}
    </div>
  );
}