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

  const handleSubmitProfileChange = () => {
    if (!editFirstName.trim() || !editLastName.trim() || !editDesignation) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
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

  // Get user stats
  const { data: stats } = useQuery({
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const designationOptions = [
    "Partner",
    "Senior Manager", 
    "Manager",
    "Associate",
    "Senior Consultant",
    "Analyst"
  ];

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">My Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-6">
                {/* Profile Picture */}
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {(user as any)?.profileImageUrl ? (
                    <img
                      src={(user as any).profileImageUrl}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-white" />
                  )}
                </div>

                {/* User Information */}
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {(user as any)?.firstName} {(user as any)?.lastName}
                  </h2>
                  <p className="text-gray-600">{(user as any)?.email}</p>
                  
                  {/* Designation */}
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-gray-600 text-center">
                      {(user as any)?.designation || "No designation set"}
                    </p>
                  </div>
                  
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
                        : 'Contributor access: Can submit activities for approval, track personal progress, and participate in team leaderboards.'
                      }
                    </p>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Trophy className="text-blue-600 text-xl" />
                      <div>
                        <p className="text-sm text-gray-600">Total Points</p>
                        <p className="text-xl font-bold text-gray-800">{(stats as any)?.totalPoints || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="text-green-600 text-xl" />
                      <div>
                        <p className="text-sm text-gray-600">Total Earnings</p>
                        <p className="text-xl font-bold text-gray-800">₹{(stats as any)?.totalEarnings || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="text-purple-600 text-xl" />
                      <div>
                        <p className="text-sm text-gray-600">This Month</p>
                        <p className="text-xl font-bold text-gray-800">{(stats as any)?.monthlyPoints || 0} points</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <User className="text-orange-600 text-xl" />
                      <div>
                        <p className="text-sm text-gray-600">Ranking</p>
                        <p className="text-lg font-bold text-gray-800">
                          #{(stats as any)?.ranking || 'N/A'} of {(stats as any)?.totalMembers || 0}
                        </p>
                      </div>
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
                disabled={profileChangeRequestMutation.isPending}
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
                disabled={profileChangeRequestMutation.isPending}
              />
            </div>

            {/* Designation */}
            <div className="space-y-2">
              <Label htmlFor="edit-designation">Designation</Label>
              <Select value={editDesignation} onValueChange={setEditDesignation} disabled={profileChangeRequestMutation.isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {designationOptions.map((designation) => (
                    <SelectItem key={designation} value={designation}>
                      {designation}
                    </SelectItem>
                  ))}
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
              disabled={profileChangeRequestMutation.isPending}
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