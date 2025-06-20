import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Paperclip, Calendar } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface ApprovalCardProps {
  activity: {
    id: number;
    title: string;
    description: string;
    activityDate: string;
    attachmentUrl?: string;
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      designation?: string;
      department?: string;
    };
    category: {
      id: number;
      name: string;
      points: number;
      monetaryValue?: number;
    };
    createdAt: string;
  };
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export default function ApprovalCard({ activity, onApprove, onReject, isLoading }: ApprovalCardProps) {
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

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        {/* Left section: User and activity info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {getInitials(activity.user.firstName, activity.user.lastName, activity.user.email)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm mb-1">
              <span className="font-medium text-gray-900">
                {getDisplayName(activity.user)}
              </span>
              <span className="text-gray-500 mx-2">•</span>
              <span className="text-gray-600">
                {activity.category.name}
              </span>
            </div>
            <div className="text-sm text-gray-700 mb-1">
              <span className="font-medium">{activity.title}</span>
              {activity.description && (
                <>
                  <span className="text-gray-500 mx-2">|</span>
                  <span>{activity.description}</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <span>{activity.category.points} points</span>
              <span>{format(new Date(activity.activityDate), "MMM d, yyyy")}</span>
              <span>{formatDistanceToNow(new Date(activity.createdAt))} ago</span>
              {activity.attachmentUrl && (
                <span className="flex items-center">
                  <Paperclip className="h-3 w-3 mr-1" />
                  Attachment
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right section: Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            disabled={isLoading}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Reject
          </Button>
          <Button
            size="sm"
            onClick={onApprove}
            disabled={isLoading}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {isLoading ? "..." : "Approve"}
          </Button>
        </div>
      </div>
    </div>
  );
}
