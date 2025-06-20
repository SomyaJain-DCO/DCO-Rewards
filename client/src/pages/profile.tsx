import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Trophy, DollarSign } from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

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

  if (isLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and view your performance</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="animate-pulse">
            <div className="bg-white p-6 rounded-lg border">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
          <div className="lg:col-span-2 animate-pulse">
            <div className="bg-white p-6 rounded-lg border">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userRole = (user as any)?.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">Manage your account settings and view your performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              {/* Avatar */}
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto">
                <span className="text-white text-2xl font-bold">
                  {(user as any)?.email ? (user as any).email.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>

              {/* Name */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {(user as any)?.firstName && (user as any)?.lastName 
                    ? `${(user as any).firstName} ${(user as any).lastName}`
                    : (user as any)?.firstName || (user as any)?.lastName || "User"}
                </h3>
                <p className="text-sm text-gray-600">
                  {(user as any)?.email}
                </p>
              </div>

              {/* User Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">
                    {(user as any)?.firstName && (user as any)?.lastName 
                      ? `${(user as any).firstName} ${(user as any).lastName}`
                      : "Team Member"}
                  </span>
                </div>
                
                {(user as any)?.designation && (
                  <p className="text-gray-600">{(user as any).designation}</p>
                )}
                {(user as any)?.department && (
                  <p className="text-gray-600">{(user as any).department}</p>
                )}
                {(user as any)?.role && (
                  <Badge variant={(user as any).role === 'approver' ? 'default' : 'secondary'}>
                    {(user as any).role === 'approver' ? 'Approver' : 'Contributor'}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Points</p>
                      <p className="text-2xl font-bold text-gray-800">{stats?.totalPoints || 0}</p>
                    </div>
                    <Trophy className="text-blue-600 text-xl" />
                  </div>
                </div>
                
                {userRole === 'approver' && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Earnings</p>
                        <p className="text-xl font-bold text-gray-800">₹{stats?.totalEarnings?.toLocaleString() || 0}</p>
                      </div>
                      <DollarSign className="text-green-600 text-xl" />
                    </div>
                  </div>
                )}
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">This Month</p>
                      <p className="text-2xl font-bold text-gray-800">{stats?.monthlyPoints || 0}</p>
                    </div>
                    <Calendar className="text-purple-600 text-xl" />
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Ranking</p>
                      <p className="text-lg font-bold text-gray-800">
                        #{stats?.ranking || 'N/A'} of {stats?.totalMembers || 0}
                      </p>
                    </div>
                    <User className="text-orange-600 text-xl" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}