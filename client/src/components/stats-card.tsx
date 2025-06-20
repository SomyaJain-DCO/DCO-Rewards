import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  bgColor = "bg-blue-100",
}: StatsCardProps) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            {subtitle && (
              <p className="text-sm text-secondary font-medium">{subtitle}</p>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", bgColor)}>
            <Icon className={cn("text-xl", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
