import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import InsightPanel from "@/components/ui/InsightPanel";
import ShiftForm from "@/components/labor/ShiftForm";
import ShiftTable from "@/components/labor/ShiftTable";

export default function LaborCost() {
  const queryClient = useQueryClient();
  const [editingShift, setEditingShift] = useState(null);
  const [aiInsight, setAiInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts"],
    queryFn: () => base44.entities.Shift.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Shift.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Shift.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      setEditingShift(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Shift.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });

  const generateInsight = async () => {
    if (shifts.length === 0) return;
    setInsightLoading(true);
    const enriched = shifts.map((s) => ({
      name: s.name,
      laborCost: s.labor_cost,
      sales: s.sales,
      laborPct: s.sales > 0 ? ((s.labor_cost / s.sales) * 100).toFixed(1) + "%" : "N/A",
    }));

    const prompt = `You are a restaurant labor cost consultant for Leverage Point AI. Analyze these shift performance numbers:

${JSON.stringify(enriched, null, 2)}

Identify:
1. Overstaffed shifts (labor % above 30%)
2. Strongest labor efficiency shifts
3. Weak shifts needing correction
4. Specific staffing recommendations

Be specific with shift names and numbers. Keep it concise and actionable (5-8 bullet points).`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setAiInsight(res);
    setInsightLoading(false);
  };

  return (
    <div>
      <PageHeader title="Labor Cost Analysis" description="Track shift labor costs and efficiency" />

      {editingShift ? (
        <ShiftForm
          initial={{ name: editingShift.name, labor_cost: editingShift.labor_cost, sales: editingShift.sales }}
          onSubmit={(data) => updateMutation.mutate({ id: editingShift.id, data })}
          onCancel={() => setEditingShift(null)}
        />
      ) : (
        <ShiftForm onSubmit={(data) => createMutation.mutate(data)} />
      )}

      <ShiftTable shifts={shifts} onEdit={setEditingShift} onDelete={(id) => deleteMutation.mutate(id)} />

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Labor Insight</h2>
          <Button onClick={generateInsight} disabled={insightLoading || shifts.length === 0} className="gap-2">
            {insightLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Labor Insight
          </Button>
        </div>
        <InsightPanel title="Shift Analysis" content={aiInsight} loading={insightLoading} />
      </div>
    </div>
  );
}