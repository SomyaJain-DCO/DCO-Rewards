import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";
import { Check, X, IndianRupee, Clock, User, TrendingUp } from "lucide-react";

export default function Encashments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Fetch pending encashment requests
  const { data: pendingRequests, isLoading } = useQuery<any[]>({
    queryKey: ["/api/encashment/pending"],
  });

  // Fetch all users with their points summary
  const { data: usersSummary, isLoading: isLoadingSummary } = useQuery<any[]>({
    queryKey: ["/api/users/points-summary"],
  });

  // Approve encashment mutation
  const approveMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await apiRequest(`/api/encashment/approve/${requestId}`, "POST", {
        status: "approved",
        processedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encashment/pending"] });
      toast({
        title: "Success",
        description: "Encashment request approved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve encashment request",
        variant: "destructive",
      });
    },
  });

  // Reject encashment mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: number; reason: string }) => {
      await apiRequest(`/api/encashment/reject/${requestId}`, "POST", {
        status: "rejected",
        rejectionReason: reason,
        processedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encashment/pending"] });
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedRequest(null);
      toast({
        title: "Success",
        description: "Encashment request rejected",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reject encashment request",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (requestId: number) => {
    approveMutation.mutate(requestId);
  };

  const handleReject = (request: any) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (selectedRequest && rejectionReason.trim()) {
      rejectMutation.mutate({
        requestId: selectedRequest.id,
        reason: rejectionReason.trim(),
      });
    }
  };

  const getDisplayName = (user: any) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email;
  };

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName || lastName) {
      return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
    }
    return email?.[0]?.toUpperCase() || "U";
  };

  if (isLoading || isLoadingSummary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Encashment Requests</h1>
          <p className="text-gray-600 mt-2">Review and process point-to-cash conversion requests</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-gray-500">Loading encashment data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Encashment Requests</h1>
        <p className="text-gray-600 mt-2">Review and process point-to-cash conversion requests</p>
      </div>

      {/* Contributors Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Contributors Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!usersSummary || (usersSummary && usersSummary.length === 0) ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No contributors data available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usersSummary && usersSummary.map((user: any) => {
                const balancePoints = user.totalPoints - user.redeemedPoints;
                const balanceValue = balancePoints * 100; // ₹100 per point
                
                return (
                  <div key={user.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImageUrl} />
                        <AvatarFallback className="bg-blue-600 text-white text-sm">
                          {getInitials(user.firstName, user.lastName, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getDisplayName(user)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.designation || "Team Member"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Earned:</span>
                        <span className="font-medium">{user.totalPoints} pts (₹{(user.totalPoints * 100).toLocaleString()})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Redeemed:</span>
                        <span className="font-medium text-red-600">{user.redeemedPoints} pts (₹{(user.redeemedPoints * 100).toLocaleString()})</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-900 font-medium">Balance:</span>
                        <span className="font-bold text-green-600">{balancePoints} pts (₹{balanceValue.toLocaleString()})</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Requests Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Requests</h2>
        {!pendingRequests || (pendingRequests && pendingRequests.length === 0) ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <IndianRupee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
              <p className="text-gray-500">There are no encashment requests waiting for approval.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingRequests && pendingRequests.map((request: any) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.user.profileImageUrl} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {getInitials(request.user.firstName, request.user.lastName, request.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm mb-1">
                        <span className="font-medium text-gray-900">
                          {getDisplayName(request.user)}
                        </span>
                        <span className="text-gray-500 mx-2">•</span>
                        <span className="text-gray-600">
                          {request.user.designation || "Team Member"}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">₹{request.amount.toLocaleString()}</span>
                        <span className="text-gray-500 mx-2">•</span>
                        <span>{request.points.toLocaleString()} points</span>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(request.createdAt))} ago
                        </span>
                        <span>{format(new Date(request.createdAt), "MMM d, yyyy")}</span>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                          Pending
                        </Badge>
                      </div>
                      
                      {request.note && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <span className="font-medium">Note: </span>
                          {request.note}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      onClick={() => handleApprove(request.id)}
                      disabled={approveMutation.isPending}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(request)}
                      disabled={rejectMutation.isPending}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Encashment Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this encashment request.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
                setSelectedRequest(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}