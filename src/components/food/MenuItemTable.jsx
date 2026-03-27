import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MenuItemTable({ items, onEdit, onDelete }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Menu Item</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Cost</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Sell Price</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Profit</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Margin %</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Weekly Units</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Weekly Gross</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                No menu items yet. Add your first item above.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const profit = (item.sell_price || 0) - (item.ingredient_cost || 0);
              const margin = item.sell_price > 0 ? ((profit / item.sell_price) * 100).toFixed(1) : 0;
              const weeklyGross = profit * (item.weekly_units_sold || 0);
              const isLowMargin = parseFloat(margin) < 30;

              return (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">${(item.ingredient_cost || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">${(item.sell_price || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">${profit.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className={cn("font-semibold", isLowMargin ? "text-destructive" : "text-primary")}>
                      {margin}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{item.weekly_units_sold}</TableCell>
                  <TableCell className="text-right font-semibold">${weeklyGross.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}