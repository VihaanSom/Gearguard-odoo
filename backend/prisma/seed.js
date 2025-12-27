const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding database...');

    try {
        // Clean existing data
        await prisma.maintenanceRequest.deleteMany();
        await prisma.teamMember.deleteMany();
        await prisma.equipment.deleteMany();
        await prisma.maintenanceTeam.deleteMany();
        await prisma.user.deleteMany();

        const passwordHash = await bcrypt.hash('password123', 10);

        // Create users
        const manager = await prisma.user.create({
            data: { name: 'John Manager', email: 'manager@gearguard.com', passwordHash, role: 'manager' }
        });
        const sarah = await prisma.user.create({
            data: { name: 'Sarah Technician', email: 'sarah@gearguard.com', passwordHash, role: 'technician' }
        });
        const mike = await prisma.user.create({
            data: { name: 'Mike Technician', email: 'mike@gearguard.com', passwordHash, role: 'technician' }
        });
        const lisa = await prisma.user.create({
            data: { name: 'Lisa User', email: 'lisa@gearguard.com', passwordHash, role: 'user' }
        });
        console.log('  ✓ Created 4 users');

        // Create teams
        const itTeam = await prisma.maintenanceTeam.create({ data: { name: 'IT Equipment Team' } });
        const hvacTeam = await prisma.maintenanceTeam.create({ data: { name: 'HVAC Team' } });
        await prisma.maintenanceTeam.create({ data: { name: 'Electrical Team' } });
        await prisma.maintenanceTeam.create({ data: { name: 'General Maintenance' } });
        console.log('  ✓ Created 4 teams');

        // Add members to teams
        await prisma.teamMember.create({ data: { teamId: itTeam.id, userId: sarah.id } });
        await prisma.teamMember.create({ data: { teamId: hvacTeam.id, userId: mike.id } });
        console.log('  ✓ Added technicians to teams');

        // Create equipment
        const laptop = await prisma.equipment.create({
            data: { name: 'Dell Laptop XPS 15', serialNumber: 'DELL-XPS-001', department: 'Engineering', location: 'Office A-101', maintenanceTeamId: itTeam.id, purchaseDate: new Date('2023-01-15'), warrantyExpiry: new Date('2026-01-15') }
        });
        const printer = await prisma.equipment.create({
            data: { name: 'HP Printer LaserJet', serialNumber: 'HP-LJ-002', department: 'Admin', location: 'Office B-203', maintenanceTeamId: itTeam.id, purchaseDate: new Date('2022-06-20'), warrantyExpiry: new Date('2025-06-20') }
        });
        const server = await prisma.equipment.create({
            data: { name: 'Server Rack Unit 1', serialNumber: 'SRV-RACK-001', department: 'IT', location: 'Server Room', maintenanceTeamId: itTeam.id }
        });
        await prisma.equipment.create({
            data: { name: 'HVAC Unit Floor 1', serialNumber: 'HVAC-F1-001', department: 'Facilities', location: 'Floor 1', maintenanceTeamId: hvacTeam.id }
        });
        console.log('  ✓ Created 4 equipment items');

        // Create maintenance requests
        await prisma.maintenanceRequest.create({
            data: { subject: 'Laptop not booting', type: 'corrective', description: 'Black screen on startup', priority: 'high', equipmentId: laptop.id, teamId: itTeam.id, assignedToId: sarah.id, createdById: lisa.id, status: 'new' }
        });
        await prisma.maintenanceRequest.create({
            data: { subject: 'Printer paper jam', type: 'corrective', description: 'Frequent jams in tray 2', priority: 'medium', equipmentId: printer.id, teamId: itTeam.id, createdById: lisa.id, status: 'in_progress' }
        });
        await prisma.maintenanceRequest.create({
            data: { subject: 'Server maintenance', type: 'preventive', description: 'Quarterly check', priority: 'low', equipmentId: server.id, teamId: itTeam.id, assignedToId: sarah.id, createdById: manager.id, status: 'new', scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
        });
        console.log('  ✓ Created 3 maintenance requests');

        console.log('✅ Database seeded successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed();
