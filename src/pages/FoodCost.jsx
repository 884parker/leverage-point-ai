import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import InsightPanel from "@/components/ui/InsightPanel";
import MenuItemForm from "@/components/food/MenuItemForm";
import MenuItemTable from "@/components/food/MenuItemTable";

export default function FoodCost() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState(null);
  const [aiInsight, setAiInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  const { data: menuItems = [] } = useQuery({
    queryKey: ["menuItems"],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MenuItem.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menuItems"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MenuItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MenuItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menuItems"] }),
  });

  const generateInsight = async () => {
    if (menuItems.length === 0) return;
    setInsightLoading(true);
    const enriched = menuItems.map((i) => ({
      name: i.name,
      cost: i.ingredient_cost,
      price: i.sell_price,
      profit: (i.sell_price - i.ingredient_cost).toFixed(2),
      margin: i.sell_price > 0 ? (((i.sell_price - i.ingredient_cost) / i.sell_price) * 100).toFixed(1) + "%" : "0%",
      weeklyUnits: i.weekly_units_sold,
      weeklyGross: ((i.sell_price - i.ingredient_cost) * i.weekly_units_sold).toFixed(2),
    }));

    const prompt = `You are a restaurant food cost consultant for Leverage Point AI. Analyze these menu items and provide actionable insights:

${JSON.stringify(enriched, null, 2)}

Identify:
1. Low margin items that need repricing
2. Hidden profit leaders (high margin + high volume)
3. Items that should be promoted more
4. Items that may need repricing or removal

Be specific with item names and numbers. Keep it concise and actionable (5-8 bullet points).`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setAiInsight(res);
    setInsightLoading(false);
  };

  return (
    <div>
      <PageHeader title="Food Cost Analysis" description="Track menu item costs, margins, and profitability" />

      {editingItem ? (
        <MenuItemForm
          initial={{
            name: editingItem.name,
            ingredient_cost: editingItem.ingredient_cost,
            sell_price: editingItem.sell_price,
            weekly_units_sold: editingItem.weekly_units_sold,
          }}
          onSubmit={(data) => updateMutation.mutate({ id: editingItem.id, data })}
          onCancel={() => setEditingItem(null)}
        />
      ) : (
        <MenuItemForm onSubmit={(data) => createMutation.mutate(data)} />
      )}

      <MenuItemTable items={menuItems} onEdit={setEditingItem} onDelete={(id) => deleteMutation.mutate(id)} />

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Food Cost Insight</h2>
          <Button onClick={generateInsight} disabled={insightLoading || menuItems.length === 0} className="gap-2">
            {insightLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Food Cost Insight
          </Button>
        </div>
        <InsightPanel title="Menu Analysis" content={aiInsight} loading={insightLoading} />
      </div>
    </div>
  );
}