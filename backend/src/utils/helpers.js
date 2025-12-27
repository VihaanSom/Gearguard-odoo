// Async handler wrapper to avoid try-catch in every controller
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Create custom error with status code
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Validate required fields
const validateRequired = (obj, fields) => {
    const missing = fields.filter(field => !obj[field]);
    if (missing.length > 0) {
        throw new AppError(`Missing required fields: ${missing.join(', ')}`, 400);
    }
};

// Paginate results
const paginate = (query, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    return {
        ...query,
        limit,
        offset
    };
};

// Format response
const formatResponse = (data, message = 'Success') => ({
    success: true,
    message,
    data
});

module.exports = {
    asyncHandler,
    AppError,
    validateRequired,
    paginate,
    formatResponse
};
