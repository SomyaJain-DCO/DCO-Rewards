import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Building2 } from "lucide-react";

export default function CompleteProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [designation, setDesignation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Mutation to update user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; designation: string; role: string }) => {
      const response = await fetch("/api/profile/complete", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile Completed",
        description: "Welcome to DCo Rewards Dashboard!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !designation) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const role = getRoleFromDesignation(designation);
      await updateProfileMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        designation,
        role,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Complete Your Profile</CardTitle>
          <p className="text-sm text-gray-600">
            Welcome to DCo Rewards Dashboard! Please provide your name and designation to get started.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Designation */}
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Select
                value={designation}
                onValueChange={setDesignation}
                disabled={isSubmitting}
                required
              >
                <SelectTrigger>
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
            </div>

            {/* Role Information */}
            {designation && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium">
                    Role: {getRoleFromDesignation(designation) === "approver" ? "Approver" : "Contributor"}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {getRoleFromDesignation(designation) === "approver" 
                    ? "Partners have full access to review activities and manage team rewards."
                    : "Team members can submit activities and track their contributions."
                  }
                </p>
              </div>
            )}

            {/* Current User Info */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <p><strong>Email:</strong> {user?.email}</p>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !firstName.trim() || !lastName.trim() || !designation}
            >
              {isSubmitting ? "Completing Profile..." : "Complete Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}