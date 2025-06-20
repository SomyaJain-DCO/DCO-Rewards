import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Calendar, Trophy, DollarSign, Edit, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  // Edit profile dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editDesignation, setEditDesignation] = useState("");

  // Profile change request mutation
  const profileChangeRequestMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; designation: string }) => {
      return await apiRequest("/api/profile-change-requests", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Change Requested",
        description: "Your profile change request has been submitted for approval by Senior Managers and Partners.",
      });
      setShowEditDialog(false);
      setEditFirstName("");
      setEditLastName("");
      setEditDesignation("");
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
        description: error.message || "Failed to submit profile change request",
        variant: "destructive",
      });
    },
  });

  // Handle edit profile dialog
  const handleEditProfile = () => {
    if (user) {
      setEditFirstName((user as any).firstName || "");
      setEditLastName((user as any).lastName || "");
      setEditDesignation((user as any).designation || "");
      setShowEditDialog(true);
    }
  };



  // Function to get role based on designation
  const getRoleFromDesignation = (designation: string): string => {
    switch (designation) {
      case "Partner":
        return "approver";
      case "Senior Manager":
      case "Manager":
      case "Associate":
      case "Senior Consultant":
      case "Analyst":
        return "contributor";
      default:
        return "contributor";
    }
  };

  // Mutation for updating designation and role
  const updateDesignationMutation = useMutation({
    mutationFn: async (designation: string) => {
      const role = getRoleFromDesignation(designation);
      const response = await fetch("/api/profile/designation", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ designation, role }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update designation");
      }
      
      return await response.json();
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

  // Mutation for submitting profile change request
  const submitProfileChangeRequestMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; designation: string }) => {
      return await apiRequest("/api/profile-change-requests", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowEditDialog(false);
      toast({
        title: "Profile Change Request Submitted",
        description: "Your request has been sent for approval by Senior Managers and Partners.",
      });
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
        description: error.message || "Failed to submit profile change request",
        variant: "destructive",
      });
    },
  });

  const handleSubmitProfileChange = () => {
    if (!editFirstName.trim() || !editLastName.trim() || !editDesignation) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    profileChangeRequestMutation.mutate({
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      designation: editDesignation,
    });
  };

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
        <Card className="relative">
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
                
                <div className="flex items-center justify-center gap-2">
                  {isEditingDesignation ? (
                    <div className="flex items-center justify-center gap-2 w-full max-w-md">
                      <Select
                        value={newDesignation}
                        onValueChange={setNewDesignation}
                        disabled={updateDesignationMutation.isPending}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select your designation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Partner">Partner</SelectItem>
                          <SelectItem value="Senior Manager">Senior Manager</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Associate">Associate</SelectItem>
                          <SelectItem value="Senior Consultant">Senior Consultant</SelectItem>
                          <SelectItem value="Analyst">Analyst</SelectItem>
                        </SelectContent>
                      </Select>
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
                
                {/* Profile Type Section */}
                <div className="flex flex-col items-center gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Profile Type:</span>
                    {(user as any)?.role && (
                      <Badge variant={(user as any).role === 'approver' ? 'default' : 'secondary'} className="text-sm">
                        {(user as any).role === 'approver' ? 'Approver' : 'Contributor'}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Role-based description */}
                  <p className="text-xs text-gray-500 text-center max-w-xs">
                    {(user as any)?.role === 'approver' 
                      ? 'Partner level access: Can review and approve team activities, access admin features, and manage encashment requests.'
                      : 'Team member access: Can submit activities for approval, view leaderboards, and request point encashments.'
                    }
                  </p>
                  
                  {/* Designation-Role Mapping Info */}
                  <div className="text-xs text-gray-400 text-center mt-2">
                    <p className="font-medium">Designation & Role Mapping:</p>
                    <p>Partner → Approver | Senior Manager, Manager, Associate, Senior Consultant, Analyst → Contributor</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Edit Icon in Bottom Right Corner */}
            <Button
              size="sm"
              variant="ghost"
              className="absolute bottom-2 right-2 p-2 h-8 w-8 text-gray-400 hover:text-primary"
              onClick={handleOpenEditDialog}
            >
              <Edit className="h-4 w-4" />
            </Button>
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

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile Information</DialogTitle>
            <DialogDescription>
              Request changes to your name and designation. This will be sent for approval by Senior Managers and Partners.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">First Name</Label>
              <Input
                id="edit-firstName"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                placeholder="Enter first name"
                disabled={submitProfileChangeRequestMutation.isPending}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                placeholder="Enter last name"
                disabled={submitProfileChangeRequestMutation.isPending}
              />
            </div>

            {/* Designation */}
            <div className="space-y-2">
              <Label htmlFor="edit-designation">Designation</Label>
              <Select
                value={editDesignation}
                onValueChange={setEditDesignation}
                disabled={submitProfileChangeRequestMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Partner">Partner</SelectItem>
                  <SelectItem value="Senior Manager">Senior Manager</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Associate">Associate</SelectItem>
                  <SelectItem value="Senior Consultant">Senior Consultant</SelectItem>
                  <SelectItem value="Analyst">Analyst</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Approval Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Approval Required</p>
                  <p className="text-amber-700">Changes will be reviewed by Senior Managers and Partners before taking effect.</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={submitProfileChangeRequestMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitProfileChange}
              disabled={
                profileChangeRequestMutation.isPending ||
                !editFirstName.trim() ||
                !editLastName.trim() ||
                !editDesignation
              }
            >
              {profileChangeRequestMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Edit Button */}
      <Button
        onClick={handleEditProfile}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
        size="icon"
      >
        <Edit className="h-6 w-6" />
      </Button>
    </div>
  );
}