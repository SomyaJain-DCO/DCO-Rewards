import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        return await apiRequest("/api/auth/user");
      } catch (err: any) {
        // Handle 403 pending approval status
        if (err.message?.includes("403") && err.message?.includes("Account pending approval")) {
          throw { isPendingApproval: true, ...err };
        }
        // Handle 401 unauthorized (not logged in)
        if (err.message?.includes("401")) {
          return null;
        }
        throw err;
      }
    },
    retry: false,
  });

  // Check if user is pending approval
  const isPendingApproval = error && (error as any).isPendingApproval;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isPendingApproval,
    error,
  };
}
