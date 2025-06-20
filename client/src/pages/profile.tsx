import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ActivityCard from "@/components/activity-card";
import { User, Calendar, Trophy, DollarSign, Search, X, Edit, Save, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  // Search and filter state for activity history
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  
  // Designation editing state
  const [isEditingDesignation, setIsEditingDesignation] = useState(false);
  const [newDesignation, setNewDesignation] = useState("");

  // Mutation for updating designation
  const updateDesignationMutation = useMutation({
    mutationFn: async (designation: string) => {
      return await apiRequest("/api/profile/designation", "PUT", { designation });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Designation updated successfully",
      });
      setIsEditingDesignation(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message || "Failed to update designation",
        variant: "destructive",
      });
    },
  });

  const handleEditDesignation = () => {
    setNewDesignation((user as any)?.designation || "");
    setIsEditingDesignation(true);
  };

  const handleSaveDesignation = () => {
    updateDesignationMutation.mutate(newDesignation.trim());
  };

  const handleCancelEdit = () => {
    setIsEditingDesignation(false);
    setNewDesignation("");
  };

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities/my"],
    enabled: isAuthenticated,
  });

  // Get unique years and months for filter options
  const availableYears = useMemo(() => {
    if (!activities) return [];
    const years = [...new Set(activities.map((activity: any) => 
      new Date(activity.activityDate).getFullYear().toString()
    ))].sort((a, b) => b.localeCompare(a));
    return years;
  }, [activities]);

  const availableMonths = useMemo(() => {
    const months = [
      { value: "01", label: "January" },
      { value: "02", label: "February" },
      { value: "03", label: "March" },
      { value: "04", label: "April" },
      { value: "05", label: "May" },
      { value: "06", label: "June" },
      { value: "07", label: "July" },
      { value: "08", label: "August" },
      { value: "09", label: "September" },
      { value: "10", label: "October" },
      { value: "11", label: "November" },
      { value: "12", label: "December" }
    ];
    return months;
  }, []);

  // Filter activities based on search criteria
  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    
    return activities.filter((activity: any) => {
      // Search term filter (title, description, category)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesTitle = activity.title.toLowerCase().includes(searchLower);
        const matchesDescription = activity.description.toLowerCase().includes(searchLower);
        const matchesCategory = activity.category.name.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription && !matchesCategory) return false;
      }

      // Year filter
      if (yearFilter && yearFilter !== "all") {
        const activityYear = new Date(activity.activityDate).getFullYear().toString();
        if (activityYear !== yearFilter) return false;
      }

      // Month filter
      if (monthFilter && monthFilter !== "all") {
        const activityMonth = (new Date(activity.activityDate).getMonth() + 1).toString().padStart(2, '0');
        if (activityMonth !== monthFilter) return false;
      }

      return true;
    });
  }, [activities, searchTerm, yearFilter, monthFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setYearFilter("all");
    setMonthFilter("all");
  };

  // Activity breakdown by category for overview
  const activityBreakdown = useMemo(() => {
    if (!activities) return {};
    
    return activities.reduce((acc: any, activity: any) => {
      if (activity.status === "approved") {
        const categoryName = activity.category.name;
        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        acc[categoryName]++;
      }
      return acc;
    }, {});
  }, [activities]);

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
                
                <div className="flex items-center justify-center gap-2">
                  {isEditingDesignation ? (
                    <div className="flex items-center justify-center gap-2 w-full max-w-md">
                      <Input
                        value={newDesignation}
                        onChange={(e) => setNewDesignation(e.target.value)}
                        placeholder="Enter your designation"
                        className="flex-1 text-center"
                        disabled={updateDesignationMutation.isPending}
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveDesignation}
                        disabled={updateDesignationMutation.isPending || !newDesignation.trim()}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={updateDesignationMutation.isPending}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-gray-600 text-center">
                        {(user as any)?.designation || "No designation set"}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleEditDesignation}
                        className="p-1 h-auto"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
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

        {/* Performance Summary */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Trophy className="text-blue-600 text-xl" />
                    <div>
                      <p className="text-sm text-gray-600">Total Points</p>
                      <p className="text-2xl font-bold text-gray-800">{stats?.totalPoints || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="text-green-600 text-xl" />
                    <div>
                      <p className="text-sm text-gray-600">Total Earnings</p>
                      <p className="text-xl font-bold text-gray-800">₹{stats?.totalEarnings?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="text-purple-600 text-xl" />
                    <div>
                      <p className="text-sm text-gray-600">This Month</p>
                      <p className="text-xl font-bold text-gray-800">{stats?.monthlyPoints || 0} points</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <User className="text-orange-600 text-xl" />
                    <div>
                      <p className="text-sm text-gray-600">Ranking</p>
                      <p className="text-lg font-bold text-gray-800">
                        #{stats?.ranking || 'N/A'} of {stats?.totalMembers || 0}
                      </p>
                    </div>
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