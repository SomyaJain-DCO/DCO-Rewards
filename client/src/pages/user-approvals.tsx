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
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function UserApprovals() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  // Rejection dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Get pending users
  const { data: pendingUsers, isLoading: pendingUsersLoading } = useQuery({
    queryKey: ["/api/users/pending"],
    enabled: isAuthenticated && (user as any)?.role === "approver",
  });

  // Approve user mutation
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/users/${userId}/approve`, "PUT");
    },
    onSuccess: () => {
      toast({
        title: "User Approved",
        description: "User registration has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
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
        description: error.message || "Failed to approve user",
        variant: "destructive",
      });
    },
  });

  // Reject user mutation
  const rejectUserMutation = useMutation({
    mutationFn: async ({ userId, rejectionReason }: { userId: string; rejectionReason: string }) => {
      return await apiRequest(`/api/users/${userId}/reject`, "PUT", { rejectionReason });
    },
    onSuccess: () => {
      toast({
        title: "User Rejected",
        description: "User registration has been rejected.",
      });
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedUserId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
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
        description: error.message || "Failed to reject user",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (userId: string) => {
    approveUserMutation.mutate(userId);
  };

  const handleReject = (userId: string) => {
    setSelectedUserId(userId);
    setShowRejectDialog(true);
  };

  const handleRejectSubmit = () => {
    if (!selectedUserId || !rejectionReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    rejectUserMutation.mutate({
      userId: selectedUserId,
      rejectionReason: rejectionReason.trim(),
    });
  };

  // Redirect to home if not authenticated or not approver
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user as any)?.role !== "approver")) {
      toast({
        title: "Access Denied",
        description: "Only Senior Managers and Partners can access user approvals.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading || pendingUsersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || (user as any)?.role !== "approver") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Registration Approvals</h1>
          <p className="text-gray-600 mt-2">Review and approve new user registrations</p>
        </div>

        {/* Pending Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Pending User Registrations
              {pendingUsers && pendingUsers.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingUsers.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!pendingUsers || pendingUsers.length === 0 ? (
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No pending registrations</h3>
                <p className="mt-1 text-sm text-gray-500">All user registrations have been processed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((pendingUser: any) => (
                  <div key={pendingUser.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          {pendingUser.profileImageUrl ? (
                            <img
                              src={pendingUser.profileImageUrl}
                              alt="Profile"
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {pendingUser.firstName} {pendingUser.lastName}
                          </h3>
                          <p className="text-gray-600">{pendingUser.email}</p>
                          {pendingUser.designation && (
                            <p className="text-sm text-gray-500 mt-1">
                              Designation: {pendingUser.designation}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              Registered: {new Date(pendingUser.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(pendingUser.id)}
                          disabled={approveUserMutation.isPending || rejectUserMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(pendingUser.id)}
                          disabled={approveUserMutation.isPending || rejectUserMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject User Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject User Registration</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this user registration. This will be communicated to the user.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                disabled={rejectUserMutation.isPending}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={rejectUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={rejectUserMutation.isPending || !rejectionReason.trim()}
            >
              {rejectUserMutation.isPending ? "Rejecting..." : "Reject User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}