const express = require('express');
const router = express.Router();
const examController = require('../../../controllers/api/v2/examController');

router.get('/', examController.getExams);
router.post('/', examController.createExam);
router.get('/:id', examController.getExam);
router.post('/:id/subjects', examController.createSubject);
router.get('/:id/subjects', examController.getSubjects);
router.post('/:examId/subjects/:subjectId/sessions', examController.createSession);
router.get('/:examId/subjects/:subjectId/sessions', examController.getSessions);

module.exports = router;