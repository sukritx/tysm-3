const express = require('express');
const router = express.Router();
const userController = require('../controllers/userAdmissionController');

router.get('/:id', userController.getUser);
router.put('/:id', userController.updateUser);
router.get('/:id/activity-history', userController.getActivityHistory);
router.get('/:id/commit-calendar', userController.getCommitCalendar);

module.exports = router;