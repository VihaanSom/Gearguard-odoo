const prisma = require('../config/prisma');

const MaintenanceRequest = {
  async create({ subject, type, equipment_id, team_id, assigned_to, scheduled_date, description, priority = 'medium', created_by }) {
    return prisma.maintenanceRequest.create({
      data: {
        subject,
        type,
        description,
        priority,
        equipmentId: equipment_id ? parseInt(equipment_id) : null,
        teamId: team_id ? parseInt(team_id) : null,
        assignedToId: assigned_to ? parseInt(assigned_to) : null,
        createdById: created_by ? parseInt(created_by) : null,
        scheduledDate: scheduled_date ? new Date(scheduled_date) : null
      }
    });
  },

  async findById(id) {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: parseInt(id) },
      include: {
        equipment: { select: { name: true, serialNumber: true } },
        team: { select: { name: true } },
        assignedTo: { select: { name: true } },
        createdBy: { select: { name: true } }
      }
    });
    if (!request) return null;
    return {
      ...request,
      equipment_name: request.equipment?.name,
      serial_number: request.equipment?.serialNumber,
      team_name: request.team?.name,
      assigned_to_name: request.assignedTo?.name,
      created_by_name: request.createdBy?.name
    };
  },

  async findAll({ status, type, team_id, assigned_to } = {}) {
    const requests = await prisma.maintenanceRequest.findMany({
      where: {
        ...(status && { status }),
        ...(type && { type }),
        ...(team_id && { teamId: parseInt(team_id) }),
        ...(assigned_to && { assignedToId: parseInt(assigned_to) })
      },
      include: {
        equipment: { select: { name: true } },
        team: { select: { name: true } },
        assignedTo: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return requests.map(r => ({
      ...r,
      equipment_name: r.equipment?.name,
      team_name: r.team?.name,
      assigned_to_name: r.assignedTo?.name
    }));
  },

  async getKanbanData(teamId = null) {
    const requests = await prisma.maintenanceRequest.findMany({
      where: teamId ? { teamId: parseInt(teamId) } : {},
      include: {
        equipment: { select: { name: true } },
        assignedTo: { select: { name: true, avatarUrl: true } }
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }]
    });
    return requests.map(r => ({
      ...r,
      equipment_name: r.equipment?.name,
      assigned_to: r.assignedToId,
      assigned_to_name: r.assignedTo?.name,
      assigned_to_avatar: r.assignedTo?.avatarUrl,
      scheduled_date: r.scheduledDate
    }));
  },

  async getCalendarData(startDate, endDate) {
    const requests = await prisma.maintenanceRequest.findMany({
      where: {
        scheduledDate: { not: null, gte: new Date(startDate), lte: new Date(endDate) }
      },
      include: {
        equipment: { select: { name: true } },
        team: { select: { name: true } }
      },
      orderBy: { scheduledDate: 'asc' }
    });
    return requests.map(r => ({
      ...r,
      equipment_name: r.equipment?.name,
      team_name: r.team?.name,
      scheduled_date: r.scheduledDate
    }));
  },

  async updateStatus(id, status) {
    return prisma.maintenanceRequest.update({
      where: { id: parseInt(id) },
      data: { status }
    });
  },

  async assign(id, userId) {
    return prisma.maintenanceRequest.update({
      where: { id: parseInt(id) },
      data: { assignedToId: parseInt(userId), status: 'in_progress' }
    });
  },

  async complete(id, durationHours) {
    return prisma.maintenanceRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'repaired', durationHours: parseFloat(durationHours), completedAt: new Date() }
    });
  },

  async markAsScrap(id) {
    const request = await prisma.maintenanceRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'scrap' }
    });
    if (request.equipmentId) {
      await prisma.equipment.update({
        where: { id: request.equipmentId },
        data: { isScrapped: true }
      });
    }
    return request;
  },

  async findByEquipment(equipmentId, { activeOnly = true } = {}) {
    const requests = await prisma.maintenanceRequest.findMany({
      where: {
        equipmentId: parseInt(equipmentId),
        ...(activeOnly && { status: { in: ['new', 'in_progress'] } })
      },
      include: { assignedTo: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return requests.map(r => ({ ...r, assigned_to_name: r.assignedTo?.name }));
  },

  async update(id, { subject, type, equipment_id, team_id, assigned_to, scheduled_date, description, priority }) {
    return prisma.maintenanceRequest.update({
      where: { id: parseInt(id) },
      data: {
        ...(subject && { subject }),
        ...(type && { type }),
        ...(equipment_id !== undefined && { equipmentId: equipment_id ? parseInt(equipment_id) : null }),
        ...(team_id !== undefined && { teamId: team_id ? parseInt(team_id) : null }),
        ...(assigned_to !== undefined && { assignedToId: assigned_to ? parseInt(assigned_to) : null }),
        ...(scheduled_date !== undefined && { scheduledDate: scheduled_date ? new Date(scheduled_date) : null }),
        ...(description !== undefined && { description }),
        ...(priority && { priority })
      }
    });
  },

  async delete(id) {
    return prisma.maintenanceRequest.delete({ where: { id: parseInt(id) } });
  },

  async getStatsByTeam() {
    const teams = await prisma.maintenanceTeam.findMany({
      include: {
        requests: { select: { status: true } }
      },
      orderBy: { name: 'asc' }
    });
    return teams.map(t => ({
      team_name: t.name,
      total_requests: t.requests.length,
      new_count: t.requests.filter(r => r.status === 'new').length,
      in_progress_count: t.requests.filter(r => r.status === 'in_progress').length,
      repaired_count: t.requests.filter(r => r.status === 'repaired').length,
      scrap_count: t.requests.filter(r => r.status === 'scrap').length
    }));
  }
};

module.exports = MaintenanceRequest;
