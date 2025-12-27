const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, formatResponse, AppError } = require('../utils/helpers');

// Apply auth to all routes
router.use(authenticate);

// Get all users (manager only)
router.get('/', authorize('manager'), asyncHandler(async (req, res) => {
    const users = await User.findAll();
    res.json(formatResponse(users));
}));

// Get users by role
router.get('/role/:role', authorize('manager'), asyncHandler(async (req, res) => {
    const { role } = req.params;
    if (!['user', 'technician', 'manager'].includes(role)) {
        throw new AppError('Invalid role', 400);
    }
    const users = await User.findByRole(role);
    res.json(formatResponse(users));
}));

// Get technicians
router.get('/technicians', asyncHandler(async (req, res) => {
    const technicians = await User.findByRole('technician');
    res.json(formatResponse(technicians));
}));

// Get user by ID
router.get('/:id', asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    res.json(formatResponse(user));
}));

// Update user (self or manager)
router.patch('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Only allow users to update themselves, unless they're a manager
    if (req.user.id !== parseInt(id) && req.user.role !== 'manager') {
        throw new AppError('Not authorized to update this user', 403);
    }

    const user = await User.update(id, req.body);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    res.json(formatResponse(user, 'User updated successfully'));
}));

// Delete user (manager only)
router.delete('/:id', authorize('manager'), asyncHandler(async (req, res) => {
    const result = await User.delete(req.params.id);
    if (!result) {
        throw new AppError('User not found', 404);
    }
    res.json(formatResponse(null, 'User deleted successfully'));
}));

module.exports = router;
