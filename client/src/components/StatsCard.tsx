import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "warning" | "success" | "danger";
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend,
  trendValue,
  variant = "default"
}: StatsCardProps) {
  
  const variantStyles = {
    default: "bg-white border-slate-100 text-slate-900",
    warning: "bg-amber-50 border-amber-100 text-amber-900",
    success: "bg-emerald-50 border-emerald-100 text-emerald-900",
    danger: "bg-red-50 border-red-100 text-red-900",
  };

  const iconStyles = {
    default: "bg-primary/10 text-primary",
    warning: "bg-amber-100 text-amber-600",
    success: "bg-emerald-100 text-emerald-600",
    danger: "bg-red-100 text-red-600",
  };

  return (
    <div className={cn(
      "rounded-2xl p-6 border shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1",
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground/80 mb-1">{title}</p>
          <h3 className="text-3xl font-display font-bold tracking-tight">{value}</h3>
        </div>
        <div className={cn("p-3 rounded-xl", iconStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {(description || trend) && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          {trend && (
            <span className={cn(
              "flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-xs",
              trend === "up" && "bg-green-100 text-green-700",
              trend === "down" && "bg-red-100 text-red-700",
              trend === "neutral" && "bg-slate-100 text-slate-700",
            )}>
              {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
              {trend === "down" && <ArrowDownRight className="h-3 w-3" />}
              {trend === "neutral" && <Minus className="h-3 w-3" />}
              {trendValue}
            </span>
          )}
          <span className="text-muted-foreground line-clamp-1">{description}</span>
        </div>
      )}
    </div>
  );
}
