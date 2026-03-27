import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { UtensilsCrossed, Users, Building2, DollarSign, TrendingUp, TrendingDown, Clock, Sparkles, Loader2, BarChart3 } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import InsightPanel from "@/components/ui/InsightPanel";
import PageHeader from "@/components/ui/PageHeader";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [aiInsight, setAiInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  const { data: menuItems = [] } = useQuery({ queryKey: ["menuItems"], queryFn: () => base44.entities.MenuItem.list() });
  const { data: shifts = [] } = useQuery({ queryKey: ["shifts"], queryFn: () => base44.entities.Shift.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses"], queryFn: () => base44.entities.OperatingExpense.list() });

  // Food cost
  const totalIngredientCost = menuItems.reduce((s, i) => s + (i.ingredient_cost || 0) * (i.weekly_units_sold || 0), 0);
  const totalRevenue = menuItems.reduce((s, i) => s + (i.sell_price || 0) * (i.weekly_units_sold || 0), 0);
  const foodCostPct = totalRevenue > 0 ? ((totalIngredientCost / totalRevenue) * 100).toFixed(1) : null;

  // Labor cost
  const totalLaborCost = shifts.reduce((s, sh) => s + (sh.labor_cost || 0), 0);
  const totalSales = shifts.reduce((s, sh) => s + (sh.sales || 0), 0);
  const laborCostPct = totalSales > 0 ? ((totalLaborCost / totalSales) * 100).toFixed(1) : null;

  // Fixed expenses
  const latestExpense = expenses[0];
  const totalFixedExpenses = latestExpense
    ? (latestExpense.rent || 0) + (latestExpense.utilities || 0) + (latestExpense.insurance || 0) + (latestExpense.internet_software || 0) + (latestExpense.miscellaneous || 0)
    : 0;
  const breakEvenWeekly = totalFixedExpenses > 0 ? Math.ceil(totalFixedExpenses / 4) : 0;

  // Net margin estimate (weekly)
  const weeklyFoodCost = totalIngredientCost;
  const weeklyLaborCost = totalLaborCost;
  const weeklyFixedCost = Math.ceil(totalFixedExpenses / 4);
  const weeklyRevenue = totalRevenue;
  const netProfit = weeklyRevenue - weeklyFoodCost - weeklyLaborCost - weeklyFixedCost;
  const netMarginPct = weeklyRevenue > 0 ? ((netProfit / weeklyRevenue) * 100).toFixed(1) : null;
  const netMarginPositive = netMarginPct !== null && parseFloat(netMarginPct) >= 0;

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
Estimated Net Margin: ${netMarginPct !== null ? netMarginPct + "%" : "insufficient data"}

Focus on: food margin health, labor efficiency, and fixed cost pressure. Be specific with numbers. Keep it concise — 3 sentences max.`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setAiInsight(res);
    setInsightLoading(false);
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Restaurant performance overview"
        action={
          <Button onClick={generateInsight} disabled={insightLoading} size="sm" className="gap-2">
            {insightLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Generate Insight
          </Button>
        }
      />

      {/* Top Stats — 5 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Food Cost %"
          value={foodCostPct !== null ? `${foodCostPct}%` : "—"}
          icon={UtensilsCrossed}
          subtitle="of revenue"
          valueColor={foodCostPct !== null && parseFloat(foodCostPct) > 35 ? "text-destructive" : undefined}
        />
        <StatCard
          title="Labor Cost %"
          value={laborCostPct !== null ? `${laborCostPct}%` : "—"}
          icon={Users}
          subtitle="of sales"
          valueColor={laborCostPct !== null && parseFloat(laborCostPct) > 30 ? "text-destructive" : undefined}
        />
        <StatCard
          title="Fixed Monthly"
          value={`$${totalFixedExpenses.toLocaleString()}`}
          icon={Building2}
          subtitle="total expenses"
        />
        <StatCard
          title="Break-even / Week"
          value={breakEvenWeekly > 0 ? `$${breakEvenWeekly.toLocaleString()}` : "—"}
          icon={DollarSign}
          subtitle="minimum revenue"
        />
        <StatCard
          title="Net Margin Est."
          value={netMarginPct !== null ? `${netMarginPct}%` : "—"}
          icon={BarChart3}
          subtitle="est. weekly"
          valueColor={netMarginPct !== null ? (netMarginPositive ? "text-[hsl(158,64%,36%)]" : "text-destructive") : undefined}
        />
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-[hsl(158,64%,36%)]/10 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-[hsl(158,64%,36%)]" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Highest Margin</span>
          </div>
          <p className="text-base font-bold text-card-foreground">{highestMargin?.name || "—"}</p>
          <p className="text-sm text-[hsl(158,64%,36%)] font-semibold mt-1">{highestMargin ? `${highestMargin.margin}% margin` : ""}</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-destructive" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Lowest Margin</span>
          </div>
          <p className="text-base font-bold text-card-foreground">{lowestMargin?.name || "—"}</p>
          <p className="text-sm text-destructive font-semibold mt-1">{lowestMargin ? `${lowestMargin.margin}% margin` : ""}</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-[hsl(158,64%,36%)]/10 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-[hsl(158,64%,36%)]" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Best Shift</span>
          </div>
          <p className="text-base font-bold text-card-foreground">{bestShift?.name || "—"}</p>
          <p className="text-sm text-[hsl(158,64%,36%)] font-semibold mt-1">{bestShift ? `${bestShift.laborPct}% labor` : ""}</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-destructive/10 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-destructive" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Weakest Shift</span>
          </div>
          <p className="text-base font-bold text-card-foreground">{worstShift?.name || "—"}</p>
          <p className="text-sm text-destructive font-semibold mt-1">{worstShift ? `${worstShift.laborPct}% labor` : ""}</p>
        </div>
      </div>

      {/* AI Insight */}
      <InsightPanel title="AI Revenue Insight — Executive Summary" content={aiInsight} loading={insightLoading} />
    </div>
  );
}