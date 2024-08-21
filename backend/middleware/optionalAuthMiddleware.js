require('dotenv').config();
const jwt = require('jsonwebtoken');

const optionalAuthMiddleware = (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.userId;
        } catch (err) {
            // If there's an error processing the token, we'll just not set req.userId
            console.error('Error processing auth token:', err);
        }
    }

    // Always call next(), whether or not we found and processed a valid token
    next();
};

module.exports = {
    optionalAuthMiddleware
};