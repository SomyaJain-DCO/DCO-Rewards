import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import StatsCard from "@/components/stats-card";
import Leaderboard from "@/components/leaderboard";
import ActivityCard from "@/components/activity-card";
import { Trophy, Calendar, Clock, Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  const userRole = (user as any)?.role;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

  // For approvers, fetch team summary data
  const { data: teamSummary, isLoading: teamSummaryLoading } = useQuery<any>({
    queryKey: ["/api/team/summary"],
    enabled: isAuthenticated && userRole === 'approver',
  });

  const { data: pendingActivitiesCount } = useQuery<any>({
    queryKey: ["/api/activities/pending/count"],
    enabled: isAuthenticated && userRole === 'approver',
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
    enabled: isAuthenticated,
  });

  const { data: monthlyLeaderboard, isLoading: monthlyLeaderboardLoading } = useQuery({
    queryKey: ["/api/leaderboard/monthly"],
    enabled: isAuthenticated,
  });

  const { data: yearlyLeaderboard, isLoading: yearlyLeaderboardLoading } = useQuery({
    queryKey: ["/api/leaderboard/yearly"],
    enabled: isAuthenticated,
  });

  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities/recent"],
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
        {userRole === 'approver' ? (
          <>
            <StatsCard
              title="Total Points Awarded"
              value={teamSummary?.totalTeamPoints || 0}
              subtitle="Points awarded so far"
              icon={Trophy}
              iconColor="text-primary"
              bgColor="bg-blue-100"
              href="/all-activities"
              clickable={true}
            />
            <StatsCard
              title="This Month"
              value={teamSummary?.monthlyTeamPoints || 0}
              subtitle="Total Points awarded this month"
              icon={Calendar}
              iconColor="text-secondary"
              bgColor="bg-green-100"
              href="/all-activities"
              clickable={true}
            />
            <StatsCard
              title="Pending Approvals"
              value={pendingActivitiesCount?.count || 0}
              subtitle={`${pendingActivitiesCount?.points || 0} points pending`}
              icon={Clock}
              iconColor="text-yellow-600"
              bgColor="bg-yellow-100"
              href="/approvals"
              clickable={true}
            />
            <StatsCard
              title="Active Contributors"
              value={teamSummary?.activeContributors || 0}
              subtitle={`of ${teamSummary?.totalMembers || 0} members`}
              icon={Medal}
              iconColor="text-purple-600"
              bgColor="bg-purple-100"
              href="/team"
              clickable={true}
            />
          </>
        ) : (
          <>
            <StatsCard
              title="My Total Points"
              value={stats?.totalPoints || 0}
              subtitle="Points earned"
              icon={Trophy}
              iconColor="text-primary"
              bgColor="bg-blue-100"
              href="/my-activities?filter=all"
              clickable={true}
            />
            <StatsCard
              title="This Month"
              value={stats?.monthlyPoints || 0}
              subtitle="Points this month"
              icon={Calendar}
              iconColor="text-secondary"
              bgColor="bg-green-100"
              href="/my-activities?filter=monthly"
              clickable={true}
            />
            <StatsCard
              title="Pending Approval"
              value={stats?.pendingActivities || 0}
              subtitle={`${stats?.pendingPoints || 0} points pending`}
              icon={Clock}
              iconColor="text-yellow-600"
              bgColor="bg-yellow-100"
              href="/my-activities?filter=pending"
              clickable={true}
            />
            <StatsCard
              title="Ranking"
              value={stats?.ranking ? `#${stats.ranking}` : "N/A"}
              subtitle={`of ${stats?.totalMembers || 0} members`}
              icon={Medal}
              iconColor="text-purple-600"
              bgColor="bg-purple-100"
            />
          </>
        )}
      </div>

      {/* Points Table */}
      <Leaderboard
        data={leaderboard || []}
        monthlyData={monthlyLeaderboard || []}
        yearlyData={yearlyLeaderboard || []}
        currentUserId={user?.id}
        isLoading={leaderboardLoading || monthlyLeaderboardLoading || yearlyLeaderboardLoading}
        userRole={userRole}
      />

      {/* Recent Contributions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Contributions</CardTitle>
            <p className="text-sm text-gray-600">Latest approved contributions</p>
          </div>
          {recentActivities && recentActivities.length > 3 && (
            <Link href="/team" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View All →
            </Link>
          )}
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
              {recentActivities.slice(0, 3).map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  showApprover={false}
                  userRole={userRole}
                  currentUserId={(user as any)?.id}
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
