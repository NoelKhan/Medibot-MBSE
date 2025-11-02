const express = require('express');
const router = express.Router();
const RecordsController = require('../controllers/RecordsController');

router.get('/', RecordsController.getAllRecords);
router.get('/:id', RecordsController.getRecordById);

module.exports = router;