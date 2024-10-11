const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  // Optionally, you can include sessions here
  // sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ExamSession' }],
});

module.exports = mongoose.model('Exam', ExamSchema);
