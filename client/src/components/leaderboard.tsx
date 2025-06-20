import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface LeaderboardUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  designation?: string;
  profileImageUrl?: string;
  totalPoints: number;
  totalEarnings: number;
}

interface LeaderboardProps {
  data: LeaderboardUser[];
  monthlyData?: LeaderboardUser[];
  yearlyData?: LeaderboardUser[];
  currentUserId?: string;
  isLoading?: boolean;
  userRole?: string;
}

export default function Leaderboard({ data, monthlyData, yearlyData, currentUserId, isLoading, userRole }: LeaderboardProps) {
  const [showAllRanks, setShowAllRanks] = useState(false);

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

  const renderLeaderboardContent = (leaderboardData: LeaderboardUser[], period: string) => {
    if (leaderboardData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No {period} data available.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Top 3 Rankings */}
        {leaderboardData.slice(0, 3).map((user, index) => {
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
                    {getRankIcon(rank)}
                  </span>
                </div>
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={getDisplayName(user)}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {getInitials(user.firstName, user.lastName, user.email)}
                    </span>
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/user/${user.id}`}>
                      <p className="font-medium text-gray-800 hover:text-blue-600 cursor-pointer transition-colors">
                        {getDisplayName(user)}
                      </p>
                    </Link>
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
                {userRole === 'approver' && (
                  <p className="text-sm text-secondary font-medium">
                    ₹{user.totalEarnings.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Others Section - Collapsible */}
        {leaderboardData.length > 3 && (
          <>
            <div className="border-t pt-4">
              <button
                onClick={() => setShowAllRanks(!showAllRanks)}
                className="flex items-center justify-between w-full p-3 text-left bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <span className="font-medium text-gray-700">
                  Others ({leaderboardData.length - 3} more)
                </span>
                {showAllRanks ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>

            {showAllRanks && (
              <div className="space-y-2">
                {leaderboardData.slice(3).map((user, index) => {
                  const rank = index + 4;
                  const isCurrentUser = user.id === currentUserId;
                  
                  return (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        isCurrentUser
                          ? "bg-blue-50 border-l-4 border-primary"
                          : "bg-gray-50"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{rank}</span>
                        </div>
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {getInitials(user.firstName, user.lastName, user.email)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <Link href={`/user/${user.id}`}>
                              <p className="font-medium text-gray-800 hover:text-blue-600 cursor-pointer transition-colors text-sm">
                                {getDisplayName(user)}
                              </p>
                            </Link>
                            {isCurrentUser && (
                              <Badge className="bg-primary text-white text-xs">You</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">
                            {user.designation || "Team Member"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800 text-sm">{user.totalPoints} pts</p>
                        {userRole === 'approver' && (
                          <p className="text-xs text-secondary font-medium">
                            ₹{user.totalEarnings.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    );
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
        <CardTitle>Points Table</CardTitle>
        <p className="text-sm text-gray-600">Rankings across different time periods</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="historic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="year">This Year</TabsTrigger>
            <TabsTrigger value="historic">Historic</TabsTrigger>
          </TabsList>

          <TabsContent value="month" className="mt-6">
            {renderLeaderboardContent(monthlyData || [], "monthly")}
          </TabsContent>

          <TabsContent value="year" className="mt-6">
            {renderLeaderboardContent(yearlyData || [], "yearly")}
          </TabsContent>

          <TabsContent value="historic" className="mt-6">
            {renderLeaderboardContent(data, "historic")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
