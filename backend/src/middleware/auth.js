const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET;

// Verify JWT token
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: { message: 'No token provided' } });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: { message: 'User not found' } });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: { message: 'Invalid token' } });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: { message: 'Token expired' } });
        }
        next(error);
    }
};

// Role-based authorization
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: { message: 'Not authenticated' } });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: { message: 'Insufficient permissions' }
            });
        }

        next();
    };
};

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

module.exports = {
    authenticate,
    authorize,
    generateToken
};
