require('dotenv').config();

const optionalAuthMiddleware = (req, res, next) => {
    const userId = req.cookies.userId;

    if (userId) {
        try {
            req.userId = userId;
        } catch (err) {
            // If there's an error processing the cookie, we'll just not set req.userId
            console.error('Error processing auth cookie:', err);
        }
    }

    // Always call next(), whether or not we found and processed a valid cookie
    next();
};

module.exports = {
    optionalAuthMiddleware
};