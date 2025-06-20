import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getPageInfo = (location: string) => {
  switch (location) {
    case "/":
      return {
        title: "DCo Rewards Dashboard",
        subtitle: "",
      };
    case "/submit-activity":
      return {
        title: "Submit Activity",
        subtitle: "Add your contribution for approval",
      };
    case "/profile":
      return {
        title: "My Profile",
        subtitle: "View your contributions and rewards",
      };
    case "/approvals":
      return {
        title: "Pending Approvals",
        subtitle: "Review team member contributions",
      };
    default:
      return {
        title: "DCo Rewards Dashboard",
        subtitle: "",
      };
  }
};

export default function Header() {
  const { user } = useAuth();
  const [location] = useLocation();
  const pageInfo = getPageInfo(location);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return user?.email?.charAt(0).toUpperCase() || "U";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const getDisplayName = () => {
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user?.email?.split("@")[0] || "User";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 lg:ml-0 ml-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{pageInfo.title}</h1>
          <p className="text-gray-600">{pageInfo.subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getInitials(user?.firstName, user?.lastName)}
                  </span>
                </div>
                <span className="text-gray-700 font-medium">{getDisplayName()}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm text-gray-700">
                <div className="font-medium">{getDisplayName()}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
                <div className="text-xs text-gray-500">
                  {user?.designation} • {user?.department}
                </div>
              </div>
              <DropdownMenuItem onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
