const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    
    // Save error to file for debugging
    try {
        const fs = require('fs');
        fs.writeFileSync('global_error_debug.json', JSON.stringify({
            message: err.message,
            stack: err.stack,
            errors: err.errors,
            name: err.name,
            code: err.code
        }, null, 2));
    } catch (e) {}

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message: err.message || 'Internal Server Error',
        errors: err.errors || null,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = errorMiddleware;
