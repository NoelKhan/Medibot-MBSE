const express = require('express');
const router = express.Router();
const ScheduleController = require('../controllers/ScheduleController');

router.get('/', ScheduleController.getSchedule);
router.post('/', ScheduleController.updateSchedule);

module.exports = router;