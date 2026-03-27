import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { UtensilsCrossed, Users, Building2, DollarSign, TrendingUp, TrendingDown, Clock, Sparkles, Loader2 } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import InsightPanel from "@/components/ui/InsightPanel";
import PageHeader from "@/components/ui/PageHeader";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [aiInsight, setAiInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

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

  // Calculations
  const totalIngredientCost = menuItems.reduce((s, i) => s + (i.ingredient_cost || 0) * (i.weekly_units_sold || 0), 0);
  const totalRevenue = menuItems.reduce((s, i) => s + (i.sell_price || 0) * (i.weekly_units_sold || 0), 0);
  const foodCostPct = totalRevenue > 0 ? ((totalIngredientCost / totalRevenue) * 100).toFixed(1) : "—";

  const totalLaborCost = shifts.reduce((s, sh) => s + (sh.labor_cost || 0), 0);
  const totalSales = shifts.reduce((s, sh) => s + (sh.sales || 0), 0);
  const laborCostPct = totalSales > 0 ? ((totalLaborCost / totalSales) * 100).toFixed(1) : "—";

  const latestExpense = expenses[0];
  const totalFixedExpenses = latestExpense
    ? (latestExpense.rent || 0) + (latestExpense.utilities || 0) + (latestExpense.insurance || 0) + (latestExpense.internet_software || 0) + (latestExpense.miscellaneous || 0)
    : 0;

  const breakEvenWeekly = totalFixedExpenses > 0 ? Math.ceil(totalFixedExpenses / 4) : 0;

  // Menu item analysis
  const enrichedItems = menuItems.map((i) => ({
    ...i,
    profit: (i.sell_price || 0) - (i.ingredient_cost || 0),
    margin: i.sell_price > 0 ? (((i.sell_price - i.ingredient_cost) / i.sell_price) * 100).toFixed(1) : 0,
  }));
  const sorted = [...enrichedItems].sort((a, b) => parseFloat(b.margin) - parseFloat(a.margin));
  const highestMargin = sorted[0];
  const lowestMargin = sorted[sorted.length - 1];

  // Shift analysis
  const enrichedShifts = shifts.map((s) => ({
    ...s,
    laborPct: s.sales > 0 ? ((s.labor_cost / s.sales) * 100).toFixed(1) : 0,
  }));
  const sortedShifts = [...enrichedShifts].sort((a, b) => parseFloat(a.laborPct) - parseFloat(b.laborPct));
  const bestShift = sortedShifts[0];
  const worstShift = sortedShifts[sortedShifts.length - 1];

  const generateInsight = async () => {
    setInsightLoading(true);
    const prompt = `You are a restaurant business consultant for Leverage Point AI. Analyze this data and give a 3-4 sentence executive summary:

Menu Items: ${JSON.stringify(enrichedItems.map(i => ({ name: i.name, cost: i.ingredient_cost, price: i.sell_price, margin: i.margin + "%", weeklyUnits: i.weekly_units_sold })))}
Shifts: ${JSON.stringify(enrichedShifts.map(s => ({ name: s.name, laborCost: s.labor_cost, sales: s.sales, laborPct: s.laborPct + "%" })))}
Fixed Monthly Expenses: $${totalFixedExpenses}
Weekly Break-even: $${breakEvenWeekly}

Focus on: food margin health, labor efficiency, and fixed cost pressure. Be specific with numbers.`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setAiInsight(res);
    setInsightLoading(false);
  };

  return (
    <div>
      <PageHeader title="Dashboard" description="Restaurant performance overview at a glance" />

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Food Cost %" value={foodCostPct === "—" ? "—" : `${foodCostPct}%`} icon={UtensilsCrossed} subtitle="of revenue" />
        <StatCard title="Labor Cost %" value={laborCostPct === "—" ? "—" : `${laborCostPct}%`} icon={Users} subtitle="of sales" />
        <StatCard title="Fixed Monthly" value={`$${totalFixedExpenses.toLocaleString()}`} icon={Building2} subtitle="total expenses" />
        <StatCard title="Break-even / Week" value={breakEvenWeekly > 0 ? `$${breakEvenWeekly.toLocaleString()}` : "—"} icon={DollarSign} subtitle="minimum revenue" />
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Highest Margin</span>
          </div>
          <p className="text-lg font-bold text-card-foreground">{highestMargin?.name || "—"}</p>
          <p className="text-sm text-primary font-semibold mt-1">{highestMargin ? `${highestMargin.margin}% margin` : ""}</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lowest Margin</span>
          </div>
          <p className="text-lg font-bold text-card-foreground">{lowestMargin?.name || "—"}</p>
          <p className="text-sm text-destructive font-semibold mt-1">{lowestMargin ? `${lowestMargin.margin}% margin` : ""}</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Best Shift</span>
          </div>
          <p className="text-lg font-bold text-card-foreground">{bestShift?.name || "—"}</p>
          <p className="text-sm text-primary font-semibold mt-1">{bestShift ? `${bestShift.laborPct}% labor` : ""}</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-destructive" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weakest Shift</span>
          </div>
          <p className="text-lg font-bold text-card-foreground">{worstShift?.name || "—"}</p>
          <p className="text-sm text-destructive font-semibold mt-1">{worstShift ? `${worstShift.laborPct}% labor` : ""}</p>
        </div>
      </div>

      {/* AI Insight */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">AI Revenue Insight</h2>
          <Button onClick={generateInsight} disabled={insightLoading} className="gap-2">
            {insightLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Insight
          </Button>
        </div>
        <InsightPanel title="Executive Summary" content={aiInsight} loading={insightLoading} />
      </div>
    </div>
  );
}