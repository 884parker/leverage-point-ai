import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Zap, TrendingUp, RefreshCw } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

export default function RevenueActions() {
  const [actionPlan, setActionPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: menuItems = [] } = useQuery({
    queryKey: ["menuItems"],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts"],
    queryFn: () => base44.entities.Shift.list(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.OperatingExpense.list(),
  });

  const generateActionPlan = async () => {
    setLoading(true);

    const enrichedItems = menuItems.map((i) => ({
      name: i.name,
      cost: i.ingredient_cost,
      price: i.sell_price,
      margin: i.sell_price > 0 ? (((i.sell_price - i.ingredient_cost) / i.sell_price) * 100).toFixed(1) + "%" : "0%",
      weeklyUnits: i.weekly_units_sold,
    }));

    const enrichedShifts = shifts.map((s) => ({
      name: s.name,
      laborCost: s.labor_cost,
      sales: s.sales,
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

  const sections = [
    { key: "immediate_actions", title: "Immediate Actions This Week", icon: Zap, color: "text-primary" },
    { key: "margin_opportunities", title: "Margin Opportunities", icon: TrendingUp, color: "text-chart-2" },
    { key: "revenue_recovery", title: "Revenue Recovery Opportunities", icon: RefreshCw, color: "text-chart-3" },
  ];

  return (
    <div>
      <PageHeader title="Revenue Actions" description="AI-generated action plan to improve your margins and revenue" />

      <div className="flex justify-end mb-8">
        <Button onClick={generateActionPlan} disabled={loading || !hasData} size="lg" className="gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          Generate Revenue Action Plan
        </Button>
      </div>

      {!hasData && !actionPlan && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">Add menu items, shifts, and expenses first, then generate your action plan.</p>
        </div>
      )}

      {loading && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing your restaurant data...</p>
        </div>
      )}

      {actionPlan && !loading && (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.key} className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <section.icon className={`w-5 h-5 ${section.color}`} />
                </div>
                <h3 className="text-base font-semibold text-card-foreground">{section.title}</h3>
              </div>
              <div className="space-y-3">
                {(actionPlan[section.key] || []).map((action, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{idx + 1}</span>
                    </span>
                    <p className="text-sm text-card-foreground leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}