const prisma = require('../config/prisma');

const Equipment = {
  async create({ name, serial_number, department, owner_employee, purchase_date, warranty_expiry, location, maintenance_team_id, default_technician_id }) {
    return prisma.equipment.create({
      data: {
        name,
        serialNumber: serial_number,
        department,
        ownerEmployee: owner_employee,
        purchaseDate: purchase_date ? new Date(purchase_date) : null,
        warrantyExpiry: warranty_expiry ? new Date(warranty_expiry) : null,
        location,
        maintenanceTeamId: maintenance_team_id ? parseInt(maintenance_team_id) : null,
        defaultTechnicianId: default_technician_id ? parseInt(default_technician_id) : null
      }
    });
  },

  async findById(id) {
    const eq = await prisma.equipment.findUnique({
      where: { id: parseInt(id) },
      include: {
        maintenanceTeam: { select: { name: true } },
        defaultTechnician: { select: { id: true, name: true } }
      }
    });
    if (!eq) return null;
    return {
      ...eq,
      team_name: eq.maintenanceTeam?.name,
      default_technician_name: eq.defaultTechnician?.name
    };
  },

  async findAll({ includeScrap = false } = {}) {
    const equipment = await prisma.equipment.findMany({
      where: includeScrap ? {} : { isScrapped: false },
      include: {
        maintenanceTeam: { select: { name: true } },
        defaultTechnician: { select: { id: true, name: true } }
      },
      orderBy: { name: 'asc' }
    });
    return equipment.map(eq => ({
      ...eq,
      team_name: eq.maintenanceTeam?.name,
      default_technician_name: eq.defaultTechnician?.name
    }));
  },

  async update(id, { name, serial_number, department, owner_employee, purchase_date, warranty_expiry, location, maintenance_team_id, default_technician_id }) {
    return prisma.equipment.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(serial_number && { serialNumber: serial_number }),
        ...(department !== undefined && { department }),
        ...(owner_employee !== undefined && { ownerEmployee: owner_employee }),
        ...(purchase_date !== undefined && { purchaseDate: purchase_date ? new Date(purchase_date) : null }),
        ...(warranty_expiry !== undefined && { warrantyExpiry: warranty_expiry ? new Date(warranty_expiry) : null }),
        ...(location !== undefined && { location }),
        ...(maintenance_team_id !== undefined && { maintenanceTeamId: maintenance_team_id ? parseInt(maintenance_team_id) : null }),
        ...(default_technician_id !== undefined && { defaultTechnicianId: default_technician_id ? parseInt(default_technician_id) : null })
      }
    });
  },

  async scrap(id) {
    return prisma.equipment.update({
      where: { id: parseInt(id) },
      data: { isScrapped: true }
    });
  },

  async delete(id) {
    return prisma.equipment.delete({ where: { id: parseInt(id) } });
  },

  async findByTeam(teamId) {
    return prisma.equipment.findMany({
      where: { maintenanceTeamId: parseInt(teamId), isScrapped: false },
      orderBy: { name: 'asc' }
    });
  },

  async findExpiringWarranty(days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const equipment = await prisma.equipment.findMany({
      where: {
        warrantyExpiry: { gte: new Date(), lte: futureDate },
        isScrapped: false
      },
      orderBy: { warrantyExpiry: 'asc' }
    });
    return equipment.map(eq => ({
      ...eq,
      serial_number: eq.serialNumber,
      warranty_expiry: eq.warrantyExpiry
    }));
  },

  async getActiveRequestCount(equipmentId) {
    return prisma.maintenanceRequest.count({
      where: { equipmentId: parseInt(equipmentId), status: { in: ['new', 'in_progress'] } }
    });
  },

  async search(searchTerm) {
    const term = `%${searchTerm}%`;
    const equipment = await prisma.equipment.findMany({
      where: {
        isScrapped: false,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { serialNumber: { contains: searchTerm, mode: 'insensitive' } },
          { department: { contains: searchTerm, mode: 'insensitive' } },
          { location: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: { maintenanceTeam: { select: { name: true } } },
      orderBy: { name: 'asc' }
    });
    return equipment.map(eq => ({ ...eq, team_name: eq.maintenanceTeam?.name }));
  }
};

module.exports = Equipment;
