const mongoose = require('mongoose');

const RecordSchema = new mongoose.Schema({
  patientId: String,
  data: Object,
  createdAt: Date
});

module.exports = mongoose.model('Record', RecordSchema);