import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShiftTable({ shifts, onEdit, onDelete }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Shift</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Labor Cost</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Sales</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Labor %</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shifts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                No shifts yet. Add your first shift above.
              </TableCell>
            </TableRow>
          ) : (
            shifts.map((shift) => {
              const laborPct = shift.sales > 0 ? ((shift.labor_cost / shift.sales) * 100).toFixed(1) : 0;
              const isHigh = parseFloat(laborPct) > 30;

              return (
                <TableRow key={shift.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{shift.name}</TableCell>
                  <TableCell className="text-right">${(shift.labor_cost || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">${(shift.sales || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <span className={cn("font-semibold", isHigh ? "text-destructive" : "text-primary")}>
                      {laborPct}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(shift)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(shift.id)}>
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