import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Paperclip, Edit, Users, FileText, Clock, CheckCircle, XCircle, Calendar } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface ActivityCardProps {
  activity: {
    id: number;
    title: string;
    description: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
    activityDate: string;
    approvedAt?: string;
    rejectionReason?: string;
    attachmentUrl?: string;
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      designation?: string;
    };
    category: {
      id: number;
      name: string;
      points: number;
      monetaryValue?: number;
    };
    approver?: {
      id: string;
      firstName?: string;
      lastName?: string;
      email?: string;
    };
  };
  showApprover?: boolean;
  userRole?: string;
  hideUserName?: boolean;
  currentUserId?: string;
}

export default function ActivityCard({ activity, showApprover = false, userRole, hideUserName = false, currentUserId }: ActivityCardProps) {
  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (!firstName && !lastName) return email?.charAt(0).toUpperCase() || "U";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const getDisplayName = (user: { firstName?: string; lastName?: string; email?: string }) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email?.split("@")[0] || "User";
  };

  const getCategoryIcon = (categoryName: string) => {
    if (categoryName.toLowerCase().includes("linkedin")) return "fab fa-linkedin";
    if (categoryName.toLowerCase().includes("session") || categoryName.toLowerCase().includes("training")) return Users;
    if (categoryName.toLowerCase().includes("article") || categoryName.toLowerCase().includes("newsletter")) return FileText;
    if (categoryName.toLowerCase().includes("book")) return "fas fa-book";
    return Edit;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-secondary text-white";
      case "pending":
        return "bg-yellow-500 text-white";
      case "rejected":
        return "bg-accent text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return CheckCircle;
      case "pending":
        return Clock;
      case "rejected":
        return XCircle;
      default:
        return Clock;
    }
  };

  const CategoryIcon = getCategoryIcon(activity.category.name);
  const StatusIcon = getStatusIcon(activity.status);

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
            {typeof CategoryIcon === "string" ? (
              <i className={`${CategoryIcon} text-white`}></i>
            ) : (
              <CategoryIcon className="text-white text-sm" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 mb-1">{activity.title}</p>
            <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
              {!hideUserName && (
                <>
                  <span>by {getDisplayName(activity.user)}</span>
                  <span>•</span>
                </>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(activity.activityDate), "MMM dd, yyyy")}</span>
              </div>
              <span>•</span>
              <span>submitted {formatDistanceToNow(new Date(activity.createdAt))} ago</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-2">
              {activity.description}
            </p>
            {activity.status === "rejected" && activity.rejectionReason && (
              <p className="text-sm text-accent mt-2">
                Reason: {activity.rejectionReason}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4 ml-4">
          {activity.attachmentUrl && (
            <Button variant="ghost" size="sm" asChild>
              <a href={activity.attachmentUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          <div className="text-right">
            <Badge className={getStatusColor(activity.status)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {activity.status === "approved" && `+${activity.category.points} pts`}
              {activity.status === "pending" && `+${activity.category.points} pts`}
              {activity.status === "rejected" && "Rejected"}
            </Badge>
            {(userRole === 'approver' || activity.user.id === currentUserId) && (
              <p className="text-xs text-gray-500 mt-1">
                {activity.status === "approved" && `₹${activity.category.monetaryValue?.toLocaleString()}`}
                {activity.status === "pending" && `₹${activity.category.monetaryValue?.toLocaleString()}`}
                {activity.status === "rejected" && "₹0"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}