const express = require("express");
const { 
    getDashboardData, 
    addCoinsToUser, 
    createSession, 
    createBulkSessions,
    createExam,
    createSubject,
    getUsers,
    postAsUser
} = require("../controllers/adminController");

const router = express.Router();

router.get("/dashboard", getDashboardData);
router.post("/add-coins", addCoinsToUser);
router.post("/exams/:examId/create-session", createSession);
router.post("/exams/:examId/create-bulk-sessions", createBulkSessions);
router.post("/exams", createExam);
router.post("/exams/:examId/subjects", createSubject);
router.get("/users", getUsers);
router.post("/post-as-user", postAsUser);

module.exports = router;
