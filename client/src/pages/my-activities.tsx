import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, FileText, User, Trophy, Clock, Search, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useState, useMemo } from "react";

type ActivityFilter = "all" | "monthly" | "pending";

export default function MyActivities() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Get filter from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const filter = (searchParams.get("filter") as ActivityFilter) || "all";
  
  const userRole = user?.designation === "Partner" || user?.designation === "Senior Partner" ? "approver" : "contributor";

  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/user-activities", user?.id],
    enabled: !!user?.id,
  });

  // Get unique years and categories for filter options
  const availableYears = useMemo(() => {
    if (!activities) return [];
    const years = [...new Set(activities.map((activity: any) => 
      new Date(activity.activityDate).getFullYear().toString()
    ))].sort((a, b) => b.localeCompare(a));
    return years;
  }, [activities]);

  const availableCategories = useMemo(() => {
    if (!activities) return [];
    const categories = [...new Set(activities.map((activity: any) => activity.category.name))].sort();
    return categories;
  }, [activities]);

  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    
    return activities.filter((activity: any) => {
      // Status filter (from URL params)
      if (filter === "pending" && activity.status !== "pending") return false;
      if (filter === "monthly") {
        const activityDate = new Date(activity.createdAt);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        if (activityDate.getMonth() !== currentMonth || activityDate.getFullYear() !== currentYear) return false;
      }

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

      // Category filter
      if (categoryFilter && categoryFilter !== "all" && activity.category.name !== categoryFilter) return false;

      return true;
    });
  }, [activities, filter, searchTerm, yearFilter, categoryFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFilterTitle = () => {
    switch (filter) {
      case "pending":
        return "Pending Activities";
      case "monthly":
        return "This Month's Activities";
      default:
        return "All My Activities";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const clearFilters = () => {
    setSearchTerm("");
    setYearFilter("all");
    setCategoryFilter("all");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{getFilterTitle()}</h1>
        <div className="text-sm text-gray-600">
          {filteredActivities.length} activities found
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by title, description, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Year Filter */}
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Clear Filters Button */}
              {(searchTerm || (yearFilter && yearFilter !== "all") || (categoryFilter && categoryFilter !== "all")) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-500 text-center">
              {searchTerm || (yearFilter && yearFilter !== "all") || (categoryFilter && categoryFilter !== "all")
                ? "No activities match your search criteria. Try adjusting your filters."
                : filter === "pending" 
                ? "You don't have any pending activities."
                : filter === "monthly"
                ? "You haven't submitted any activities this month."
                : "You haven't submitted any activities yet."
              }
            </p>
            {(searchTerm || (yearFilter && yearFilter !== "all") || (categoryFilter && categoryFilter !== "all")) && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all filters
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity: any) => (
            <Card key={activity.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(activity.status)}
                    </div>
                    
                    <p className="text-sm text-gray-900 mb-3 line-clamp-2">
                      <span className="font-medium">{activity.title}</span>
                      <span className="text-gray-400 mx-2">|</span>
                      <span className="text-gray-600">{activity.description}</span>
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
                    <div className="text-xs text-gray-500 mt-1">
                      {activity.status === "approved" && `₹${activity.category.monetaryValue?.toLocaleString()}`}
                      {activity.status === "pending" && `₹${activity.category.monetaryValue?.toLocaleString()}`}
                      {activity.status === "rejected" && "₹0"}
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
    </div>
  );
}