const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { generateToken } = require('../middleware/auth');
const { asyncHandler, validateRequired, formatResponse, AppError } = require('../utils/helpers');

// Register
router.post('/register', asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    validateRequired(req.body, ['name', 'email', 'password']);

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
        throw new AppError('Email already registered', 400);
    }

    const user = await User.create({ name, email, password, role });
    const token = generateToken(user.id);

    res.status(201).json(formatResponse({ user, token }, 'User registered successfully'));
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    validateRequired(req.body, ['email', 'password']);

    const user = await User.findByEmail(email);
    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    const isValid = await User.validatePassword(password, user.passwordHash);

    if (!isValid) {
        throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken(user.id);

    // Remove password from response
    delete user.passwordHash;

    res.json(formatResponse({ user, token }, 'Login successful'));
}));

// Get current user
router.get('/me', require('../middleware/auth').authenticate, asyncHandler(async (req, res) => {
    res.json(formatResponse(req.user));
}));

module.exports = router;
