import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ApprovalCard from "@/components/approval-card";

export default function Approvals() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingActivityId, setRejectingActivityId] = useState<number | null>(null);

  const { data: pendingActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities/pending"],
    enabled: isAuthenticated && user?.role === "approver",
  });

  const { data: pendingProfileChanges, isLoading: profileChangesLoading } = useQuery({
    queryKey: ["/api/profile-change-requests/pending"],
    enabled: isAuthenticated && user?.role === "approver",
  });

  const approveMutation = useMutation({
    mutationFn: async (data: { id: number; status: "approved" | "rejected"; rejectionReason?: string }) => {
      return await apiRequest("/api/activities/approve", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Activity updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      setRejectionReason("");
      setRejectingActivityId(null);
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
        description: "Failed to update activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const approveProfileChangeMutation = useMutation({
    mutationFn: async (data: { id: number; status: "approved" | "rejected"; rejectionReason?: string }) => {
      return await apiRequest("/api/profile-change-requests/approve", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile change request updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile-change-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setRejectionReason("");
      setRejectingActivityId(null);
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
        description: "Failed to update profile change request",
        variant: "destructive",
      });
    },
  });

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

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role !== "approver") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
    }
  }, [user, isAuthenticated, isLoading, toast]);

  const handleApprove = (activityId: number) => {
    approveMutation.mutate({ id: activityId, status: "approved" });
  };

  const handleReject = (activityId: number) => {
    setRejectingActivityId(activityId);
  };

  const handleApproveProfileChange = (requestId: number) => {
    approveProfileChangeMutation.mutate({ id: requestId, status: "approved" });
  };

  const handleRejectProfileChange = (requestId: number) => {
    setRejectingActivityId(requestId);
  };

  const confirmReject = () => {
    if (rejectingActivityId) {
      const isProfileChange = pendingProfileChanges?.some((req: any) => req.id === rejectingActivityId);
      
      if (isProfileChange) {
        approveProfileChangeMutation.mutate({
          id: rejectingActivityId,
          status: "rejected",
          rejectionReason: rejectionReason || "No reason provided",
        });
      } else {
        approveMutation.mutate({
          id: rejectingActivityId,
          status: "rejected",
          rejectionReason: rejectionReason || "No reason provided",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "approver") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">
                You don't have permission to access this page. Only approvers can view pending activities.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Approvals</CardTitle>
              <p className="text-sm text-gray-600">Review and approve team member contributions</p>
            </div>
            <div className="flex space-x-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {pendingActivities?.length || 0} Pending
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : pendingActivities && pendingActivities.length > 0 ? (
            <div className="space-y-3">
              {pendingActivities.map((activity: any) => (
                <ApprovalCard
                  key={activity.id}
                  activity={activity}
                  onApprove={() => handleApprove(activity.id)}
                  onReject={() => handleReject(activity.id)}
                  isLoading={approveMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No pending approvals at this time.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Change Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile Change Requests</CardTitle>
              <p className="text-sm text-gray-600">Review and approve profile update requests</p>
            </div>
            <div className="flex space-x-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {pendingProfileChanges?.length || 0} Pending
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {profileChangesLoading ? (
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : pendingProfileChanges && pendingProfileChanges.length > 0 ? (
            <div className="space-y-3">
              {pendingProfileChanges.map((request: any) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {request.user.firstName?.[0]}{request.user.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {request.user.firstName} {request.user.lastName}
                          </span>
                          <span className="text-sm text-gray-500">requests profile update</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            <span className="font-medium">Name:</span> {request.requestedFirstName} {request.requestedLastName}
                          </div>
                          <div>
                            <span className="font-medium">Designation:</span> {request.requestedDesignation}
                          </div>
                          <div className="text-xs text-gray-500">
                            Requested on {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveProfileChange(request.id)}
                        disabled={approveProfileChangeMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectProfileChange(request.id)}
                        disabled={approveProfileChangeMutation.isPending}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No pending profile change requests at this time.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectingActivityId} onOpenChange={(open) => !open && setRejectingActivityId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please provide a reason for rejecting this activity. This will be shared with the contributor.
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setRejectingActivityId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmReject}
                disabled={approveMutation.isPending || !rejectionReason.trim()}
              >
                {approveMutation.isPending ? "Rejecting..." : "Reject Activity"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
