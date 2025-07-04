import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import OnboardingDialog from "@/components/onboarding-dialog";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import SubmitActivity from "@/pages/submit-activity";
import Profile from "@/pages/profile";
import Approvals from "@/pages/approvals";
import Team from "@/pages/team";
import UserActivities from "@/pages/user-activities";
import MyActivities from "@/pages/my-activities";
import AllActivities from "@/pages/all-activities";
import Encashment from "@/pages/encashment";
import Encashments from "@/pages/encashments";
import Admin from "@/pages/admin";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user needs onboarding (first-time login without name/designation)
  const needsOnboarding = isAuthenticated && user && (!user.firstName || !user.lastName || !user.designation);

  // Show onboarding dialog when user needs it
  useEffect(() => {
    if (needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [needsOnboarding]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        <Header />
        <div className="p-6 pt-20 lg:pt-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/submit-activity" component={SubmitActivity} />
            <Route path="/team" component={Team} />
            <Route path="/profile" component={Profile} />
            <Route path="/approvals" component={Approvals} />
            <Route path="/my-activities" component={MyActivities} />
            <Route path="/all-activities" component={AllActivities} />
            <Route path="/encashment" component={Encashment} />
            <Route path="/encashments" component={Encashments} />
            <Route path="/admin" component={Admin} />
            <Route path="/user/:userId" component={({ params }) => <UserActivities userId={params?.userId || ""} />} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      
      {/* Onboarding Dialog for first-time users */}
      <OnboardingDialog 
        isOpen={showOnboarding} 
        onComplete={handleOnboardingComplete} 
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
