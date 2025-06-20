import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, User } from "lucide-react";

export default function PendingApproval() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Account Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-gray-600">
                Your account registration is currently under review by our Senior Management team.
              </p>
              <Badge variant="outline" className="text-amber-600 border-amber-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                Awaiting Approval
              </Badge>
            </div>
            
            {user && (
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Account Details
                </h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Name:</span> {(user as any).firstName} {(user as any).lastName}</p>
                  <p><span className="font-medium">Email:</span> {(user as any).email}</p>
                  {(user as any).designation && (
                    <p><span className="font-medium">Designation:</span> {(user as any).designation}</p>
                  )}
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500">
              <p>You will receive access once your account is approved by a Senior Manager or Partner.</p>
              <p className="mt-2">
                If you have any questions, please contact your supervisor or the HR department.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => window.location.href = "/api/logout"}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Log out
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}