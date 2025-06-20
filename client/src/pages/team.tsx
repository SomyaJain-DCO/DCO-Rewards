import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Crown, UserCheck } from "lucide-react";

export default function Team() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: team, isLoading: teamLoading, error } = useQuery({
    queryKey: ["/api/team"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (isLoading || teamLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = (member: any) => {
    if (member.firstName && member.lastName) {
      return `${member.firstName} ${member.lastName}`;
    }
    if (member.firstName) {
      return member.firstName;
    }
    return member.email || "Unknown User";
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "approver":
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><Crown className="w-3 h-3 mr-1" />Approver</Badge>;
      case "contributor":
        return <Badge variant="secondary"><UserCheck className="w-3 h-3 mr-1" />Contributor</Badge>;
      default:
        return <Badge variant="outline">Member</Badge>;
    }
  };

  const teamArray = Array.isArray(team) ? team : [];
  const approvers = teamArray.filter((member: any) => member.role === "approver");
  const contributors = teamArray.filter((member: any) => member.role === "contributor");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Directory</h1>
        <p className="text-gray-600">
          View team members and their roles in the rewards system
        </p>
      </div>

      {approvers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Crown className="w-5 h-5 mr-2 text-blue-600" />
            Approvers ({approvers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvers.map((member: any) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.profileImageUrl} alt={getDisplayName(member)} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {getInitials(member.firstName, member.lastName, member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold truncate">
                        {getDisplayName(member)}
                      </CardTitle>
                      <p className="text-sm text-gray-500 truncate">{member.email}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {member.designation && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Designation:</span> {member.designation}
                      </p>
                    )}
                    {member.department && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Department:</span> {member.department}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      {getRoleBadge(member.role)}
                      <span className="text-xs text-gray-400">
                        Authority to approve activities
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {contributors.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-gray-600" />
            Contributors ({contributors.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contributors.map((member: any) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.profileImageUrl} alt={getDisplayName(member)} />
                      <AvatarFallback className="bg-gray-100 text-gray-700">
                        {getInitials(member.firstName, member.lastName, member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold truncate">
                        {getDisplayName(member)}
                      </CardTitle>
                      <p className="text-sm text-gray-500 truncate">{member.email}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {member.designation && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Designation:</span> {member.designation}
                      </p>
                    )}
                    {member.department && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Department:</span> {member.department}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      {getRoleBadge(member.role)}
                      <span className="text-xs text-gray-400">
                        Submits activities for approval
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {teamArray.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
          <p className="text-gray-500">Team members will appear here once they join the system.</p>
        </div>
      )}
    </div>
  );
}