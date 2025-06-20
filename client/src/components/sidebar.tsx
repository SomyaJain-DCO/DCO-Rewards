import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Plus, 
  User, 
  Users,
  CheckSquare, 
  Settings, 
  LogOut,
  Menu,
  X,
  Activity,
  FileText,
  Banknote,
  Shield
} from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const userRole = (user as any)?.role;
  
  // Define navigation based on user role
  const getNavigation = () => {
    if (userRole === "approver") {
      return [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "All Activities", href: "/all-activities", icon: FileText },
        { name: "Approvals", href: "/approvals", icon: CheckSquare },
        { name: "User Approvals", href: "/user-approvals", icon: Users },
        { name: "Encashments", href: "/encashments", icon: Banknote },
        { name: "Team Directory", href: "/team", icon: Users },
        { name: "Admin", href: "/admin", icon: Shield },
        { name: "My Profile", href: "/profile", icon: User },
      ];
    } else {
      return [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Submit Activity", href: "/submit-activity", icon: Plus },
        { name: "My Activities", href: "/my-activities", icon: Activity },
        { name: "All Activities", href: "/all-activities", icon: FileText },
        { name: "Encashment", href: "/encashment", icon: Banknote },
        { name: "My Profile", href: "/profile", icon: User },
      ];
    }
  };

  const navigation = getNavigation();

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-md shadow-lg"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "sidebar-container w-64 bg-primary text-primary-foreground shadow-lg fixed h-full z-40 transition-transform duration-300 ease-in-out flex flex-col",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-primary-foreground/10 flex-shrink-0">
          <div className="text-center">
            <img 
              src="/dco-logo.png" 
              alt="Dhadda & Co. Logo" 
              className="h-16 w-auto object-contain mx-auto mb-3 bg-white rounded-lg px-2 py-1"
            />
            <h2 className="text-xl font-bold text-primary-foreground">Dhadda & Co.</h2>
            <p className="text-sm text-primary-foreground/80">Chartered Accountants</p>
          </div>
        </div>
        
        <nav className="mt-6 flex-1 overflow-y-auto pb-6">
          <div className="px-4 mb-2">
            <span className="text-xs font-semibold text-primary-foreground/60 uppercase tracking-wide">
              NAVIGATION
            </span>
          </div>
          <ul className="space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center px-4 py-3 text-primary-foreground/80 rounded-lg hover:bg-primary-foreground/10 transition-colors cursor-pointer",
                        isActive && "bg-primary-foreground/20 border-r-2 border-primary-foreground text-primary-foreground"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon 
                        className={cn(
                          "mr-3 h-5 w-5",
                          isActive ? "text-primary-foreground" : "text-primary-foreground/60"
                        )} 
                      />
                      {item.name}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}