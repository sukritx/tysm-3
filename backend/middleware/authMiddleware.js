require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User } = require("../models/user.model");

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Please authenticate' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log('Decoded token:', decoded);

        const user = await User.findOne({ _id: decoded.userId });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.token = token;
        req.user = user;
        req.userId = user._id.toString();
        // console.log('User ID set in request:', req.userId);

        next();
    } catch (error) {
        console.error('Error in authMiddleware:', error);
        res.status(401).json({ error: 'Please authenticate' });
    }
};

const adminMiddleware = async (req, res, next) => {
    // console.log('User in adminMiddleware:', req.user);
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    next();
};

module.exports = {
    authMiddleware,
    adminMiddleware
};