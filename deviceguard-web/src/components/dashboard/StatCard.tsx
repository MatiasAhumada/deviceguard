import { Card, CardContent } from "@/components/ui/card";
import { ComponentType } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: ComponentType<{ size?: number; color?: string; className?: string }>;
  iconColor: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconColor,
}: StatCardProps) {
  const isZero = value === "0" || value === 0;

  return (
    <Card className="border-carbon_black-600 shadow-sm bg-carbon_black">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-silver-400 uppercase tracking-wide mb-2">
              {title}
            </p>
            <p className="text-3xl font-bold text-white mb-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-silver-400 uppercase tracking-wide">
                {subtitle}
              </p>
            )}
            {trend && (
              <p
                className={`text-sm mt-2 font-medium ${
                  isZero
                    ? "text-warning"
                    : trend.isPositive
                      ? "text-success"
                      : "text-strawberry_red"
                }`}
              >
                {isZero ? "⚠" : trend.isPositive ? "↑" : "↓"} {trend.value}
              </p>
            )}
          </div>
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColor}`}
          >
            <Icon size={24} color="currentColor" className="text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
