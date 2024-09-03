const express = require("express");

const { authMiddleware } = require("../middleware/authMiddleware.js");
const { getClubs, getPeopleGoingToday, addClub, goToClub, undoGoToClub } = require("../controllers/clubController.js");

const router = express.Router();

// get clubs and goingToday for homepage
router.get("/", getClubs);
// get all people & friends going today for a club
router.get("/going/:clubId", authMiddleware, getPeopleGoingToday);

router.post("/add", authMiddleware, addClub);

router.post("/go/:clubId", authMiddleware, goToClub);

router.post("/undo-go/:clubId", authMiddleware, undoGoToClub);

module.exports = router;