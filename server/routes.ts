import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("Registering routes...");

  // Basic health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Temporary auth endpoint for testing
  app.get('/api/auth/user', (req, res) => {
    res.status(401).json({ message: 'Not authenticated' });
  });

  const httpServer = createServer(app);
  console.log("HTTP server created successfully");
  return httpServer;
}