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
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {getInitials(activity.user.firstName, activity.user.lastName, activity.user.email)}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{getDisplayName(activity.user)}</h4>
              <p className="text-sm text-gray-600">
                {activity.user.designation || "Team Member"} • {activity.user.department || "General"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Submitted {formatDistanceToNow(new Date(activity.createdAt))} ago
              </p>
            </div>
          </div>
          <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Activity Type</p>
              <p className="text-gray-800">{activity.category.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Points Claimed</p>
              <p className="text-gray-800 font-semibold">
                {activity.category.points} points (₹{activity.category.monetaryValue?.toLocaleString()})
              </p>
            </div>
          </div>
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-700">Title</p>
            <p className="text-gray-800">{activity.title}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Description</p>
            <p className="text-gray-600 text-sm">{activity.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Activity Date: {format(new Date(activity.activityDate), "MMM d, yyyy")}
            </span>
            {activity.attachmentUrl && (
              <Button variant="ghost" size="sm" asChild>
                <a href={activity.attachmentUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Attachment
                </a>
              </Button>
            )}
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onReject}
              disabled={isLoading}
              className="border-accent text-accent hover:bg-red-50"
            >
              Reject
            </Button>
            <Button
              onClick={onApprove}
              disabled={isLoading}
              className="bg-secondary text-white hover:bg-secondary/90"
            >
              {isLoading ? "Processing..." : "Approve"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
