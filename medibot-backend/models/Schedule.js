const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  staffId: String,
  shifts: Array,
  appointments: Array
});

module.exports = mongoose.model('Schedule', ScheduleSchema);