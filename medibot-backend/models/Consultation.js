const mongoose = require('mongoose');

const ConsultationSchema = new mongoose.Schema({
  patientId: String,
  doctorId: String,
  notes: String,
  date: Date,
  status: String
});

module.exports = mongoose.model('Consultation', ConsultationSchema);