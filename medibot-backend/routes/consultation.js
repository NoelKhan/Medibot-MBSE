const express = require('express');
const router = express.Router();
const ConsultationController = require('../controllers/ConsultationController');

router.get('/', ConsultationController.getAllConsultations);
router.post('/', ConsultationController.createConsultation);
router.put('/:id', ConsultationController.updateConsultation);

module.exports = router;