import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  designation?: string;
  totalPoints: number;
  totalEarnings: number;
}

interface LeaderboardProps {
  data: LeaderboardUser[];
  currentUserId?: string;
  isLoading?: boolean;
}

export default function Leaderboard({ data, currentUserId, isLoading }: LeaderboardProps) {
  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (!firstName && !lastName) return email?.charAt(0).toUpperCase() || "U";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const getDisplayName = (user: LeaderboardUser) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email?.split("@")[0] || "User";
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-400";
      case 2:
        return "bg-gray-400";
      case 3:
        return "bg-orange-400";
      default:
        return "bg-gray-300";
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🏆";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return rank.toString();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Leaderboard</CardTitle>
          <p className="text-sm text-gray-600">Current month rankings</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Leaderboard</CardTitle>
            <p className="text-sm text-gray-600">All-time rankings</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="bg-gray-100">
              All Time
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No leaderboard data available.</p>
            </div>
          ) : (
            data.slice(0, 10).map((user, index) => {
              const rank = index + 1;
              const isCurrentUser = user.id === currentUserId;
              
              return (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg",
                    isCurrentUser
                      ? "bg-blue-50 border-l-4 border-primary"
                      : "bg-gray-50"
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", getRankColor(rank))}>
                      <span className="text-white text-sm font-bold">
                        {rank <= 3 ? getRankIcon(rank) : rank}
                      </span>
                    </div>
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {getInitials(user.firstName, user.lastName, user.email)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-800">
                          {getDisplayName(user)}
                        </p>
                        {isCurrentUser && (
                          <Badge className="bg-primary text-white">You</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {user.designation || "Team Member"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{user.totalPoints} pts</p>
                    <p className="text-sm text-secondary font-medium">
                      ₹{user.totalEarnings.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
