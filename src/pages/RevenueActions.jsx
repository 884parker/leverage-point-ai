import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Zap, TrendingUp, RefreshCw } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

const sections = [
  {
    key: "immediate_actions",
    title: "Immediate Actions This Week",
    icon: Zap,
    placeholder: [
      "Review pricing on your lowest-margin menu items",
      "Audit staffing levels for your weakest labor shift",
      "Identify top-selling high-margin items to promote",
    ],
  },
  {
    key: "margin_opportunities",
    title: "Margin Opportunities",
    icon: TrendingUp,
    placeholder: [
      "Raise price by $1–2 on items with margin below 30%",
      "Promote high-margin appetizers and sides more aggressively",
      "Negotiate ingredient pricing for your highest-cost items",
    ],
  },
  {
    key: "revenue_recovery",
    title: "Revenue Recovery Opportunities",
    icon: RefreshCw,
    placeholder: [
      "Run a weekday lunch special to strengthen slow shifts",
      "Add a premium upsell option to your top-selling entrée",
      "Create a limited-time bundle around your best margin item",
    ],
  },
];

function ActionCard({ section, items, isPlaceholder }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
          <section.icon className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-card-foreground">{section.title}</h3>
        {isPlaceholder && (
          <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Preview</span>
        )}
      </div>
      <div className="p-5 space-y-2.5">
        {items.map((action, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              isPlaceholder ? "bg-muted/30 opacity-50" : "bg-muted/50"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-primary">{idx + 1}</span>
            </span>
            <p className={`text-sm leading-relaxed ${isPlaceholder ? "text-muted-foreground/60 italic" : "text-card-foreground"}`}>
              {action}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RevenueActions() {
  const [actionPlan, setActionPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: menuItems = [] } = useQuery({ queryKey: ["menuItems"], queryFn: () => base44.entities.MenuItem.list() });
  const { data: shifts = [] } = useQuery({ queryKey: ["shifts"], queryFn: () => base44.entities.Shift.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses"], queryFn: () => base44.entities.OperatingExpense.list() });

  const generateActionPlan = async () => {
    setLoading(true);
    const enrichedItems = menuItems.map((i) => ({
      name: i.name, cost: i.ingredient_cost, price: i.sell_price,
      margin: i.sell_price > 0 ? (((i.sell_price - i.ingredient_cost) / i.sell_price) * 100).toFixed(1) + "%" : "0%",
      weeklyUnits: i.weekly_units_sold,
    }));
    const enrichedShifts = shifts.map((s) => ({
      name: s.name, laborCost: s.labor_cost, sales: s.sales,
      laborPct: s.sales > 0 ? ((s.labor_cost / s.sales) * 100).toFixed(1) + "%" : "N/A",
    }));
    const latestExpense = expenses[0];
    const totalExpenses = latestExpense
      ? (latestExpense.rent || 0) + (latestExpense.utilities || 0) + (latestExpense.insurance || 0) + (latestExpense.internet_software || 0) + (latestExpense.miscellaneous || 0)
      : 0;

    const prompt = `You are a premium restaurant revenue consultant for Leverage Point AI. Generate a Revenue Action Plan using all available data.

Menu Items: ${JSON.stringify(enrichedItems)}
Shifts: ${JSON.stringify(enrichedShifts)}
Monthly Fixed Expenses: $${totalExpenses}

Return a JSON object with exactly this structure:
{
  "immediate_actions": ["action 1", "action 2", "action 3"],
  "margin_opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "revenue_recovery": ["recovery 1", "recovery 2", "recovery 3"]
}

Each array should have 3-5 specific, actionable items using real data points (item names, shift names, percentages).
Be very specific — reference actual menu items and shifts by name with real numbers.`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          immediate_actions: { type: "array", items: { type: "string" } },
          margin_opportunities: { type: "array", items: { type: "string" } },
          revenue_recovery: { type: "array", items: { type: "string" } },
        },
      },
    });

    setActionPlan(res);
    setLoading(false);
  };

  const hasData = menuItems.length > 0 || shifts.length > 0;

  return (
    <div>
      <PageHeader
        title="Revenue Actions"
        description="AI-generated action plan to improve your margins and revenue"
        action={
          <Button onClick={generateActionPlan} disabled={loading || !hasData} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Revenue Action Plan
          </Button>
        }
      />

      {loading && (
        <div className="bg-card rounded-xl border border-border p-12 text-center mb-6">
          <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Analyzing your restaurant data...</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-5">
          {sections.map((section) => {
            const hasResult = actionPlan && actionPlan[section.key]?.length > 0;
            return (
              <ActionCard
                key={section.key}
                section={section}
                items={hasResult ? actionPlan[section.key] : section.placeholder}
                isPlaceholder={!hasResult}
              />
            );
          })}
        </div>
      )}

      {!hasData && (
        <p className="text-xs text-center text-muted-foreground/50 mt-6">
          Add menu items, shifts, and expenses to generate a personalized plan.
        </p>
      )}
    </div>
  );
}