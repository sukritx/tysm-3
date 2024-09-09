require('dotenv').config();
const jwt = require('jsonwebtoken');

const optionalAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.userId;
            // console.log('User authenticated:', req.userId);
        } catch (err) {
            // console.error('Error processing auth token:', err.message);
            // Don't set req.userId if there's an error
        }
    } else {
        // console.log('No authentication token found');
    }

    next();
};

module.exports = {
    optionalAuthMiddleware
};