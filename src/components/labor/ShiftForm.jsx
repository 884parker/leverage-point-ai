import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export default function ShiftForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState(initial || { name: "", labor_cost: "", sales: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      labor_cost: parseFloat(form.labor_cost) || 0,
      sales: parseFloat(form.sales) || 0,
    });
    if (!initial) setForm({ name: "", labor_cost: "", sales: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shift Name</Label>
          <Input placeholder="e.g. Lunch, Dinner" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Labor Cost ($)</Label>
          <Input type="number" step="0.01" placeholder="0.00" value={form.labor_cost} onChange={(e) => setForm({ ...form, labor_cost: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sales ($)</Label>
          <Input type="number" step="0.01" placeholder="0.00" value={form.sales} onChange={(e) => setForm({ ...form, sales: e.target.value })} required />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
        )}
        <Button type="submit" size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> {initial ? "Update" : "Add Shift"}
        </Button>
      </div>
    </form>
  );
}