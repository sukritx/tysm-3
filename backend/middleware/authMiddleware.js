require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User } = require("../models/user.model");

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token found" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized: User not found" });
        }
        req.userId = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
};

const adminMiddleware = async (req, res, next) => {
    if (!req.userId || !req.userId.isAdmin) {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    next();
};

module.exports = {
    authMiddleware,
    adminMiddleware
};