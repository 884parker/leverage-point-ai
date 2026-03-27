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
  const totalExpenses = latestExpense
    ? (latestExpense.rent || 0) + (latestExpense.utilities || 0) + (latestExpense.insurance || 0) + (latestExpense.internet_software || 0) + (latestExpense.miscellaneous || 0)
    : 0;

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

    const addText = (text, fontSize, isBold, maxWidth, color) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      if (color) doc.setTextColor(...color);
      else doc.setTextColor(30, 20, 20);
      const lines = doc.splitTextToSize(text, maxWidth || pageWidth - 40);
      lines.forEach((line) => {
        if (y > 272) { doc.addPage(); y = 20; }
        doc.text(line, 20, y);
        y += fontSize * 0.45 + 2.5;
      });
    };

    const addSection = (title, content) => {
      y += 7;
      if (y > 260) { doc.addPage(); y = 20; }
      // Section accent line
      doc.setDrawColor(133, 45, 65);
      doc.setLineWidth(0.3);
      doc.line(20, y, 28, y);
      y += 5;
      addText(title, 11, true, null, [133, 45, 65]);
      y += 1;
      if (Array.isArray(content)) {
        content.forEach((item, idx) => {
          addText(`${idx + 1}.  ${item}`, 9.5, false);
          y += 1;
        });
      } else {
        addText(content, 9.5, false);
      }
    };

    // Dark header block
    doc.setFillColor(28, 20, 20);
    doc.rect(0, 0, pageWidth, 42, "F");

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Leverage Point AI", 20, 16);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(133, 45, 65);
    doc.text("RESTAURANT REVENUE ACCELERATOR  —  MONTHLY REPORT", 20, 25);

    doc.setTextColor(180, 165, 160);
    doc.text(`${profile?.restaurant_name || "Restaurant"}  ·  ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 20, 33);

    y = 52;

    addSection("1. Food Cost Summary", report.food_cost_summary);
    addSection("2. Labor Cost Summary", report.labor_cost_summary);
    addSection("3. Operating Expense Summary", report.operating_expense_summary);
    addSection("4. Revenue Pressure Points", report.pressure_points);
    addSection("5. Immediate Recommended Actions", report.immediate_actions);
    addSection("6. Margin Opportunities", report.margin_opportunities);
    addSection("7. Business Takeaway", report.business_takeaway);

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 14;
    doc.setDrawColor(133, 45, 65);
    doc.setLineWidth(0.3);
    doc.line(20, footerY - 4, pageWidth - 20, footerY - 4);
    doc.setFontSize(7.5);
    doc.setTextColor(140, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text("Generated by Leverage Point AI — Restaurant Revenue Accelerator", 20, footerY);
    doc.text(`Page 1`, pageWidth - 20, footerY, { align: "right" });

    doc.save(`lp-revenue-report-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const reportSections = report
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
      <PageHeader
        title="Reports"
        description="Generate comprehensive consulting-style monthly reports"
        action={
          <div className="flex gap-2">
            {report && (
              <Button variant="outline" onClick={downloadPDF} size="sm" className="gap-2">
                <Download className="w-3.5 h-3.5" /> Download PDF
              </Button>
            )}
            <Button onClick={generateReport} disabled={loading} size="sm" className="gap-2">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              Generate Monthly Report
            </Button>
          </div>
        }
      />

      {loading && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Generating your consulting report...</p>
        </div>
      )}

      {!report && !loading && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No report generated yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Click "Generate Monthly Report" to create your consulting report</p>
        </div>
      )}

      {report && !loading && (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          {/* Report Header — premium dark */}
          <div className="bg-[hsl(20,18%,10%)] px-8 py-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">Leverage Point AI</p>
            <h2 className="text-lg font-bold text-white leading-tight mb-1">Restaurant Revenue Accelerator</h2>
            <p className="text-sm text-[hsl(30,12%,60%)]">Monthly Consulting Report</p>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
              <span className="text-xs text-[hsl(30,12%,50%)]">{profile?.restaurant_name || "Restaurant"}</span>
              <span className="text-[hsl(30,12%,30%)]">·</span>
              <span className="text-xs text-[hsl(30,12%,50%)]">
                {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>

          {/* Report Body */}
          <div className="divide-y divide-border">
            {reportSections.map((section, idx) => (
              <div key={idx} className="px-8 py-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-white">{idx + 1}</span>
                  </span>
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">{section.title}</h3>
                </div>
                {Array.isArray(section.content) ? (
                  <ul className="space-y-2 ml-8">
                    {section.content.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0 mt-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed ml-8">{section.content}</p>
                )}
              </div>
            ))}
          </div>

          {/* Report Footer */}
          <div className="px-8 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground/50 font-medium">Generated by Leverage Point AI — Restaurant Revenue Accelerator</p>
            <p className="text-[10px] text-muted-foreground/40">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}