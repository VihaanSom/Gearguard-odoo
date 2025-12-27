const express = require('express');
const router = express.Router();
const { Equipment, MaintenanceRequest } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, validateRequired, formatResponse, AppError } = require('../utils/helpers');

// Apply auth to all routes
router.use(authenticate);

// Get all equipment
router.get('/', asyncHandler(async (req, res) => {
    const { includeScrap } = req.query;
    const equipment = await Equipment.findAll({ includeScrap: includeScrap === 'true' });
    res.json(formatResponse(equipment));
}));

// Search equipment
router.get('/search', asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q) {
        throw new AppError('Search query required', 400);
    }
    const equipment = await Equipment.search(q);
    res.json(formatResponse(equipment));
}));

// Get equipment with expiring warranty
router.get('/warranty-expiring', asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    const equipment = await Equipment.findExpiringWarranty(parseInt(days));
    res.json(formatResponse(equipment));
}));

// Get equipment by ID
router.get('/:id', asyncHandler(async (req, res) => {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
        throw new AppError('Equipment not found', 404);
    }
    res.json(formatResponse(equipment));
}));

// Get maintenance requests for equipment (Smart Button)
router.get('/:id/requests', asyncHandler(async (req, res) => {
    const { activeOnly = 'true' } = req.query;
    const requests = await MaintenanceRequest.findByEquipment(
        req.params.id,
        { activeOnly: activeOnly === 'true' }
    );
    res.json(formatResponse(requests));
}));

// Get active request count for equipment (Smart Button Badge)
router.get('/:id/requests/count', asyncHandler(async (req, res) => {
    const count = await Equipment.getActiveRequestCount(req.params.id);
    res.json(formatResponse({ count }));
}));

// Create equipment (manager/technician)
router.post('/', authorize('manager', 'technician'), asyncHandler(async (req, res) => {
    validateRequired(req.body, ['name', 'serial_number']);
    const equipment = await Equipment.create(req.body);
    res.status(201).json(formatResponse(equipment, 'Equipment created successfully'));
}));

// Update equipment (manager/technician)
router.patch('/:id', authorize('manager', 'technician'), asyncHandler(async (req, res) => {
    const equipment = await Equipment.update(req.params.id, req.body);
    if (!equipment) {
        throw new AppError('Equipment not found', 404);
    }
    res.json(formatResponse(equipment, 'Equipment updated successfully'));
}));

// Scrap equipment (manager only)
router.patch('/:id/scrap', authorize('manager'), asyncHandler(async (req, res) => {
    const equipment = await Equipment.scrap(req.params.id);
    if (!equipment) {
        throw new AppError('Equipment not found', 404);
    }
    res.json(formatResponse(equipment, 'Equipment marked as scrapped'));
}));

// Delete equipment (manager only)
router.delete('/:id', authorize('manager'), asyncHandler(async (req, res) => {
    const result = await Equipment.delete(req.params.id);
    if (!result) {
        throw new AppError('Equipment not found', 404);
    }
    res.json(formatResponse(null, 'Equipment deleted successfully'));
}));

module.exports = router;
