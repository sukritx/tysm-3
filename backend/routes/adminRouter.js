const express = require("express");
const { getDashboardData, addCoinsToUser, createSession, createBulkSessions } = require("../controllers/adminController");

const router = express.Router();

router.get("/dashboard", getDashboardData);
router.post("/add-coins", addCoinsToUser);
router.post("/exams/:examId/create-session", createSession);
router.post("/exams/:examId/create-bulk-sessions", createBulkSessions);

module.exports = router;
