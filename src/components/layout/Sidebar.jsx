import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  Building2,
  Zap,
  FileText,
  Settings,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Food Cost", path: "/food-cost", icon: UtensilsCrossed },
  { label: "Labor Cost", path: "/labor-cost", icon: Users },
  { label: "Operating Expenses", path: "/operating-expenses", icon: Building2 },
  { label: "Revenue Actions", path: "/revenue-actions", icon: Zap },
  { label: "Reports", path: "/reports", icon: FileText },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className={cn("border-b border-sidebar-border", collapsed ? "px-3 py-5" : "px-5 py-5")}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-[13px] font-bold text-white tracking-tight leading-tight">Leverage Point AI</h1>
              <p className="text-[10px] text-sidebar-foreground/50 font-medium tracking-wide uppercase mt-0.5">Revenue Accelerator</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2.5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-sidebar-primary/20 text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "flex-shrink-0 transition-colors",
                  collapsed ? "w-5 h-5" : "w-4 h-4",
                  isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground"
                )}
              />
              {!collapsed && (
                <span className={cn(isActive ? "text-white" : "")}>{item.label}</span>
              )}
              {isActive && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Suite badge */}
      {!collapsed && (
        <div className="px-4 py-3 mx-3 mb-3 rounded-lg bg-sidebar-accent/60 border border-sidebar-border">
          <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-wider font-semibold mb-0.5">Part of</p>
          <p className="text-[11px] text-sidebar-foreground/70 font-semibold">Leverage Point AI Suite</p>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="p-2.5 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all text-xs"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}