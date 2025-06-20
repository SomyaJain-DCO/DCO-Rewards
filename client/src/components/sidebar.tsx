import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Plus, 
  User, 
  CheckSquare, 
  Settings, 
  LogOut 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Submit Activity", href: "/submit-activity", icon: Plus },
  { name: "My Profile", href: "/profile", icon: User },
];

const approverNavigation = [
  { name: "Pending Approvals", href: "/approvals", icon: CheckSquare },
];

const accountNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <aside className="w-64 bg-white shadow-lg fixed h-full z-10">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Dhadda & Co.</h2>
        <p className="text-sm text-gray-600">Chartered Accountants</p>
      </div>
      
      <nav className="mt-6">
        <div className="px-4 mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            NAVIGATION
          </span>
        </div>
        <ul className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors",
                      isActive && "bg-blue-50 border-r-2 border-primary text-primary"
                    )}
                  >
                    <item.icon 
                      className={cn(
                        "mr-3 h-5 w-5",
                        isActive ? "text-primary" : "text-gray-400"
                      )} 
                    />
                    {item.name}
                  </a>
                </Link>
              </li>
            );
          })}
          
          {user?.role === "approver" && approverNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors",
                      isActive && "bg-blue-50 border-r-2 border-primary text-primary"
                    )}
                  >
                    <item.icon 
                      className={cn(
                        "mr-3 h-5 w-5",
                        isActive ? "text-primary" : "text-gray-400"
                      )} 
                    />
                    {item.name}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
        
        <div className="px-4 mt-8 mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            ACCOUNT
          </span>
        </div>
        <ul className="space-y-1 px-2">
          {accountNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors",
                      isActive && "bg-blue-50 border-r-2 border-primary text-primary"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5 text-gray-400" />
                    {item.name}
                  </a>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
