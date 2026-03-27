import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export default function MenuItemForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState(initial || { name: "", ingredient_cost: "", sell_price: "", weekly_units_sold: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      ingredient_cost: parseFloat(form.ingredient_cost) || 0,
      sell_price: parseFloat(form.sell_price) || 0,
      weekly_units_sold: parseInt(form.weekly_units_sold) || 0,
    });
    if (!initial) setForm({ name: "", ingredient_cost: "", sell_price: "", weekly_units_sold: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Item Name</Label>
          <Input placeholder="e.g. Grilled Salmon" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ingredient Cost ($)</Label>
          <Input type="number" step="0.01" placeholder="0.00" value={form.ingredient_cost} onChange={(e) => setForm({ ...form, ingredient_cost: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sell Price ($)</Label>
          <Input type="number" step="0.01" placeholder="0.00" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly Units</Label>
          <Input type="number" placeholder="0" value={form.weekly_units_sold} onChange={(e) => setForm({ ...form, weekly_units_sold: e.target.value })} required />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
        )}
        <Button type="submit" size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> {initial ? "Update" : "Add Item"}
        </Button>
      </div>
    </form>
  );
}