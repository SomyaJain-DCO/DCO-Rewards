import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ActivityCard from "@/components/activity-card";
import { User, Calendar, Trophy, DollarSign } from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities/my"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || statsLoading) {
    return (
      <div className="max-w-4xl space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 mx-auto mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-100 p-4 rounded-lg">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return user.email?.charAt(0).toUpperCase() || "U";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const getFullName = () => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email?.split("@")[0] || "User";
  };

  // Calculate activity breakdown
  const activityBreakdown = activities?.reduce((acc: any, activity: any) => {
    const categoryName = activity.category.name;
    if (activity.status === "approved") {
      acc[categoryName] = (acc[categoryName] || 0) + 1;
    }
    return acc;
  }, {}) || {};

  return (
    <div className="max-w-4xl space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {getInitials(user.firstName, user.lastName)}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-1">
                  {getFullName()}
                </h3>
                <p className="text-gray-600 mb-1">{user.designation || "Team Member"}</p>
                <p className="text-sm text-gray-500 mb-4">{user.department || "General"}</p>
                <Badge variant={user.role === "approver" ? "default" : "secondary"}>
                  {user.role === "approver" ? "Approver" : "Contributor"}
                </Badge>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Points</span>
                  <span className="font-bold text-gray-800">{stats?.totalPoints || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Earnings</span>
                  <span className="font-bold text-secondary">₹{stats?.totalEarnings?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">This Month</span>
                  <span className="font-bold text-gray-800">{stats?.monthlyPoints || 0} pts</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Ranking</span>
                  <span className="text-gray-800">
                    {stats?.ranking ? `#${stats.ranking}` : "N/A"} of {stats?.totalMembers || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Stats */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Activities</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {activities?.filter((a: any) => a.status === "approved").length || 0}
                      </p>
                    </div>
                    <Trophy className="text-blue-600 text-2xl" />
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {activities?.filter((a: any) => a.status === "pending").length || 0}
                      </p>
                    </div>
                    <Calendar className="text-green-600 text-2xl" />
                  </div>
                </div>
              </div>

              {Object.keys(activityBreakdown).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Activity Breakdown</h4>
                  <div className="space-y-2">
                    {Object.entries(activityBreakdown).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{category}</span>
                        <Badge variant="outline">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Activity History</CardTitle>
              <p className="text-sm text-gray-600">Your recent contributions and approvals</p>
            </div>
            <Button variant="outline" className="bg-primary text-white hover:bg-primary/90">
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity: any) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  showApprover={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No activities found. Start by submitting your first contribution!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
