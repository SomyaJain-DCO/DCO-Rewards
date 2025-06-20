import { useQuery } from "@tanstack/react-query";
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
import { User, Calendar, Trophy, DollarSign, Search, X } from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Search and filter state for activity history
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

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

  const clearFilters = () => {
    setSearchTerm("");
    setYearFilter("all");
    setMonthFilter("all");
  };

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
          {/* Search and Filter Interface */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search activities by title, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Year Filter */}
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-full lg:w-[140px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Month Filter */}
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-full lg:w-[140px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {availableMonths.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Clear Filters Button */}
              {(searchTerm || yearFilter !== "all" || monthFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Results Summary */}
            {(searchTerm || yearFilter !== "all" || monthFilter !== "all") && (
              <div className="text-sm text-gray-600">
                Showing {filteredActivities.length} of {activities?.length || 0} activities
              </div>
            )}
          </div>

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
          ) : filteredActivities && filteredActivities.length > 0 ? (
            <div className="space-y-4">
              {filteredActivities.map((activity: any) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  showApprover={true}
                  hideUserName={true}
                />
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No activities match your search criteria. Try adjusting your filters.</p>
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
