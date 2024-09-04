const express = require("express");

const { authMiddleware } = require("../middleware/authMiddleware.js");
const { notificationController } = require("../controllers/notificationController.js");

const router = express.Router();

// get unread notifications
router.get("/unread", authMiddleware, notificationController.getUnreadNotifications);

// get all notifications
router.get("/", authMiddleware, notificationController.getAllNotifications);

router.put("/:notificationId/read", authMiddleware, notificationController.markNotificationAsRead);

module.exports = router;