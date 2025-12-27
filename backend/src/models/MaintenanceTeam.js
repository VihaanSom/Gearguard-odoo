const prisma = require('../config/prisma');

const MaintenanceTeam = {
    async create({ name }) {
        return prisma.maintenanceTeam.create({ data: { name } });
    },

    async findById(id) {
        return prisma.maintenanceTeam.findUnique({ where: { id: parseInt(id) } });
    },

    async findAll() {
        return prisma.maintenanceTeam.findMany({ orderBy: { name: 'asc' } });
    },

    async update(id, { name }) {
        return prisma.maintenanceTeam.update({
            where: { id: parseInt(id) },
            data: { ...(name && { name }) }
        });
    },

    async delete(id) {
        return prisma.maintenanceTeam.delete({ where: { id: parseInt(id) } });
    },

    async addMember(teamId, userId) {
        return prisma.teamMember.upsert({
            where: { teamId_userId: { teamId: parseInt(teamId), userId: parseInt(userId) } },
            update: {},
            create: { teamId: parseInt(teamId), userId: parseInt(userId) }
        }).catch(() => null);
    },

    async removeMember(teamId, userId) {
        return prisma.teamMember.delete({
            where: { teamId_userId: { teamId: parseInt(teamId), userId: parseInt(userId) } }
        }).catch(() => null);
    },

    async getMembers(teamId) {
        const members = await prisma.teamMember.findMany({
            where: { teamId: parseInt(teamId) },
            include: { user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } } },
            orderBy: { user: { name: 'asc' } }
        });
        return members.map(m => m.user);
    },

    async getTeamsForUser(userId) {
        const memberships = await prisma.teamMember.findMany({
            where: { userId: parseInt(userId) },
            include: { team: true },
            orderBy: { team: { name: 'asc' } }
        });
        return memberships.map(m => m.team);
    },

    async findAllWithMemberCount() {
        const teams = await prisma.maintenanceTeam.findMany({
            include: { _count: { select: { members: true } } },
            orderBy: { name: 'asc' }
        });
        return teams.map(t => ({ ...t, member_count: t._count.members }));
    }
};

module.exports = MaintenanceTeam;
