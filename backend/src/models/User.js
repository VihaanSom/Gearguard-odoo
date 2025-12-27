const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

const User = {
    async create({ name, email, password, role = 'user', avatar_url = null }) {
        const passwordHash = await bcrypt.hash(password, 10);
        return prisma.user.create({
            data: { name, email, passwordHash, role, avatarUrl: avatar_url },
            select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true }
        });
    },

    async findById(id) {
        return prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true }
        });
    },

    async findByEmail(email) {
        return prisma.user.findUnique({ where: { email } });
    },

    async findAll() {
        return prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true },
            orderBy: { name: 'asc' }
        });
    },

    async update(id, { name, email, role, avatar_url }) {
        return prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(role && { role }),
                ...(avatar_url !== undefined && { avatarUrl: avatar_url })
            },
            select: { id: true, name: true, email: true, role: true, avatarUrl: true, updatedAt: true }
        });
    },

    async delete(id) {
        return prisma.user.delete({ where: { id: parseInt(id) } });
    },

    async validatePassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    },

    async findByRole(role) {
        return prisma.user.findMany({
            where: { role },
            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
            orderBy: { name: 'asc' }
        });
    },

    async findByTeam(teamId) {
        return prisma.user.findMany({
            where: { teams: { some: { teamId: parseInt(teamId) } } },
            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
            orderBy: { name: 'asc' }
        });
    }
};

module.exports = User;
