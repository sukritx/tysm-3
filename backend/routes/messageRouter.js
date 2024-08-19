const express = require("express");

const { authMiddleware } = require("../middleware/authMiddleware.js");
const { sendMessage, getMessageSameUser, getMessageAllUser } = require("../controllers/messageController.js");

const router = express.Router();

router.get("/all-messages", authMiddleware, getMessageAllUser)
router.post("/:id", authMiddleware, sendMessage)
router.get("/all-messages/:id", authMiddleware, getMessageSameUser)

module.exports = router;