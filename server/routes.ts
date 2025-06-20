import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("Registering simplified routes without database dependencies...");

  // Basic health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mock login endpoint for testing
  app.get('/api/login', (req, res) => {
    console.log("Login attempt detected");
    res.redirect('/');
  });

  // Mock logout endpoint
  app.get('/api/logout', (req, res) => {
    console.log("Logout attempt detected");
    res.redirect('/');
  });

  // Mock auth user endpoint - return mock user data
  app.get('/api/auth/user', (req, res) => {
    // Return a mock user for testing
    const mockUser = {
      id: "test-user-123",
      email: "test@dco.com",
      firstName: "Test",
      lastName: "User",
      profileImageUrl: null,
      role: "contributor",
      designation: "Associate",
      department: null,
      status: "approved",
      approvedBy: "test-user-123",
      approvedAt: new Date(),
      rejectionReason: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    res.json(mockUser);
  });

  const httpServer = createServer(app);
  console.log("HTTP server created successfully");
  return httpServer;
}