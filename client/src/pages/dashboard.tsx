import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import StatsCard from "@/components/stats-card";
import Leaderboard from "@/components/leaderboard";
import ActivityCard from "@/components/activity-card";
import { Trophy, Calendar, Clock, Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
    enabled: isAuthenticated,
  });

  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities/recent"],
    enabled: isAuthenticated,
  });

  const userRole = (user as any)?.role;

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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="My Total Points"
          value={stats?.totalPoints || 0}
          subtitle={userRole === 'approver' ? `₹${stats?.totalEarnings?.toLocaleString() || 0}` : "Points earned"}
          icon={Trophy}
          iconColor="text-primary"
          bgColor="bg-blue-100"
        />
        <StatsCard
          title="This Month"
          value={stats?.monthlyPoints || 0}
          subtitle={userRole === 'approver' ? `₹${stats?.monthlyEarnings?.toLocaleString() || 0}` : "Points this month"}
          icon={Calendar}
          iconColor="text-secondary"
          bgColor="bg-green-100"
        />
        <StatsCard
          title="Pending Approval"
          value={stats?.pendingPoints || 0}
          subtitle={userRole === 'approver' ? `₹${stats?.pendingEarnings?.toLocaleString() || 0}` : "Awaiting approval"}
          icon={Clock}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-100"
        />
        <StatsCard
          title="Team Ranking"
          value={stats?.ranking ? `#${stats.ranking}` : "N/A"}
          subtitle={`of ${stats?.totalMembers || 0} members`}
          icon={Medal}
          iconColor="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      {/* Points Table */}
      <Leaderboard
        data={leaderboard || []}
        currentUserId={user?.id}
        isLoading={leaderboardLoading}
        userRole={userRole}
      />

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Team Activities</CardTitle>
          <p className="text-sm text-gray-600">Latest approved contributions</p>
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
          ) : recentActivities && recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  showApprover={false}
                  userRole={userRole}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activities found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
