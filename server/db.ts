import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionOptions = {
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  max: 1,
  ssl: { rejectUnauthorized: false }
};

export const pool = new Pool(connectionOptions);
export const db = drizzle(pool, { schema });

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function initializeDatabase(): Promise<boolean> {
  try {
    const client = await pool.connect();
    
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY,
        email VARCHAR,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        designation VARCHAR,
        role VARCHAR DEFAULT 'contributor',
        department VARCHAR,
        status VARCHAR DEFAULT 'pending',
        approved_at TIMESTAMP,
        approved_by VARCHAR,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS activity_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        points INTEGER NOT NULL,
        monetary_value DECIMAL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        category_id INTEGER NOT NULL REFERENCES activity_categories(id),
        title VARCHAR NOT NULL,
        description TEXT,
        activity_date DATE NOT NULL,
        status VARCHAR DEFAULT 'pending',
        attachment_url VARCHAR,
        file_path VARCHAR,
        approved_at TIMESTAMP,
        approved_by VARCHAR REFERENCES users(id),
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS encashment_requests (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        points_to_redeem INTEGER NOT NULL,
        monetary_value DECIMAL NOT NULL,
        status VARCHAR DEFAULT 'pending',
        approved_at TIMESTAMP,
        approved_by VARCHAR REFERENCES users(id),
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS profile_change_requests (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        requested_first_name VARCHAR,
        requested_last_name VARCHAR,
        requested_designation VARCHAR,
        requested_role VARCHAR,
        status VARCHAR DEFAULT 'pending',
        approved_at TIMESTAMP,
        approved_by VARCHAR REFERENCES users(id),
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    client.release();
    console.log('Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}