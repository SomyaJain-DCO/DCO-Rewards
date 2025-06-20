import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, allowPendingUsers } from "./replitAuth";
import { insertActivitySchema, approveActivitySchema, insertEncashmentRequestSchema, approveEncashmentRequestSchema, users, activities, encashmentRequests } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

interface AuthenticatedRequest extends Request {
  user?: {
    claims: {
      sub: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      profile_image_url?: string;
    };
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Seed activity categories on startup
  await storage.seedActivityCategories();

  // Auth routes - allow pending users to get their info for profile completion
  app.get('/api/auth/user', allowPendingUsers, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile routes
  app.put('/api/profile/designation', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { designation, role } = req.body;

      if (typeof designation !== 'string') {
        return res.status(400).json({ message: "Designation must be a string" });
      }

      if (typeof role !== 'string' || !['contributor', 'approver'].includes(role)) {
        return res.status(400).json({ message: "Role must be either 'contributor' or 'approver'" });
      }

      const updatedUser = await storage.updateUserDesignationAndRole(userId, designation.trim(), role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating designation and role:", error);
      res.status(500).json({ message: "Failed to update designation and role" });
    }
  });

  // Complete profile after login
  app.put('/api/profile/complete', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { firstName, lastName, designation, role } = req.body;

      if (typeof firstName !== 'string' || !firstName.trim()) {
        return res.status(400).json({ message: "First name is required" });
      }

      if (typeof lastName !== 'string' || !lastName.trim()) {
        return res.status(400).json({ message: "Last name is required" });
      }

      if (typeof designation !== 'string') {
        return res.status(400).json({ message: "Designation is required" });
      }

      if (typeof role !== 'string' || !['contributor', 'approver'].includes(role)) {
        return res.status(400).json({ message: "Role must be either 'contributor' or 'approver'" });
      }

      const updatedUser = await storage.updateUserProfile(userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        designation: designation.trim(),
        role
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error completing profile:", error);
      res.status(500).json({ message: "Failed to complete profile" });
    }
  });

  // Profile change request routes
  app.post('/api/profile-change-requests', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { firstName, lastName, designation } = req.body;

      if (typeof firstName !== 'string' || !firstName.trim()) {
        return res.status(400).json({ message: "First name is required" });
      }

      if (typeof lastName !== 'string' || !lastName.trim()) {
        return res.status(400).json({ message: "Last name is required" });
      }

      if (typeof designation !== 'string') {
        return res.status(400).json({ message: "Designation is required" });
      }

      // Get current user info
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const profileChangeRequest = await storage.createProfileChangeRequest({
        userId,
        requestedFirstName: firstName.trim(),
        requestedLastName: lastName.trim(),
        requestedDesignation: designation.trim(),
        currentFirstName: currentUser.firstName,
        currentLastName: currentUser.lastName,
        currentDesignation: currentUser.designation,
      });

      res.status(201).json(profileChangeRequest);
    } catch (error) {
      console.error("Error creating profile change request:", error);
      res.status(500).json({ message: "Failed to create profile change request" });
    }
  });

  // Get pending profile change requests (Senior Managers and Partners only)
  app.get('/api/profile-change-requests/pending', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (!user || (user.designation !== 'Senior Manager' && user.designation !== 'Partner')) {
        return res.status(403).json({ message: "Access denied. Only Senior Managers and Partners can view profile change requests." });
      }

      const pendingRequests = await storage.getPendingProfileChangeRequests();
      res.json(pendingRequests);
    } catch (error) {
      console.error("Error fetching pending profile change requests:", error);
      res.status(500).json({ message: "Failed to fetch pending profile change requests" });
    }
  });

  // Approve/reject profile change request (Senior Managers and Partners only)
  app.put('/api/profile-change-requests/:id/approve', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (!user || (user.designation !== 'Senior Manager' && user.designation !== 'Partner')) {
        return res.status(403).json({ message: "Access denied. Only Senior Managers and Partners can approve profile change requests." });
      }

      const requestId = parseInt(req.params.id);
      const { status, rejectionReason } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }

      if (status === 'rejected' && !rejectionReason?.trim()) {
        return res.status(400).json({ message: "Rejection reason is required when rejecting" });
      }

      const approvedRequest = await storage.approveProfileChangeRequest({
        id: requestId,
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
      }, userId);

      res.json(approvedRequest);
    } catch (error) {
      console.error("Error approving profile change request:", error);
      res.status(500).json({ message: "Failed to approve profile change request" });
    }
  });

  // Get pending user registrations (Senior Managers and Partners only)
  app.get('/api/users/pending', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (!user || (user.designation !== 'Senior Manager' && user.designation !== 'Partner')) {
        return res.status(403).json({ message: "Access denied. Only Senior Managers and Partners can view pending user registrations." });
      }

      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  // Approve user registration (Senior Managers and Partners only)
  app.put('/api/users/:id/approve', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (!user || (user.designation !== 'Senior Manager' && user.designation !== 'Partner')) {
        return res.status(403).json({ message: "Access denied. Only Senior Managers and Partners can approve user registrations." });
      }

      const targetUserId = req.params.id;
      const approvedUser = await storage.approveUser(targetUserId, userId);
      res.json(approvedUser);
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  // Reject user registration (Senior Managers and Partners only)
  app.put('/api/users/:id/reject', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (!user || (user.designation !== 'Senior Manager' && user.designation !== 'Partner')) {
        return res.status(403).json({ message: "Access denied. Only Senior Managers and Partners can reject user registrations." });
      }

      const targetUserId = req.params.id;
      const { rejectionReason } = req.body;

      if (!rejectionReason?.trim()) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const rejectedUser = await storage.rejectUser(targetUserId, userId, rejectionReason.trim());
      res.json(rejectedUser);
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });

  // Activity categories
  app.get('/api/activity-categories', isAuthenticated, async (req: any, res: any) => {
    try {
      const categories = await storage.getActivityCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching activity categories:", error);
      res.status(500).json({ message: "Failed to fetch activity categories" });
    }
  });

  // Submit activity
  app.post('/api/activities', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const validatedData = insertActivitySchema.parse({
        ...req.body,
        userId,
      });

      const activity = await storage.createActivity(validatedData);
      res.json(activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  // Update activity (only pending activities)
  app.put('/api/activities/:id', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const activityId = parseInt(req.params.id);
      const validatedData = insertActivitySchema.parse({
        ...req.body,
        userId,
      });

      // Check if activity exists and belongs to user
      const existingActivity = await storage.getActivityById(activityId);
      if (!existingActivity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      if (existingActivity.userId !== userId) {
        return res.status(403).json({ message: "You can only edit your own activities" });
      }

      if (existingActivity.status !== 'pending') {
        return res.status(400).json({ message: "Only pending activities can be edited" });
      }

      const updatedActivity = await storage.updateActivity(activityId, validatedData);
      res.json(updatedActivity);
    } catch (error) {
      console.error("Error updating activity:", error);
      res.status(500).json({ message: "Failed to update activity" });
    }
  });

  // Get user's activities
  app.get('/api/activities/my', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const activities = await storage.getActivitiesByUser(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Get pending activities (for approvers)
  app.get('/api/activities/pending', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.role !== 'approver') {
        return res.status(403).json({ message: "Access denied. Approver role required." });
      }

      const activities = await storage.getPendingActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching pending activities:", error);
      res.status(500).json({ message: "Failed to fetch pending activities" });
    }
  });

  // Approve/reject activity
  app.post('/api/activities/approve', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.role !== 'approver') {
        return res.status(403).json({ message: "Access denied. Approver role required." });
      }

      const validatedData = approveActivitySchema.parse(req.body);
      const activity = await storage.approveActivity(validatedData, userId);
      res.json(activity);
    } catch (error) {
      console.error("Error approving activity:", error);
      res.status(500).json({ message: "Failed to approve activity" });
    }
  });

  // Get user stats
  app.get('/api/stats', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Get leaderboard
  app.get('/api/leaderboard', isAuthenticated, async (req: any, res: any) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Get monthly leaderboard
  app.get('/api/leaderboard/monthly', isAuthenticated, async (req: any, res: any) => {
    try {
      const leaderboard = await storage.getMonthlyLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching monthly leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch monthly leaderboard" });
    }
  });

  // Get yearly leaderboard
  app.get('/api/leaderboard/yearly', isAuthenticated, async (req: any, res: any) => {
    try {
      const leaderboard = await storage.getYearlyLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching yearly leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch yearly leaderboard" });
    }
  });

  // Get current user's activities (for my-activities page)
  app.get('/api/user-activities', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const activities = await storage.getActivitiesByUserId(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch user activities" });
    }
  });

  // Get recent activities
  app.get('/api/activities/recent', isAuthenticated, async (req: any, res: any) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });

  // Get all activities (for all-activities page)
  app.get('/api/activities/all', isAuthenticated, async (req: any, res: any) => {
    try {
      const activities = await storage.getAllActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching all activities:", error);
      res.status(500).json({ message: "Failed to fetch all activities" });
    }
  });

  // Get team members (approvers only)
  app.get('/api/team', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.role !== 'approver') {
        return res.status(403).json({ message: "Access denied. Team Directory is available to approvers only." });
      }

      const team = await storage.getAllUsers();
      res.json(team);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Get user by ID
  app.get('/api/users/:userId', isAuthenticated, async (req: any, res: any) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user activities
  app.get('/api/users/:userId/activities', isAuthenticated, async (req: any, res: any) => {
    try {
      const { userId } = req.params;
      const activities = await storage.getActivitiesByUserId(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch user activities" });
    }
  });

  // Get user stats
  app.get('/api/users/:userId/stats', isAuthenticated, async (req: any, res: any) => {
    try {
      const { userId } = req.params;
      const stats = await storage.getUserStatsById(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Encashment request routes
  // Create encashment request
  app.post('/api/encashment-requests', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const validatedData = insertEncashmentRequestSchema.parse({
        ...req.body,
        userId,
      });

      const encashmentRequest = await storage.createEncashmentRequest(validatedData);
      res.status(201).json(encashmentRequest);
    } catch (error) {
      console.error("Error creating encashment request:", error);
      res.status(500).json({ message: "Failed to create encashment request" });
    }
  });

  // Get user's encashment requests
  app.get('/api/encashment-requests', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const encashmentRequests = await storage.getEncashmentRequestsByUser(userId);
      res.json(encashmentRequests);
    } catch (error) {
      console.error("Error fetching encashment requests:", error);
      res.status(500).json({ message: "Failed to fetch encashment requests" });
    }
  });

  // Get pending encashment requests (approvers only)
  app.get('/api/encashment-requests/pending', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.role !== 'approver') {
        return res.status(403).json({ message: "Access denied. Only approvers can view pending encashment requests." });
      }

      const pendingRequests = await storage.getPendingEncashmentRequests();
      res.json(pendingRequests);
    } catch (error) {
      console.error("Error fetching pending encashment requests:", error);
      res.status(500).json({ message: "Failed to fetch pending encashment requests" });
    }
  });

  // Admin cleanup route - Remove sample/test users
  app.delete('/api/admin/cleanup-samples', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only allow approvers to perform cleanup
      if (!user || user.role !== 'approver') {
        return res.status(403).json({ message: "Access denied. Approver role required." });
      }

      // Identify and remove sample/test users
      const sampleEmailPatterns = [
        '@dhaddaco.com',
        'test@',
        'sample@',
        'demo@',
        'example@',
        '.test',
        '.sample',
        '.demo'
      ];

      const sampleNamePatterns = [
        'test',
        'sample',
        'demo',
        'example',
        'john',
        'jane',
        'admin',
        'user',
        'amit',
        'kumar',
        'vikram',
        'gupta',
        'sharma',
        'singh',
        'analyst',
        'manager',
        'developer'
      ];

      // Get all users to check for samples
      const allUsers = await storage.getAllUsers();
      const sampleUsers = allUsers.filter(user => {
        // Check email patterns
        const emailMatch = sampleEmailPatterns.some(pattern => 
          user.email?.toLowerCase().includes(pattern.toLowerCase())
        );
        
        // Check name patterns
        const nameMatch = sampleNamePatterns.some(pattern => {
          const firstName = user.firstName?.toLowerCase() || '';
          const lastName = user.lastName?.toLowerCase() || '';
          return firstName.includes(pattern) || lastName.includes(pattern);
        });

        return emailMatch || nameMatch;
      });

      // Remove sample users and their activities
      let removedCount = 0;
      for (const sampleUser of sampleUsers) {
        // Don't remove the current admin user
        if (sampleUser.id === userId) continue;
        
        try {
          // Remove user's activities first
          await db.delete(activities).where(eq(activities.userId, sampleUser.id));
          
          // Remove user's encashment requests
          await db.delete(encashmentRequests).where(eq(encashmentRequests.userId, sampleUser.id));
          
          // Remove the user
          await db.delete(users).where(eq(users.id, sampleUser.id));
          
          removedCount++;
        } catch (error) {
          console.error(`Error removing sample user ${sampleUser.id}:`, error);
        }
      }

      res.json({ 
        message: `Cleanup completed. Removed ${removedCount} sample users and their data.`,
        removedUsers: sampleUsers.map(u => ({ id: u.id, email: u.email, name: `${u.firstName} ${u.lastName}` }))
      });
    } catch (error) {
      console.error("Error during sample cleanup:", error);
      res.status(500).json({ message: "Failed to perform cleanup" });
    }
  });

  // Get team summary for approvers
  app.get('/api/team/summary', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.role !== 'approver') {
        return res.status(403).json({ message: "Access denied. Only approvers can view team summary." });
      }

      const allUsers = await storage.getAllUsers();
      const totalMembers = allUsers.length;
      
      // Calculate team totals
      let totalTeamPoints = 0;
      let monthlyTeamPoints = 0;
      let activeContributors = 0;
      let totalActivities = 0;
      let monthlyActivities = 0;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Get all approved activities for counting
      const allActivities = await storage.getAllActivities();
      const approvedActivities = allActivities.filter(activity => activity.status === 'approved');
      totalActivities = approvedActivities.length;
      
      // Count monthly activities
      monthlyActivities = approvedActivities.filter(activity => {
        const dateToCheck = activity.approvedAt || activity.createdAt;
        if (!dateToCheck) return false;
        const activityDate = new Date(dateToCheck.toString());
        return activityDate.getMonth() === currentMonth && activityDate.getFullYear() === currentYear;
      }).length;
      
      for (const teamUser of allUsers) {
        const stats = await storage.getUserStatsById(teamUser.id);
        totalTeamPoints += stats.totalPointsEarned || 0;
        monthlyTeamPoints += stats.monthlyPoints || 0;
        
        if (stats.totalPointsEarned && stats.totalPointsEarned > 0) {
          activeContributors++;
        }
      }

      res.json({
        totalTeamPoints,
        monthlyTeamPoints,
        activeContributors,
        totalMembers,
        totalActivities,
        monthlyActivities
      });
    } catch (error) {
      console.error("Error fetching team summary:", error);
      res.status(500).json({ message: "Failed to fetch team summary" });
    }
  });

  // Get pending activities count for approvers
  app.get('/api/activities/pending/count', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.role !== 'approver') {
        return res.status(403).json({ message: "Access denied. Only approvers can view pending count." });
      }

      const pendingActivities = await storage.getPendingActivities();
      const totalPoints = pendingActivities.reduce((sum, activity) => sum + (activity.category.points || 0), 0);

      res.json({
        count: pendingActivities.length,
        points: totalPoints
      });
    } catch (error) {
      console.error("Error fetching pending activities count:", error);
      res.status(500).json({ message: "Failed to fetch pending activities count" });
    }
  });

  // Get all users with points summary (approvers only)
  app.get('/api/users/points-summary', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.role !== 'approver') {
        return res.status(403).json({ message: "Access denied. Only approvers can view users summary." });
      }

      const allUsers = await storage.getAllUsers();
      const usersWithStats = await Promise.all(
        allUsers.map(async (user) => {
          const stats = await storage.getUserStatsById(user.id);
          return {
            ...user,
            totalPoints: stats.totalPointsEarned || 0,
            redeemedPoints: stats.redeemedPoints || 0,
          };
        })
      );

      res.json(usersWithStats);
    } catch (error) {
      console.error("Error fetching users summary:", error);
      res.status(500).json({ message: "Failed to fetch users summary" });
    }
  });

  // Get pending encashment requests (approvers only)
  app.get('/api/encashment/pending', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.role !== 'approver') {
        return res.status(403).json({ message: "Access denied. Only approvers can view pending encashment requests." });
      }

      const pendingRequests = await storage.getPendingEncashmentRequests();
      res.json(pendingRequests);
    } catch (error) {
      console.error("Error fetching pending encashment requests:", error);
      res.status(500).json({ message: "Failed to fetch pending encashment requests" });
    }
  });

  // Approve encashment request (approvers only)
  app.post('/api/encashment/approve/:id', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.role !== 'approver') {
        return res.status(403).json({ message: "Access denied. Only approvers can approve encashment requests." });
      }

      const requestId = parseInt(req.params.id);
      const validatedData = approveEncashmentRequestSchema.parse({
        id: requestId,
        status: "approved",
        processedAt: new Date().toISOString(),
      });

      const encashmentRequest = await storage.approveEncashmentRequest(validatedData, userId);
      res.json(encashmentRequest);
    } catch (error) {
      console.error("Error approving encashment request:", error);
      res.status(500).json({ message: "Failed to approve encashment request" });
    }
  });

  // Reject encashment request (approvers only)
  app.post('/api/encashment/reject/:id', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.role !== 'approver') {
        return res.status(403).json({ message: "Access denied. Only approvers can reject encashment requests." });
      }

      const requestId = parseInt(req.params.id);
      const validatedData = approveEncashmentRequestSchema.parse({
        id: requestId,
        status: "rejected",
        rejectionReason: req.body.rejectionReason,
        processedAt: new Date().toISOString(),
      });

      const encashmentRequest = await storage.approveEncashmentRequest(validatedData, userId);
      res.json(encashmentRequest);
    } catch (error) {
      console.error("Error rejecting encashment request:", error);
      res.status(500).json({ message: "Failed to reject encashment request" });
    }
  });

  // Approve/reject encashment request (approvers only)
  app.put('/api/encashment-requests/:id/approve', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.role !== 'approver') {
        return res.status(403).json({ message: "Access denied. Only approvers can approve encashment requests." });
      }

      const validatedData = approveEncashmentRequestSchema.parse({
        ...req.body,
        id: parseInt(req.params.id),
      });

      const encashmentRequest = await storage.approveEncashmentRequest(validatedData, userId);
      res.json(encashmentRequest);
    } catch (error) {
      console.error("Error approving encashment request:", error);
      res.status(500).json({ message: "Failed to approve encashment request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
