import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, User, Trophy, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { format } from "date-fns";

type ActivityFilter = "all" | "monthly" | "pending";

export default function MyActivities() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Get filter from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const filter = (searchParams.get("filter") as ActivityFilter) || "all";
  
  const userRole = user?.designation === "Partner" || user?.designation === "Senior Partner" ? "approver" : "contributor";

  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/user-activities", user?.id],
    enabled: !!user?.id,
  });

  const filteredActivities = activities?.filter((activity: any) => {
    if (filter === "pending") {
      return activity.status === "pending";
    }
    if (filter === "monthly") {
      const activityDate = new Date(activity.createdAt);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      return activityDate.getMonth() === currentMonth && activityDate.getFullYear() === currentYear;
    }
    return true; // "all"
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFilterTitle = () => {
    switch (filter) {
      case "pending":
        return "Pending Activities";
      case "monthly":
        return "This Month's Activities";
      default:
        return "All My Activities";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{getFilterTitle()}</h1>
        <div className="text-sm text-gray-600">
          {filteredActivities.length} activities found
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-500 text-center">
              {filter === "pending" 
                ? "You don't have any pending activities."
                : filter === "monthly"
                ? "You haven't submitted any activities this month."
                : "You haven't submitted any activities yet."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity: any) => (
            <Card key={activity.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{activity.title}</h3>
                      {getStatusBadge(activity.status)}
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(activity.activityDate), "MMM dd, yyyy")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        {activity.category.name}
                      </div>
                      {activity.attachmentUrl && (
                        <a
                          href={activity.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          Attachment
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="font-semibold text-primary">
                      {activity.category.points} pts
                    </div>
                    {userRole === "approver" && activity.category.monetaryValue && (
                      <div className="text-sm text-gray-600">
                        ₹{activity.category.monetaryValue.toLocaleString()}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {format(new Date(activity.createdAt), "MMM dd")}
                    </div>
                  </div>
                </div>

                {activity.status === "rejected" && activity.rejectionReason && (
                  <div className="mt-3 pt-3 border-t border-red-100">
                    <div className="text-sm text-red-600">
                      <strong>Rejection reason:</strong> {activity.rejectionReason}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}