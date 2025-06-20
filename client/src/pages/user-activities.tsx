import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trophy, Calendar, User, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import ActivityCard from "@/components/activity-card";
import { Link } from "wouter";

interface UserActivitiesProps {
  userId: string;
}

export default function UserActivities({ userId }: UserActivitiesProps) {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const userRole = (user as any)?.role;

  // Redirect to home if not authenticated
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
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: userInfo, isLoading: userLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: isAuthenticated && !!userId,
  });

  const { data: activities, isLoading: activitiesLoading, error } = useQuery({
    queryKey: [`/api/users/${userId}/activities`],
    enabled: isAuthenticated && !!userId,
  });

  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/users/${userId}/stats`],
    enabled: isAuthenticated && !!userId,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return user?.email || "Unknown User";
  };

  if (isLoading || userLoading || activitiesLoading || statsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const activitiesArray = Array.isArray(activities) ? activities : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        
        <div className="flex items-center space-x-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={userInfo?.profileImageUrl} alt={getDisplayName(userInfo)} />
            <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
              {getInitials(userInfo?.firstName, userInfo?.lastName, userInfo?.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{getDisplayName(userInfo)}</h1>
            <p className="text-gray-600">{userInfo?.designation || "Team Member"}</p>
            <p className="text-sm text-gray-500">{userInfo?.department}</p>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.totalPoints || 0}</div>
              {userRole === 'approver' && (
                <p className="text-xs text-gray-500">
                  ₹{userStats?.totalEarnings?.toLocaleString() || 0}
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.monthlyPoints || 0}</div>
              {userRole === 'approver' && (
                <p className="text-xs text-gray-500">
                  ₹{userStats?.monthlyEarnings?.toLocaleString() || 0}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Team Rank
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userStats?.ranking ? `#${userStats.ranking}` : "N/A"}
              </div>
              <p className="text-xs text-gray-500">
                of {userStats?.totalMembers || 0} members
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle>All Activities</CardTitle>
          <p className="text-sm text-gray-600">
            Complete activity history for {getDisplayName(userInfo)}
          </p>
        </CardHeader>
        <CardContent>
          {activitiesArray.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities yet</h3>
              <p className="text-gray-500">This user hasn't submitted any activities.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activitiesArray.map((activity: any) => (
                <Card key={activity.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">{activity.title}</h3>
                          <Badge className={
                            activity.status === "approved" ? "bg-secondary text-white" :
                            activity.status === "pending" ? "bg-yellow-500 text-white" :
                            "bg-accent text-white"
                          }>
                            {activity.status}
                          </Badge>
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
        </CardContent>
      </Card>
    </div>
  );
}