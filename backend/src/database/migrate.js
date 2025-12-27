require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'gearguard',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

const migrations = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('user', 'technician', 'manager')) NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance teams table
CREATE TABLE IF NOT EXISTS maintenance_teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Team members junction table
CREATE TABLE IF NOT EXISTS team_members (
  team_id INT REFERENCES maintenance_teams(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  serial_number TEXT UNIQUE NOT NULL,
  department TEXT,
  owner_employee TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  location TEXT,
  maintenance_team_id INT REFERENCES maintenance_teams(id) ON DELETE SET NULL,
  is_scrapped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id SERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  type TEXT CHECK (type IN ('corrective', 'preventive')) NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  equipment_id INT REFERENCES equipment(id) ON DELETE SET NULL,
  team_id INT REFERENCES maintenance_teams(id) ON DELETE SET NULL,
  assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT CHECK (
    status IN ('new', 'in_progress', 'repaired', 'scrap')
  ) DEFAULT 'new',
  scheduled_date DATE,
  duration_hours NUMERIC,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_type ON maintenance_requests(type);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_equipment ON maintenance_requests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_team ON maintenance_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_scheduled ON maintenance_requests(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_equipment_team ON equipment(maintenance_team_id);
CREATE INDEX IF NOT EXISTS idx_equipment_scrapped ON equipment(is_scrapped);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`;

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🚀 Running migrations...');
        await client.query(migrations);
        console.log('✅ Migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch(() => process.exit(1));
