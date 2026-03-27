import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

function MarginBadge({ margin }) {
  const m = parseFloat(margin);
  if (m >= 55) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[hsl(158,64%,36%)]/10 text-[hsl(158,64%,32%)] border border-[hsl(158,64%,36%)]/20">
        ★ Profit Leader
      </span>
    );
  }
  if (m < 30) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/8 text-destructive border border-destructive/20">
        ⚠ Low Margin
      </span>
    );
  }
  return null;
}

export default function MenuItemTable({ items, onEdit, onDelete }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Menu Item</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right">Cost</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right">Sell Price</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right">Profit</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right">Margin %</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right">Weekly Units</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right">Weekly Gross</TableHead>
            <TableHead className="w-[120px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                No menu items yet. Add your first item above.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const profit = (item.sell_price || 0) - (item.ingredient_cost || 0);
              const margin = item.sell_price > 0 ? ((profit / item.sell_price) * 100).toFixed(1) : 0;
              const weeklyGross = profit * (item.weekly_units_sold || 0);
              const isLowMargin = parseFloat(margin) < 30;
              const isHighMargin = parseFloat(margin) >= 55;

              return (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-medium text-card-foreground">{item.name}</span>
                      <MarginBadge margin={margin} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">${(item.ingredient_cost || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">${(item.sell_price || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">${profit.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "font-bold text-sm",
                      isLowMargin ? "text-destructive" : isHighMargin ? "text-[hsl(158,64%,36%)]" : "text-foreground"
                    )}>
                      {margin}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{item.weekly_units_sold}</TableCell>
                  <TableCell className="text-right font-semibold">${weeklyGross.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(item)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(item.id)}>
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