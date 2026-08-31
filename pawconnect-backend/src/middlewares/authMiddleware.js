const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({
            status: 'error',
            statusCode: 401,
            message: 'Not authorized, no token provided',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretpawconnectkey12345!');
        req.user = {
            id: decoded.id,
            role: decoded.role || 'USER',
        };
        next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            statusCode: 401,
            message: 'Not authorized, token failed',
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                statusCode: 403,
                message: 'Forbidden: access denied for this user role',
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
