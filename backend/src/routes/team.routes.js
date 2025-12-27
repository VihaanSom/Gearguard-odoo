const express = require('express');
const router = express.Router();
const { MaintenanceTeam } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, validateRequired, formatResponse, AppError } = require('../utils/helpers');

// Apply auth to all routes
router.use(authenticate);

// Get all teams
router.get('/', asyncHandler(async (req, res) => {
    const teams = await MaintenanceTeam.findAllWithMemberCount();
    res.json(formatResponse(teams));
}));

// Get team by ID
router.get('/:id', asyncHandler(async (req, res) => {
    const team = await MaintenanceTeam.findById(req.params.id);
    if (!team) {
        throw new AppError('Team not found', 404);
    }
    res.json(formatResponse(team));
}));

// Get team members
router.get('/:id/members', asyncHandler(async (req, res) => {
    const members = await MaintenanceTeam.getMembers(req.params.id);
    res.json(formatResponse(members));
}));

// Create team (manager only)
router.post('/', authorize('manager'), asyncHandler(async (req, res) => {
    validateRequired(req.body, ['name']);
    const team = await MaintenanceTeam.create(req.body);
    res.status(201).json(formatResponse(team, 'Team created successfully'));
}));

// Update team (manager only)
router.patch('/:id', authorize('manager'), asyncHandler(async (req, res) => {
    const team = await MaintenanceTeam.update(req.params.id, req.body);
    if (!team) {
        throw new AppError('Team not found', 404);
    }
    res.json(formatResponse(team, 'Team updated successfully'));
}));

// Add member to team (manager only)
router.post('/:id/members', authorize('manager'), asyncHandler(async (req, res) => {
    validateRequired(req.body, ['user_id']);
    const result = await MaintenanceTeam.addMember(req.params.id, req.body.user_id);
    res.json(formatResponse(result, 'Member added to team'));
}));

// Remove member from team (manager only)
router.delete('/:id/members/:userId', authorize('manager'), asyncHandler(async (req, res) => {
    await MaintenanceTeam.removeMember(req.params.id, req.params.userId);
    res.json(formatResponse(null, 'Member removed from team'));
}));

// Delete team (manager only)
router.delete('/:id', authorize('manager'), asyncHandler(async (req, res) => {
    const result = await MaintenanceTeam.delete(req.params.id);
    if (!result) {
        throw new AppError('Team not found', 404);
    }
    res.json(formatResponse(null, 'Team deleted successfully'));
}));

module.exports = router;
