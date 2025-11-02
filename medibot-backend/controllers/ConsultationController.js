const Consultation = require('../models/Consultation');

exports.getAllConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find();
    res.json(consultations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createConsultation = async (req, res) => {
  try {
    const consultation = new Consultation(req.body);
    await consultation.save();
    res.status(201).json(consultation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(consultation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};