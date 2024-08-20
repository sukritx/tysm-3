const express = require("express");

const { authMiddleware } = require("../middleware/authMiddleware.js");
const { getClubs, getPeopleGoingToday } = require("../controllers/clubController.js");

const router = express.Router();

// get clubs and goingToday for homepage
router.get("/clubs/:province", authMiddleware, getClubs)
// get all people & friends going today for a club
router.get("/club/:clubId", authMiddleware, getPeopleGoingToday)

module.exports = router;