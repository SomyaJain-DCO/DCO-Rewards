import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Add connection timeout and retry logic
const connectionOptions = {
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10
};

export const pool = new Pool(connectionOptions);
export const db = drizzle({ client: pool, schema });

// Test connection on startup
export async function testDatabaseConnection() {
  try {
    console.log("Testing database connection...");
    // Use a timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 5000)
    );
    
    const queryPromise = pool.query('SELECT 1 as test');
    await Promise.race([queryPromise, timeoutPromise]);
    
    console.log("Database connection successful");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message || error);
    return false;
  }
}