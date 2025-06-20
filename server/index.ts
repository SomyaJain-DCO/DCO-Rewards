import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import { testDatabaseConnection, initializeDatabase } from "./db";

async function startServer() {
  console.log("Starting simplified server initialization...");
  
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Basic logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  // Create HTTP server first
  const server = createServer(app);
  console.log("HTTP server created successfully");

  // Test database connection and initialize
  testDatabaseConnection().then(async connected => {
    if (connected) {
      console.log("Database connection verified");
      // Initialize database tables
      const initialized = await initializeDatabase();
      if (initialized) {
        console.log("Database initialized successfully");
        // Import and register routes only after database is ready
        import("./routes").then(({ registerRoutes }) => {
          registerRoutes(app).catch(err => {
            console.error("Failed to register routes:", err);
          });
        });
      } else {
        console.log("Database initialization failed, using simplified routes");
        registerSimplifiedRoutes(app);
      }
    } else {
      console.log("Database connection failed, registering simplified routes...");
      registerSimplifiedRoutes(app);
    }
  });

  // Register simplified routes without database dependencies
  console.log("Registering simplified routes without database dependencies...");
  registerSimplifiedRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("Server error:", err);
  });

  // Setup Vite or static serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start listening on port 5000
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });

  return server;
}

function registerSimplifiedRoutes(app: express.Express) {
  // Basic health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Basic auth check (without database)
  app.get('/api/auth/user', (req, res) => {
    res.status(401).json({ message: "Authentication service initializing" });
  });

  // Catch-all for other API routes
  app.use('/api/*', (req, res) => {
    res.status(503).json({ message: "Service initializing, please try again" });
  });
}

startServer().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
