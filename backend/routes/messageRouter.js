const express = require("express");

const { authMiddleware } = require("../middleware/authMiddleware.js");
const { sendMessage, getMessageSameUser, getUnreadMessageCount, getConversations, markMessagesAsRead } = require("../controllers/messageController.js");

const router = express.Router();

router.post("/:id", authMiddleware, sendMessage)
router.get("/all-messages/:id", authMiddleware, getMessageSameUser)
router.get("/unread-count", authMiddleware, getUnreadMessageCount)
router.get("/conversations", authMiddleware, getConversations)
router.put("/mark-as-read/:id", authMiddleware, markMessagesAsRead); // Add this new route

module.exports = router;