import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cleanupResult, setCleanupResult] = useState<any>(null);

  // Redirect if not an approver
  if (!user || user.role !== 'approver') {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. This section is only available to approvers.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/cleanup-samples", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cleanup sample data");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setCleanupResult(data);
      toast({
        title: "Cleanup Completed",
        description: data.message,
      });
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    },
    onError: (error) => {
      toast({
        title: "Cleanup Failed",
        description: error.message || "Failed to perform cleanup",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600">System administration and maintenance tools</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Cleanup Sample Data
          </CardTitle>
          <CardDescription>
            Remove sample users and test data that may have been automatically added to the system.
            This will permanently delete users with sample email patterns and names.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action will permanently remove users and their data that match sample patterns:
              <ul className="mt-2 ml-4 list-disc text-sm">
                <li>Email patterns: @dhaddaco.com, test@, sample@, demo@, example@</li>
                <li>Name patterns: test, sample, demo, example, john, jane, admin, user, amit</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => cleanupMutation.mutate()}
            disabled={cleanupMutation.isPending}
            variant="destructive"
            className="w-full"
          >
            {cleanupMutation.isPending ? "Cleaning up..." : "Remove Sample Data"}
          </Button>

          {cleanupResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Cleanup Results:</strong>
                <div className="mt-2">
                  <p>{cleanupResult.message}</p>
                  {cleanupResult.removedUsers && cleanupResult.removedUsers.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Removed users:</p>
                      <ul className="ml-4 list-disc text-sm">
                        {cleanupResult.removedUsers.map((user: any, index: number) => (
                          <li key={index}>
                            {user.name} ({user.email}) - ID: {user.id}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}