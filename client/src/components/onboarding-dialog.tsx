import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

interface OnboardingDialogProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function OnboardingDialog({ isOpen, onComplete }: OnboardingDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [designation, setDesignation] = useState("");

  const setupProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; designation: string }) => {
      return await apiRequest("PUT", "/api/profile/setup", data);
    },
    onSuccess: () => {
      toast({
        title: "Welcome to DCo Rewards Dashboard!",
        description: "Your profile has been set up successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set up profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!firstName.trim() || !lastName.trim() || !designation) {
      toast({
        title: "Required Information",
        description: "Please fill in all fields to continue.",
        variant: "destructive",
      });
      return;
    }

    setupProfileMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      designation,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Welcome to DCo Rewards Dashboard
          </DialogTitle>
          <DialogDescription>
            Let's set up your profile to get started with the team rewards system.
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={setupProfileMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={setupProfileMutation.isPending}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Select value={designation} onValueChange={setDesignation} disabled={setupProfileMutation.isPending}>
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
            
            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={setupProfileMutation.isPending}
                className="w-full"
              >
                {setupProfileMutation.isPending ? "Setting up..." : "Complete Setup"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}