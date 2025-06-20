import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  

  
  // Profile edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);





  // Handle profile image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }
      
      setProfileImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      // Reset form state
      setEditFirstName("");
      setEditLastName("");
      setEditDesignation("");
      setProfileImage(null);
      setProfileImagePreview(null);
      // Invalidate all user-related queries to update Dashboard and other components
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Force immediate refetch to update all components including Dashboard
      queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      // Small delay to ensure UI updates
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }, 100);
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
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = () => {
    const formData = new FormData();
    formData.append("firstName", editFirstName.trim());
    formData.append("lastName", editLastName.trim());
    formData.append("designation", editDesignation);
    
    if (profileImage) {
      formData.append("profileImage", profileImage);
    }
    
    updateProfileMutation.mutate(formData);
  };

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities/my"],
    enabled: isAuthenticated,
  });

  const { data: profileChangeRequests } = useQuery({
    queryKey: ["/api/profile-change-requests"],
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
              <Avatar className="w-20 h-20 mx-auto">
                <AvatarImage 
                  src={(user as any)?.profileImageUrl} 
                  alt={`${(user as any)?.firstName || 'User'}'s profile`}
                />
                <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                  {(user as any)?.email ? (user as any).email.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>

              {/* Name and Email */}
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
                
                <div className="flex items-center justify-center">
                  <p className="text-gray-600 text-center">
                    {(user as any)?.designation || "No designation set"}
                  </p>
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
          </CardContent>
          
          {/* Edit Icon in Lower Right Corner */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute bottom-3 right-3 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                onClick={() => {
                  setEditFirstName((user as any)?.firstName || "");
                  setEditLastName((user as any)?.lastName || "");
                  setEditDesignation((user as any)?.designation || "");
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Profile Information</DialogTitle>
                <DialogDescription>
                  Update your name and designation. Changes will be applied immediately.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="firstName" className="text-right">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lastName" className="text-right">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="designation" className="text-right">
                    Designation
                  </Label>
                  <Select value={editDesignation} onValueChange={setEditDesignation}>
                    <SelectTrigger className="col-span-3">
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
                
                {/* Profile Picture Upload */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="profileImage" className="text-right">
                    Profile Picture
                  </Label>
                  <div className="col-span-3 space-y-3">
                    <Input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                    {profileImagePreview && (
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={profileImagePreview} alt="Preview" />
                          <AvatarFallback>Preview</AvatarFallback>
                        </Avatar>
                        <div className="text-sm text-gray-600">
                          <p>Image preview</p>
                          <p className="text-xs">Max size: 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={handleProfileSubmit}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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