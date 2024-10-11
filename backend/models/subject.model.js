const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    // Optionally, you can include sessions here
    // sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ExamSession' }],
  });
  
  module.exports = mongoose.model('Subject', SubjectSchema);
  