import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertActivitySchema, approveActivitySchema, insertEncashmentRequestSchema, approveEncashmentRequestSchema } from "@shared/schema";

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

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res: any) => {
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
