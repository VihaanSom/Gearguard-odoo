require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'gearguard',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

async function seed() {
    const client = await pool.connect();

    try {
        console.log('🌱 Seeding database...');
        await client.query('BEGIN');

        // Create users
        const hashedPassword = await bcrypt.hash('password123', 10);

        const usersResult = await client.query(`
      INSERT INTO users (name, email, password_hash, role) VALUES
        ('John Manager', 'manager@gearguard.com', $1, 'manager'),
        ('Sarah Technician', 'sarah@gearguard.com', $1, 'technician'),
        ('Mike Technician', 'mike@gearguard.com', $1, 'technician'),
        ('Lisa User', 'lisa@gearguard.com', $1, 'user'),
        ('Tom User', 'tom@gearguard.com', $1, 'user')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, role
    `, [hashedPassword]);
        console.log(`  ✓ Created ${usersResult.rowCount} users`);

        // Create maintenance teams
        const teamsResult = await client.query(`
      INSERT INTO maintenance_teams (name) VALUES
        ('IT Equipment Team'),
        ('HVAC Team'),
        ('Electrical Team'),
        ('General Maintenance')
      ON CONFLICT DO NOTHING
      RETURNING id, name
    `);
        console.log(`  ✓ Created ${teamsResult.rowCount} teams`);

        // Get team IDs
        const teams = await client.query('SELECT id, name FROM maintenance_teams');
        const itTeam = teams.rows.find(t => t.name === 'IT Equipment Team');
        const hvacTeam = teams.rows.find(t => t.name === 'HVAC Team');

        // Get technician IDs
        const technicians = await client.query("SELECT id FROM users WHERE role = 'technician'");

        // Add technicians to teams
        if (technicians.rows.length >= 2 && itTeam && hvacTeam) {
            await client.query(`
        INSERT INTO team_members (team_id, user_id) VALUES
          ($1, $3),
          ($2, $4)
        ON CONFLICT DO NOTHING
      `, [itTeam.id, hvacTeam.id, technicians.rows[0].id, technicians.rows[1].id]);
            console.log('  ✓ Added technicians to teams');
        }

        // Create equipment
        const equipmentResult = await client.query(`
      INSERT INTO equipment (name, serial_number, department, owner_employee, purchase_date, warranty_expiry, location, maintenance_team_id) VALUES
        ('Dell Laptop XPS 15', 'DELL-XPS-001', 'Engineering', 'John Doe', '2023-01-15', '2026-01-15', 'Office A-101', $1),
        ('HP Printer LaserJet', 'HP-LJ-002', 'Admin', 'Jane Smith', '2022-06-20', '2025-06-20', 'Office B-203', $1),
        ('Server Rack Unit 1', 'SRV-RACK-001', 'IT', 'System Admin', '2021-03-10', '2024-03-10', 'Server Room', $1),
        ('HVAC Unit Floor 1', 'HVAC-F1-001', 'Facilities', 'Building Ops', '2020-08-01', '2025-08-01', 'Floor 1 Mechanical Room', $2),
        ('Conference Room Projector', 'PROJ-CR-001', 'Admin', 'Office Manager', '2023-04-01', '2026-04-01', 'Conference Room A', $1),
        ('Industrial Printer', 'IND-PRINT-001', 'Manufacturing', 'Floor Manager', '2022-11-15', '2025-11-15', 'Production Floor', $1)
      ON CONFLICT (serial_number) DO NOTHING
      RETURNING id, name
    `, [itTeam?.id, hvacTeam?.id]);
        console.log(`  ✓ Created ${equipmentResult.rowCount} equipment items`);

        // Get equipment and user IDs for requests
        const equipment = await client.query('SELECT id FROM equipment LIMIT 3');
        const users = await client.query("SELECT id FROM users WHERE role = 'user' LIMIT 1");

        // Create sample maintenance requests
        if (equipment.rows.length >= 3 && itTeam && technicians.rows.length > 0) {
            const requestsResult = await client.query(`
        INSERT INTO maintenance_requests (subject, type, description, priority, equipment_id, team_id, assigned_to, created_by, status, scheduled_date) VALUES
          ('Laptop not booting', 'corrective', 'Laptop shows black screen on startup', 'high', $1, $4, $6, $7, 'new', NULL),
          ('Printer paper jam', 'corrective', 'Frequent paper jams in tray 2', 'medium', $2, $4, NULL, $7, 'in_progress', NULL),
          ('Server maintenance', 'preventive', 'Quarterly server maintenance check', 'low', $3, $4, $6, $7, 'new', CURRENT_DATE + INTERVAL '7 days'),
          ('HVAC filter replacement', 'preventive', 'Monthly filter replacement', 'medium', $5, $4, NULL, $7, 'new', CURRENT_DATE + INTERVAL '14 days')
        ON CONFLICT DO NOTHING
        RETURNING id, subject
      `, [
                equipment.rows[0]?.id,
                equipment.rows[1]?.id,
                equipment.rows[2]?.id,
                itTeam.id,
                equipment.rows[0]?.id,
                technicians.rows[0]?.id,
                users.rows[0]?.id
            ]);
            console.log(`  ✓ Created ${requestsResult.rowCount} maintenance requests`);
        }

        await client.query('COMMIT');
        console.log('✅ Database seeded successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Seeding failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seed().catch(() => process.exit(1));
