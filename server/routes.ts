import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertActivitySchema, approveActivitySchema, insertEncashmentRequestSchema, approveEncashmentRequestSchema, users, activities, encashmentRequests } from "@shared/schema";
import { db, testDatabaseConnection } from "./db";
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
  console.log("Registering routes...");

  // Test database connection with timeout
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log("Database connection failed, continuing with limited functionality");
  }

  // Setup authentication
  try {
    await setupAuth(app);
    console.log("Authentication setup completed");
  } catch (error) {
    console.error("Auth setup failed:", error);
  }

  // Seed activity categories if database is connected
  if (dbConnected) {
    try {
      await storage.seedActivityCategories();
      console.log("Activity categories seeded successfully");
    } catch (error) {
      console.error("Failed to seed activity categories:", error);
    }
  }

  // Auth routes - no approval required, users get immediate access
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

  // Complete profile after login
  app.put('/api/profile/complete', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { firstName, lastName, designation } = req.body;

      if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof designation !== 'string') {
        return res.status(400).json({ message: "firstName, lastName, and designation are required and must be strings" });
      }

      // Determine role based on designation - no approval needed
      let role = 'contributor';
      if (designation.toLowerCase().includes('partner')) {
        role = 'approver';
      } else if (designation.toLowerCase().includes('senior manager') || designation.toLowerCase().includes('manager')) {
        role = 'approver';
      }

      const updatedUser = await storage.updateUserProfile(userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        designation: designation.trim(),
        role: role
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error completing profile:", error);
      res.status(500).json({ message: "Failed to complete profile" });
    }
  });

  // Activity categories
  app.get('/api/activity-categories', isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getActivityCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching activity categories:", error);
      res.status(500).json({ message: "Failed to fetch activity categories" });
    }
  });

  // Submit activity
  app.post('/api/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const validatedData = insertActivitySchema.parse({
        ...req.body,
        userId: userId,
      });

      const activity = await storage.createActivity(validatedData);
      res.json(activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  // Get user's activities
  app.get('/api/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const activities = await storage.getActivitiesByUser(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Leaderboard
  app.get('/api/leaderboard', isAuthenticated, async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  const httpServer = createServer(app);
  console.log("HTTP server created successfully");
  return httpServer;
}