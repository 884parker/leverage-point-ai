import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, FileText, Download } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { jsPDF } from "jspdf";

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: menuItems = [] } = useQuery({ queryKey: ["menuItems"], queryFn: () => base44.entities.MenuItem.list() });
  const { data: shifts = [] } = useQuery({ queryKey: ["shifts"], queryFn: () => base44.entities.Shift.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses"], queryFn: () => base44.entities.OperatingExpense.list() });
  const { data: profiles = [] } = useQuery({ queryKey: ["profiles"], queryFn: () => base44.entities.RestaurantProfile.list() });

  const profile = profiles[0];
  const latestExpense = expenses[0];
  const totalExpenses = latestExpense ? (latestExpense.rent || 0) + (latestExpense.utilities || 0) + (latestExpense.insurance || 0) + (latestExpense.internet_software || 0) + (latestExpense.miscellaneous || 0) : 0;

  const generateReport = async () => {
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

    const prompt = `You are a premium restaurant business consultant for Leverage Point AI. Generate a comprehensive monthly consulting report.

Restaurant: ${profile?.restaurant_name || "Restaurant"}
Menu Items: ${JSON.stringify(enrichedItems)}
Shifts: ${JSON.stringify(enrichedShifts)}
Monthly Fixed Expenses: $${totalExpenses}

Return a JSON object:
{
  "food_cost_summary": "2-3 sentences",
  "labor_cost_summary": "2-3 sentences",
  "operating_expense_summary": "2-3 sentences",
  "pressure_points": ["point 1", "point 2", "point 3"],
  "immediate_actions": ["action 1", "action 2", "action 3"],
  "margin_opportunities": ["opp 1", "opp 2", "opp 3"],
  "business_takeaway": "2-3 sentence executive summary"
}

Use specific data from the restaurant. Be concise but insightful.`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          food_cost_summary: { type: "string" },
          labor_cost_summary: { type: "string" },
          operating_expense_summary: { type: "string" },
          pressure_points: { type: "array", items: { type: "string" } },
          immediate_actions: { type: "array", items: { type: "string" } },
          margin_opportunities: { type: "array", items: { type: "string" } },
          business_takeaway: { type: "string" },
        },
      },
    });

    setReport(res);
    setLoading(false);
  };

  const downloadPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    const addText = (text, fontSize, isBold, maxWidth) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, maxWidth || pageWidth - 40);
      lines.forEach((line) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, 20, y);
        y += fontSize * 0.5 + 2;
      });
    };

    const addSection = (title, content) => {
      y += 6;
      addText(title, 13, true);
      y += 2;
      if (Array.isArray(content)) {
        content.forEach((item, idx) => addText(`${idx + 1}. ${item}`, 10, false));
      } else {
        addText(content, 10, false);
      }
    };

    // Header
    addText("Leverage Point AI", 18, true);
    addText("Restaurant Revenue Accelerator — Monthly Report", 11, false);
    y += 4;
    addText(profile?.restaurant_name || "Restaurant", 14, true);
    addText(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), 10, false);
    y += 4;
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    y += 8;

    addSection("1. Food Cost Summary", report.food_cost_summary);
    addSection("2. Labor Cost Summary", report.labor_cost_summary);
    addSection("3. Operating Expense Summary", report.operating_expense_summary);
    addSection("4. Revenue Pressure Points", report.pressure_points);
    addSection("5. Immediate Recommended Actions", report.immediate_actions);
    addSection("6. Margin Opportunities", report.margin_opportunities);
    addSection("7. Business Takeaway", report.business_takeaway);

    // Footer
    y += 12;
    doc.setDrawColor(16, 185, 129);
    doc.line(20, y, pageWidth - 20, y);
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("Generated by Leverage Point AI — Restaurant Revenue Accelerator", 20, y);

    doc.save(`revenue-report-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const sections = report
    ? [
        { title: "Food Cost Summary", content: report.food_cost_summary },
        { title: "Labor Cost Summary", content: report.labor_cost_summary },
        { title: "Operating Expense Summary", content: report.operating_expense_summary },
        { title: "Revenue Pressure Points", content: report.pressure_points },
        { title: "Immediate Recommended Actions", content: report.immediate_actions },
        { title: "Margin Opportunities", content: report.margin_opportunities },
        { title: "Business Takeaway", content: report.business_takeaway },
      ]
    : [];

  return (
    <div>
      <PageHeader title="Reports" description="Generate comprehensive consulting-style reports" />

      <div className="flex gap-3 justify-end mb-8">
        {report && (
          <Button variant="outline" onClick={downloadPDF} className="gap-2">
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        )}
        <Button onClick={generateReport} disabled={loading} size="lg" className="gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
          Generate Monthly Report
        </Button>
      </div>

      {loading && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Generating your consulting report...</p>
        </div>
      )}

      {report && !loading && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Report Header */}
          <div className="bg-sidebar p-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Leverage Point AI</p>
            <h2 className="text-xl font-bold mb-1">Restaurant Revenue Accelerator</h2>
            <p className="text-sm text-sidebar-foreground">Monthly Report — {profile?.restaurant_name || "Restaurant"}</p>
            <p className="text-xs text-sidebar-foreground/60 mt-1">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>

          {/* Report Body */}
          <div className="p-8 space-y-8">
            {sections.map((section, idx) => (
              <div key={idx}>
                <h3 className="text-sm font-bold text-card-foreground uppercase tracking-wider mb-3">
                  {idx + 1}. {section.title}
                </h3>
                {Array.isArray(section.content) ? (
                  <ul className="space-y-2">
                    {section.content.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
                )}
              </div>
            ))}
          </div>

          {/* Report Footer */}
          <div className="border-t border-border p-6 text-center">
            <p className="text-xs text-muted-foreground">Generated by Leverage Point AI — Restaurant Revenue Accelerator</p>
          </div>
        </div>
      )}
    </div>
  );
}