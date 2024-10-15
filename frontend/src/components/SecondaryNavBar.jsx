import { useState, useEffect, useRef } from 'react';
import { Pen, Image, Send, X } from 'lucide-react';
import axios from 'axios';

const SecondaryNavbar = ({ onPost }) => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [showPostBox, setShowPostBox] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v2/exams`);
      setExams(response.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchSubjects = async (examId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v2/exams/${examId}/subjects`);
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchSessions = async (examId, subjectId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v2/exams/${examId}/${subjectId}/sessions`);
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleExamChange = (e) => {
    const examId = e.target.value;
    setSelectedExam(examId);
    setSelectedSubject('');
    setSelectedSession('');
    setSessions([]);
    if (examId) {
      fetchSubjects(examId);
    } else {
      setSubjects([]);
    }
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
    setSelectedSession('');
    if (subjectId) {
      fetchSessions(selectedExam, subjectId);
    } else {
      setSessions([]);
    }
  };

  const handleSessionChange = (e) => {
    const sessionId = e.target.value;
    setSelectedSession(sessionId);
  };

  const handlePostClick = () => {
    setShowPostBox(!showPostBox);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setPostImage(file);
  };

  const handlePost = () => {
    if (postContent.trim() || postImage) {
      onPost({
        content: postContent,
        image: postImage,
        exam: selectedExam,
        subject: selectedSubject,
        session: selectedSession
      });
      setPostContent('');
      setPostImage(null);
      setShowPostBox(false);
    }
  };

  return (
    <div className="bg-gray-100 shadow-md rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 flex-grow">
          <select
            value={selectedExam}
            onChange={handleExamChange}
            className="bg-white text-gray-700 rounded-md px-3 py-2 w-full sm:w-auto border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Exam</option>
            {exams.map(exam => (
              <option key={exam._id} value={exam._id}>{exam.name}</option>
            ))}
          </select>
          {selectedExam && (
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="bg-white text-gray-700 rounded-md px-3 py-2 w-full sm:w-auto border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>{subject.name}</option>
              ))}
            </select>
          )}
          {selectedSubject && (
            <select
              value={selectedSession}
              onChange={handleSessionChange}
              className="bg-white text-gray-700 rounded-md px-3 py-2 w-full sm:w-auto border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Session</option>
              {sessions.map(session => (
                <option key={session._id} value={session._id}>{session.name}</option>
              ))}
            </select>
          )}
        </div>
        <button 
          onClick={handlePostClick} 
          className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Pen className="w-5 h-5" />
        </button>
      </div>
      {showPostBox && (
        <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Create a Post</h3>
            <button 
              onClick={() => setShowPostBox(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-2 rounded-md bg-gray-50 text-gray-700 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
          <div className="flex justify-between items-center mt-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
            >
              <Image className="w-5 h-5" />
            </button>
            <button
              onClick={handlePost}
              className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {postImage && (
            <div className="mt-2 text-sm text-gray-600">
              Image selected: {postImage.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SecondaryNavbar;
