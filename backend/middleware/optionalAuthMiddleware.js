require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User } = require('../models/user.model');

const optionalAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            if (user) {
                req.user = user;
                req.userId = user._id;
            }
        } catch (err) {
            console.error('Error processing auth token:', err.message);
            // Don't set req.user if there's an error
        }
    }

    next();
};

module.exports = {
    optionalAuthMiddleware
};