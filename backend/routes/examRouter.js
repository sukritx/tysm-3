const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Apply adminMiddleware to admin-only routes
router.post('/create-exam', authMiddleware, adminMiddleware, examController.createExam);
router.post('/:id/create-subject', authMiddleware, adminMiddleware, examController.createSubject);
router.post('/:examId/:subjectId/create-session', authMiddleware, adminMiddleware, examController.createSession);

// Other exam routes (no adminMiddleware)
router.get('/', examController.getAllExams);
router.get('/:id', examController.getExam);
router.get('/:id/subjects', examController.getSubjects);
router.get('/:examId/:subjectId/sessions', examController.getSessions);

module.exports = router;
