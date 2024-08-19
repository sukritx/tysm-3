require('dotenv').config()

const authMiddleware = (req, res, next) => {
    const userId = req.cookies.userId;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: No cookie found" });
    }

    try {
        req.userId = userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Unauthorized: Invalid cookie" });
    }
};

module.exports = {
    authMiddleware
}