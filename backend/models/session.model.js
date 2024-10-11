const mongoose = require('mongoose');

const ExamSessionSchema = new mongoose.Schema({
    exam:    { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    name:    { type: String, required: true }, // e.g., "August 2022"
    date:    { type: Date, required: true },
  });
  
  module.exports = mongoose.model('ExamSession', ExamSessionSchema);
  