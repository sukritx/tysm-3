const express = require("express");

const { authMiddleware } = require("../middleware/authMiddleware.js");
const { notificationController } = require("../controllers/notificationController.js");

const router = express.Router();

router.get("/", authMiddleware, notificationController.getUnreadNotifications);
router.put("/:notificationId/read", authMiddleware, notificationController.markNotificationAsRead);

module.exports = router;