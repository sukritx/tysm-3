const Exam = require('../models/exam.model');
const Subject = require('../models/subject.model');
const Session = require('../models/session.model');

exports.getExams = async (req, res) => {
  try {
    const exams = await Exam.find().populate('subjects');
    res.status(200).json(exams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.createExam = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Exam name is required" });
    }

    const newExam = new Exam({ name });
    const savedExam = await newExam.save();
    
    res.status(201).json(savedExam);
  } catch (error) {
    console.error("Error creating exam:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.getExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id).populate('subjects');
    
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    
    res.status(200).json(exam);
  } catch (error) {
    console.error("Error fetching exam:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Subject name is required" });
    }

    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const newSubject = new Subject({ name, exam: id });
    const savedSubject = await newSubject.save();

    exam.subjects.push(savedSubject._id);
    await exam.save();

    res.status(201).json(savedSubject);
  } catch (error) {
    console.error("Error creating subject:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.getSubjects = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id).populate('subjects');
    
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    
    res.status(200).json(exam.subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    const { examId, subjectId } = req.params;
    const { name, date } = req.body;
    
    if (!name || !date) {
      return res.status(400).json({ message: "Session name and date are required" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const newSession = new Session({
      exam: examId,
      subject: subjectId,
      name,
      date: new Date(date)
    });
    const savedSession = await newSession.save();

    res.status(201).json(savedSession);
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const { examId, subjectId } = req.params;
    const sessions = await Session.find({ exam: examId, subject: subjectId }).sort({ date: 1 });
    
    res.status(200).json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};