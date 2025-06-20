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
        <div className="grid gap-6">
          {filteredActivities.map((activity: any) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{activity.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(activity.activityDate), "MMM dd, yyyy")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        {activity.category.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(activity.status)}
                    <div className="text-right">
                      <div className="font-semibold text-primary">
                        {activity.category.points} points
                      </div>
                      {userRole === "approver" && activity.category.monetaryValue && (
                        <div className="text-sm text-gray-600">
                          ₹{activity.category.monetaryValue.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-700 leading-relaxed">
                      {activity.description}
                    </p>
                  </div>

                  {activity.attachmentUrl && (
                    <div>
                      <h4 className="font-medium mb-2">Attachment</h4>
                      <a
                        href={activity.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        View attachment
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Submitted {format(new Date(activity.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                    </div>
                    
                    {activity.status === "approved" && activity.approvedAt && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Approved {format(new Date(activity.approvedAt), "MMM dd, yyyy")}
                      </div>
                    )}

                    {activity.status === "rejected" && activity.rejectionReason && (
                      <div className="text-red-600">
                        Rejected: {activity.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}