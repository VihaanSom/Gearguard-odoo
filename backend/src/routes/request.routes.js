const express = require('express');
const router = express.Router();
const { MaintenanceRequest, Equipment } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, validateRequired, formatResponse, AppError } = require('../utils/helpers');

// Apply auth to all routes
router.use(authenticate);

// Get all requests (with optional filters)
router.get('/', asyncHandler(async (req, res) => {
    const { status, type, team_id, assigned_to } = req.query;
    const requests = await MaintenanceRequest.findAll({ status, type, team_id, assigned_to });
    res.json(formatResponse(requests));
}));

// Get Kanban data
router.get('/kanban', asyncHandler(async (req, res) => {
    const { team_id } = req.query;
    const requests = await MaintenanceRequest.getKanbanData(team_id);

    // Group by status for Kanban columns
    const kanban = {
        new: requests.filter(r => r.status === 'new'),
        in_progress: requests.filter(r => r.status === 'in_progress'),
        repaired: requests.filter(r => r.status === 'repaired'),
        scrap: requests.filter(r => r.status === 'scrap')
    };

    res.json(formatResponse(kanban));
}));

// Get Calendar data
router.get('/calendar', asyncHandler(async (req, res) => {
    const { start, end } = req.query;

    if (!start || !end) {
        throw new AppError('Start and end dates required', 400);
    }

    const requests = await MaintenanceRequest.getCalendarData(start, end);

    // Format for FullCalendar
    const events = requests.map(r => ({
        id: r.id,
        title: r.subject,
        start: r.scheduled_date,
        extendedProps: {
            type: r.type,
            status: r.status,
            equipment_name: r.equipment_name,
            team_name: r.team_name
        },
        backgroundColor: r.type === 'preventive' ? '#10b981' : '#f59e0b',
        borderColor: r.type === 'preventive' ? '#059669' : '#d97706'
    }));

    res.json(formatResponse(events));
}));

// Get statistics by team
router.get('/stats/by-team', asyncHandler(async (req, res) => {
    const stats = await MaintenanceRequest.getStatsByTeam();
    res.json(formatResponse(stats));
}));

// Get request by ID
router.get('/:id', asyncHandler(async (req, res) => {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
        throw new AppError('Request not found', 404);
    }
    res.json(formatResponse(request));
}));

// Create request
router.post('/', asyncHandler(async (req, res) => {
    validateRequired(req.body, ['subject', 'type', 'equipment_id']);

    const { equipment_id, type } = req.body;

    // Auto-fill team from equipment
    const equipment = await Equipment.findById(equipment_id);
    if (!equipment) {
        throw new AppError('Equipment not found', 404);
    }

    const requestData = {
        ...req.body,
        team_id: req.body.team_id || equipment.maintenance_team_id,
        created_by: req.user.id
    };

    // Validate preventive requests have scheduled_date
    if (type === 'preventive' && !requestData.scheduled_date) {
        throw new AppError('Scheduled date required for preventive maintenance', 400);
    }

    const request = await MaintenanceRequest.create(requestData);
    res.status(201).json(formatResponse(request, 'Request created successfully'));
}));

// Update request
router.patch('/:id', asyncHandler(async (req, res) => {
    const request = await MaintenanceRequest.update(req.params.id, req.body);
    if (!request) {
        throw new AppError('Request not found', 404);
    }
    res.json(formatResponse(request, 'Request updated successfully'));
}));

// Update status (for Kanban drag & drop)
router.patch('/:id/status', asyncHandler(async (req, res) => {
    validateRequired(req.body, ['status']);
    const { status } = req.body;

    if (!['new', 'in_progress', 'repaired', 'scrap'].includes(status)) {
        throw new AppError('Invalid status', 400);
    }

    const request = await MaintenanceRequest.updateStatus(req.params.id, status);
    if (!request) {
        throw new AppError('Request not found', 404);
    }
    res.json(formatResponse(request, 'Status updated'));
}));

// Assign request
router.patch('/:id/assign', authorize('manager', 'technician'), asyncHandler(async (req, res) => {
    validateRequired(req.body, ['user_id']);

    // Technicians can only assign to themselves
    if (req.user.role === 'technician' && req.body.user_id !== req.user.id) {
        throw new AppError('Technicians can only assign requests to themselves', 403);
    }

    const request = await MaintenanceRequest.assign(req.params.id, req.body.user_id);
    if (!request) {
        throw new AppError('Request not found', 404);
    }
    res.json(formatResponse(request, 'Request assigned'));
}));

// Complete request
router.patch('/:id/complete', authorize('manager', 'technician'), asyncHandler(async (req, res) => {
    validateRequired(req.body, ['duration_hours']);

    const request = await MaintenanceRequest.complete(req.params.id, req.body.duration_hours);
    if (!request) {
        throw new AppError('Request not found', 404);
    }
    res.json(formatResponse(request, 'Request marked as completed'));
}));

// Scrap request (also scraps equipment)
router.patch('/:id/scrap', authorize('manager'), asyncHandler(async (req, res) => {
    const request = await MaintenanceRequest.markAsScrap(req.params.id);
    if (!request) {
        throw new AppError('Request not found', 404);
    }
    res.json(formatResponse(request, 'Request marked as scrap, equipment scrapped'));
}));

// Delete request (manager only)
router.delete('/:id', authorize('manager'), asyncHandler(async (req, res) => {
    const result = await MaintenanceRequest.delete(req.params.id);
    if (!result) {
        throw new AppError('Request not found', 404);
    }
    res.json(formatResponse(null, 'Request deleted successfully'));
}));

module.exports = router;
