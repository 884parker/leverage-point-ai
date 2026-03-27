import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Save } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import InsightPanel from "@/components/ui/InsightPanel";
import StatCard from "@/components/ui/StatCard";
import { Building2, DollarSign, CalendarDays } from "lucide-react";

export default function OperatingExpenses() {
  const queryClient = useQueryClient();
  const [aiInsight, setAiInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.OperatingExpense.list(),
  });

  const latestExpense = expenses[0];

  const [form, setForm] = useState({
    rent: latestExpense?.rent || "",
    utilities: latestExpense?.utilities || "",
    insurance: latestExpense?.insurance || "",
    internet_software: latestExpense?.internet_software || "",
    miscellaneous: latestExpense?.miscellaneous || "",
  });

  // Sync form when data loads
  const formInitialized = useState(false);
  if (latestExpense && !formInitialized[0]) {
    setForm({
      rent: latestExpense.rent || "",
      utilities: latestExpense.utilities || "",
      insurance: latestExpense.insurance || "",
      internet_software: latestExpense.internet_software || "",
      miscellaneous: latestExpense.miscellaneous || "",
    });
    formInitialized[1](true);
  }

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OperatingExpense.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OperatingExpense.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const handleSave = () => {
    const data = {
      rent: parseFloat(form.rent) || 0,
      utilities: parseFloat(form.utilities) || 0,
      insurance: parseFloat(form.insurance) || 0,
      internet_software: parseFloat(form.internet_software) || 0,
      miscellaneous: parseFloat(form.miscellaneous) || 0,
    };
    if (latestExpense) {
      updateMutation.mutate({ id: latestExpense.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const total = (parseFloat(form.rent) || 0) + (parseFloat(form.utilities) || 0) + (parseFloat(form.insurance) || 0) + (parseFloat(form.internet_software) || 0) + (parseFloat(form.miscellaneous) || 0);
  const weeklyBreakEven = total > 0 ? Math.ceil(total / 4) : 0;
  const dailyBreakEven = total > 0 ? Math.ceil(total / 30) : 0;

  const generateInsight = async () => {
    setInsightLoading(true);
    const prompt = `You are a restaurant operating expense consultant for Leverage Point AI. Analyze these monthly fixed expenses:

Rent: $${form.rent || 0}
Utilities: $${form.utilities || 0}
Insurance: $${form.insurance || 0}
Internet/Software: $${form.internet_software || 0}
Miscellaneous: $${form.miscellaneous || 0}
Total: $${total}
Weekly Break-even: $${weeklyBreakEven}
Daily Break-even: $${dailyBreakEven}

Provide a 3-4 sentence analysis of the fixed cost structure and what revenue level is needed before profit begins. Include the specific weekly and daily break-even numbers.`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setAiInsight(res);
    setInsightLoading(false);
  };

  const fields = [
    { key: "rent", label: "Rent" },
    { key: "utilities", label: "Utilities" },
    { key: "insurance", label: "Insurance" },
    { key: "internet_software", label: "Internet / Software" },
    { key: "miscellaneous", label: "Miscellaneous" },
  ];

  return (
    <div>
      <PageHeader title="Operating Expenses" description="Track fixed monthly costs and break-even targets" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard title="Total Monthly" value={`$${total.toLocaleString()}`} icon={Building2} />
        <StatCard title="Weekly Break-even" value={weeklyBreakEven > 0 ? `$${weeklyBreakEven.toLocaleString()}` : "—"} icon={DollarSign} />
        <StatCard title="Daily Break-even" value={dailyBreakEven > 0 ? `$${dailyBreakEven.toLocaleString()}` : "—"} icon={CalendarDays} />
      </div>

      {/* Expense Form */}
      <div className="bg-card rounded-xl border border-border p-6 mb-8">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">Monthly Fixed Expenses</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} size="sm" className="gap-1.5">
            <Save className="w-4 h-4" /> Save Expenses
          </Button>
        </div>
      </div>

      {/* AI Insight */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Expense Insight</h2>
          <Button onClick={generateInsight} disabled={insightLoading || total === 0} className="gap-2">
            {insightLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Expense Insight
          </Button>
        </div>
        <InsightPanel title="Fixed Cost Analysis" content={aiInsight} loading={insightLoading} />
      </div>
    </div>
  );
}