const express = require("express");

const { authMiddleware } = require("../middleware/authMiddleware.js");
const { getClubs, getPeopleGoingToday, addClub } = require("../controllers/clubController.js");

const router = express.Router();

// get clubs and goingToday for homepage
router.get("/", authMiddleware, getClubs);
// get all people & friends going today for a club
router.get("/going/:clubId", authMiddleware, getPeopleGoingToday);

router.post("/add", authMiddleware, addClub);

module.exports = router;