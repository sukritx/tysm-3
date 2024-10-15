import { useState, useEffect, useRef, useCallback } from 'react';
import { Pen, Image, Send, X, RefreshCw, Filter } from 'lucide-react';
import axios from 'axios';

const SecondaryNavbar = ({ onPost, onFilter, isAuthenticated }) => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedExam, setSelectedExam] = useState(() => localStorage.getItem('selectedExam') || '');
  const [selectedSubject, setSelectedSubject] = useState(() => localStorage.getItem('selectedSubject') || '');
  const [selectedSession, setSelectedSession] = useState(() => localStorage.getItem('selectedSession') || '');
  const [selectedExamName, setSelectedExamName] = useState(() => localStorage.getItem('selectedExamName') || '');
  const [selectedSubjectName, setSelectedSubjectName] = useState(() => localStorage.getItem('selectedSubjectName') || '');
  const [selectedSessionName, setSelectedSessionName] = useState(() => localStorage.getItem('selectedSessionName') || '');
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState(null);
  const fileInputRef = useRef(null);
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('sortBy') || 'recent');
  const [showFilterBox, setShowFilterBox] = useState(false);
  const [showPostBox, setShowPostBox] = useState(false);
  const [postExam, setPostExam] = useState('');
  const [postSubject, setPostSubject] = useState('');
  const [postSession, setPostSession] = useState('');

  const fetchExams = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v2/exams`);
      setExams(response.data);
      console.log('Fetched exams:', response.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  }, []);

  const fetchSubjects = useCallback(async (examId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v2/exams/${examId}/subjects`);
      setSubjects(response.data);
      console.log('Fetched subjects:', response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    }
  }, []);

  const fetchSessions = useCallback(async (examId, subjectId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v2/exams/${examId}/${subjectId}/sessions`);
      setSessions(response.data);
      console.log('Fetched sessions:', response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    if (selectedExam) {
      fetchSubjects(selectedExam);
    } else {
      setSubjects([]);
      setSelectedSubject('');
      setSelectedSubjectName('');
    }
  }, [selectedExam, fetchSubjects]);

  useEffect(() => {
    if (selectedExam && selectedSubject) {
      fetchSessions(selectedExam, selectedSubject);
    } else {
      setSessions([]);
      setSelectedSession('');
      setSelectedSessionName('');
    }
  }, [selectedExam, selectedSubject, fetchSessions]);

  useEffect(() => {
    console.log('Current state:', { selectedExam, selectedSubject, selectedSession });
  }, [selectedExam, selectedSubject, selectedSession]);

  const handleFilterExamChange = (e) => {
    const examId = e.target.value;
    const examName = exams.find(exam => exam._id === examId)?.name || '';
    setSelectedExam(examId);
    setSelectedExamName(examName);
    setSelectedSubject('');
    setSelectedSubjectName('');
    setSelectedSession('');
    setSelectedSessionName('');
    localStorage.setItem('selectedExam', examId);
    localStorage.setItem('selectedExamName', examName);
    localStorage.removeItem('selectedSubject');
    localStorage.removeItem('selectedSubjectName');
    localStorage.removeItem('selectedSession');
    localStorage.removeItem('selectedSessionName');
    if (examId) {
      onFilter({ exam: examId });
    } else {
      onFilter({});
    }
  };

  const handlePostExamChange = (e) => {
    const examId = e.target.value;
    setPostExam(examId);
    setPostSubject('');
    setPostSession('');
    if (examId) {
      fetchSubjects(examId);
    } else {
      setSubjects([]);
    }
  };

  const handlePostSubjectChange = (e) => {
    const subjectId = e.target.value;
    setPostSubject(subjectId);
    setPostSession('');
    if (subjectId) {
      fetchSessions(postExam, subjectId);
    } else {
      setSessions([]);
    }
  };

  const handlePostSessionChange = (e) => {
    const sessionId = e.target.value;
    setPostSession(sessionId);
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    const subjectName = subjects.find(subject => subject._id === subjectId)?.name || '';
    setSelectedSubject(subjectId);
    setSelectedSubjectName(subjectName);
    setSelectedSession('');
    setSelectedSessionName('');
    localStorage.setItem('selectedSubject', subjectId);
    localStorage.setItem('selectedSubjectName', subjectName);
    localStorage.removeItem('selectedSession');
    localStorage.removeItem('selectedSessionName');
    if (subjectId) {
      onFilter({ exam: selectedExam, subject: subjectId });
    } else {
      onFilter({ exam: selectedExam });
    }
  };

  const handleSessionChange = (e) => {
    const sessionId = e.target.value;
    const sessionName = sessions.find(session => session._id === sessionId)?.name || '';
    setSelectedSession(sessionId);
    setSelectedSessionName(sessionName);
    localStorage.setItem('selectedSession', sessionId);
    localStorage.setItem('selectedSessionName', sessionName);
    onFilter({ exam: selectedExam, subject: selectedSubject, session: sessionId });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setPostImage(file);
  };

  const handlePost = () => {
    if (postContent.trim() || postImage) {
      onPost({
        content: postContent, // This will be mapped to 'heading' in handleCreatePost
        image: postImage,
        exam: postExam,
        subject: postSubject,
        session: postSession
      });
      setPostContent('');
      setPostImage(null);
      setShowPostBox(false);
      setPostExam('');
      setPostSubject('');
      setPostSession('');
    }
  };

  const handleSortChange = (e) => {
    const newSortBy = e.target.value;
    setSortBy(newSortBy);
    localStorage.setItem('sortBy', newSortBy);
    onFilter({ 
      exam: selectedExam, 
      subject: selectedSubject, 
      session: selectedSession, 
      sortBy: newSortBy 
    });
  };

  const clearFilters = () => {
    setSelectedExam('');
    setSelectedExamName('');
    setSelectedSubject('');
    setSelectedSubjectName('');
    setSelectedSession('');
    setSelectedSessionName('');
    setSortBy('recent');
    localStorage.removeItem('selectedExam');
    localStorage.removeItem('selectedExamName');
    localStorage.removeItem('selectedSubject');
    localStorage.removeItem('selectedSubjectName');
    localStorage.removeItem('selectedSession');
    localStorage.removeItem('selectedSessionName');
    localStorage.removeItem('sortBy');
    onFilter({});
  };

  const handleFilterClick = () => {
    setShowFilterBox(!showFilterBox);
    setShowPostBox(false);
  };

  const handlePostClick = () => {
    setShowPostBox(!showPostBox);
    setShowFilterBox(false);
  };

  return (
    <div className="bg-gray-100 shadow-md rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={handleFilterClick}
          className="flex items-center justify-center bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Filter className="w-5 h-5 mr-2" />
          <span>Filter Posts</span>
        </button>
        {isAuthenticated && (
          <button 
            onClick={handlePostClick}
            className="flex items-center justify-center bg-green-500 text-white rounded-md px-4 py-2 hover:bg-green-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <Pen className="w-5 h-5 mr-2" />
            <span>Create Post</span>
          </button>
        )}
      </div>

      {showFilterBox && (
        <div className="mb-4 bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Filter Posts</h3>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedExam}
              onChange={handleFilterExamChange}
              className="bg-white text-gray-700 rounded-md px-3 py-2 w-full sm:w-auto border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{selectedExamName || "Select Exam"}</option>
              {exams.filter(exam => exam._id !== selectedExam).map(exam => (
                <option key={exam._id} value={exam._id}>{exam.name}</option>
              ))}
            </select>
            {selectedExam && (
              <select
                value={selectedSubject}
                onChange={handleSubjectChange}
                className="bg-white text-gray-700 rounded-md px-3 py-2 w-full sm:w-auto border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{selectedSubjectName || "All Subjects"}</option>
                {subjects.filter(subject => subject._id !== selectedSubject).map(subject => (
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
                <option value="">{selectedSessionName || "All Sessions"}</option>
                {sessions.filter(session => session._id !== selectedSession).map(session => (
                  <option key={session._id} value={session._id}>{session.name}</option>
                ))}
              </select>
            )}
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="bg-white text-gray-700 rounded-md px-3 py-2 w-full sm:w-auto border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="upvotes">Most Upvotes</option>
            </select>
            {(selectedExam || selectedSubject || selectedSession || sortBy !== 'recent') && (
              <button
                onClick={clearFilters}
                className="bg-gray-200 text-gray-700 rounded-md px-3 py-2 hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-5 h-5" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {showPostBox && (
        <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Create a Post</h3>
            <button 
              onClick={() => setShowPostBox(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <select
            value={postExam}
            onChange={handlePostExamChange}
            className="w-full mb-2 p-2 rounded-md bg-gray-50 text-gray-700 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Exam</option>
            {exams.map(exam => (
              <option key={exam._id} value={exam._id}>{exam.name}</option>
            ))}
          </select>
          {postExam && (
            <select
              value={postSubject}
              onChange={handlePostSubjectChange}
              className="w-full mb-2 p-2 rounded-md bg-gray-50 text-gray-700 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Subject (Optional)</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>{subject.name}</option>
              ))}
            </select>
          )}
          {postSubject && (
            <select
              value={postSession}
              onChange={handlePostSessionChange}
              className="w-full mb-2 p-2 rounded-md bg-gray-50 text-gray-700 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Session (Optional)</option>
              {sessions.map(session => (
                <option key={session._id} value={session._id}>{session.name}</option>
              ))}
            </select>
          )}
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
              className="flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors duration-200 px-3 py-1 border border-blue-500 rounded-md"
            >
              <Image className="w-5 h-5 mr-2" />
              <span>Add Image</span>
            </button>
            <button
              onClick={handlePost}
              className="flex items-center justify-center bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Send className="w-5 h-5 mr-2" />
              <span>Post</span>
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