import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Award, Clock } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function AllActivities() {
  const { user, isAuthenticated } = useAuth();
  const userRole = (user as any)?.role;

  const { data: allActivities, isLoading } = useQuery({
    queryKey: ["/api/activities/all"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Activities</h1>
          <p className="text-gray-600">Complete overview of team contributions</p>
        </div>
        
        <div className="grid gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDisplayName = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    return user.email?.split('@')[0] || 'User';
  };

  const getInitials = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user.firstName) return user.firstName.charAt(0).toUpperCase();
    if (user.lastName) return user.lastName.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Activities</h1>
        <p className="text-gray-600">Complete overview of team contributions</p>
      </div>

      <div className="grid gap-3">
        {allActivities && allActivities.length > 0 ? (
          allActivities.map((activity: any) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* User Avatar */}
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">
                        {getInitials(activity.user)}
                      </span>
                    </div>

                    {/* Activity Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Link href={`/user/${activity.user.id}`}>
                          <h3 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer transition-colors">
                            {getDisplayName(activity.user)}
                          </h3>
                        </Link>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">{activity.user.designation || "Team Member"}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Award className="w-4 h-4" />
                          <span className="font-medium">{activity.category.name}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(activity.activityDate), "MMM d, yyyy")}</span>
                        </div>

                        {activity.status === 'approved' && activity.approvedAt && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Approved {format(new Date(activity.approvedAt), "MMM d")}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-gray-700 mt-1 line-clamp-1">
                        {activity.title}
                      </p>
                    </div>
                  </div>

                  {/* Status and Points */}
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    {getStatusBadge(activity.status)}
                    
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {activity.category.points} pts
                      </div>
                      {userRole === 'approver' && (
                        <div className="text-sm text-secondary font-medium">
                          ₹{activity.category.monetaryValue?.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No activities found</p>
                <p>Activities will appear here once team members start contributing.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {allActivities && allActivities.length > 0 && (
        <div className="text-center text-sm text-gray-500 mt-6">
          Showing {allActivities.length} activities
        </div>
      )}
    </div>
  );
}