const express = require("express");

const { authMiddleware } = require("../middleware/authMiddleware.js");
const { postSendInvite, getInviteDetails, respondToInvite } = require("../controllers/inviteController.js");
const { optionalAuthMiddleware } = require("../middleware/optionalAuthMiddleware.js");

const router = express.Router();

// get clubs and goingToday for homepage
router.post("/send", authMiddleware, postSendInvite);
// get all people & friends going today for a club
router.get("/:inviteLink", getInviteDetails);
// post send invite to friends
router.post("/respond", optionalAuthMiddleware, respondToInvite);

module.exports = router;