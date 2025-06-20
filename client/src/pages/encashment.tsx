import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Banknote } from "lucide-react";
import { format } from "date-fns";

export default function Encashment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pointsToRedeem, setPointsToRedeem] = useState("");

  // Fetch user stats to get available points
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Fetch user's encashment requests
  const { data: encashmentRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/encashment-requests"],
  });

  // Create encashment request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: { pointsRequested: number; monetaryValue: number }) => {
      return await apiRequest("/api/encashment-requests", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your encashment request has been submitted successfully.",
      });
      setPointsToRedeem("");
      queryClient.invalidateQueries({ queryKey: ["/api/encashment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit encashment request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitRequest = () => {
    const points = parseInt(pointsToRedeem);
    if (!points || points <= 0) {
      toast({
        title: "Invalid Points",
        description: "Please enter a valid number of points.",
        variant: "destructive",
      });
      return;
    }

    if (points > (stats?.totalPoints || 0)) {
      toast({
        title: "Insufficient Points",
        description: "You don't have enough points for this request.",
        variant: "destructive",
      });
      return;
    }

    // Calculate monetary value (₹100 per point)
    const monetaryValue = points * 100;

    createRequestMutation.mutate({
      pointsRequested: points,
      monetaryValue,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (statsLoading || requestsLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const availablePoints = stats?.totalPoints || 0;
  const pointsValue = parseInt(pointsToRedeem) || 0;
  const monetaryValue = pointsValue * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Points Encashment</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Banknote className="w-4 h-4" />
          Convert your points to cash
        </div>
      </div>

      {/* Available Points Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Available Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{availablePoints}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">₹{(availablePoints * 100).toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">₹100</div>
              <div className="text-sm text-gray-600">Per Point</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>Request Encashment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="points">Points to Redeem</Label>
            <Input
              id="points"
              type="number"
              placeholder="Enter points"
              value={pointsToRedeem}
              onChange={(e) => setPointsToRedeem(e.target.value)}
              max={availablePoints}
              min="1"
            />
            <div className="text-xs text-gray-500">
              Maximum: {availablePoints} points available
            </div>
          </div>

          {pointsValue > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Monetary Value:</span>
                <span className="text-lg font-bold text-green-600">₹{monetaryValue.toLocaleString()}</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmitRequest}
            disabled={!pointsValue || pointsValue > availablePoints || createRequestMutation.isPending}
            className="w-full"
          >
            {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </CardContent>
      </Card>

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
        </CardHeader>
        <CardContent>
          {encashmentRequests && encashmentRequests.length > 0 ? (
            <div className="space-y-4">
              {encashmentRequests.map((request: any) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{request.pointsRequested} points</span>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Requested on {format(new Date(request.createdAt), "MMM dd, yyyy")}
                      </div>
                      {request.status === "approved" && request.approvedAt && (
                        <div className="text-sm text-green-600">
                          Approved on {format(new Date(request.approvedAt), "MMM dd, yyyy")}
                        </div>
                      )}
                      {request.status === "rejected" && request.rejectionReason && (
                        <div className="text-sm text-red-600">
                          Reason: {request.rejectionReason}
                        </div>
                      )}
                      {request.paymentDetails && (
                        <div className="text-sm text-blue-600">
                          Payment: {request.paymentDetails}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">₹{request.monetaryValue.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No encashment requests yet.</p>
              <p className="text-sm">Submit your first request above to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}