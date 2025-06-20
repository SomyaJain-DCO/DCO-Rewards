import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  href?: string;
  clickable?: boolean;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  bgColor = "bg-blue-100",
  href,
  clickable = false,
}: StatsCardProps) {
  const cardContent = (
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
  );

  if (clickable && href) {
    return (
      <Link href={href}>
        <Card className={cn(
          "border border-gray-200 cursor-pointer transition-all duration-200",
          "hover:shadow-md hover:border-primary/20 hover:bg-gray-50"
        )}>
          {cardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card className="border border-gray-200">
      {cardContent}
    </Card>
  );
}
