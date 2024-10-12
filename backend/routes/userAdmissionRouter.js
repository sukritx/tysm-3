const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const userController = require('../controllers/userAdmissionController');

router.get('/:username/activity-history', userController.getActivityHistory);
router.get('/:username/commit-calendar', userController.getCommitCalendar);

module.exports = router;