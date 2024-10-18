import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [sessionName, setSessionName] = useState('');
    const [bulkSessions, setBulkSessions] = useState('');
    const [newExamName, setNewExamName] = useState('');
    const [newSubjectName, setNewSubjectName] = useState('');
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const fetchExams = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v2/exams`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExams(response.data);
        } catch (error) {
            if (error.response) {
                toast.error(`Failed to fetch exams: ${error.response.data.message || 'Unknown error'}`);
            } else if (error.request) {
                toast.error('Failed to fetch exams: No response from server');
            } else {
                toast.error(`Failed to fetch exams: ${error.message}`);
            }
        }
    };

    const fetchSubjects = async (examId) => {
        try {
            const token = getToken();
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v2/exams/${examId}/subjects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubjects(response.data);
        } catch (error) {
            toast.error('Failed to fetch subjects');
        }
    };

    useEffect(() => {
        let isMounted = true;
        const fetchDashboardData = async () => {
            try {
                const token = getToken();
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/admin/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (isMounted) {
                    setDashboardData(response.data);
                }
            } catch (error) {
                toast.error('Failed to fetch dashboard data');
            }
        };

        fetchDashboardData();
        fetchExams();

        return () => {
            isMounted = false;
        };
    }, [getToken]);

    useEffect(() => {
        if (selectedExam) {
            fetchSubjects(selectedExam);
        } else {
            setSubjects([]);
        }
    }, [selectedExam, getToken]);

    const handleAddCoinClick = () => {
        navigate('/admin/add-coin');
    };

    const handleSubjectChange = (subjectId) => {
        setSelectedSubjects(prev => 
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleAddSession = async () => {
        if (!selectedExam || selectedSubjects.length === 0 || !sessionName) {
            toast.error('Please fill all fields');
            return;
        }
        try {
            const token = getToken();
            await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/admin/exams/${selectedExam}/create-session`, 
                { name: sessionName, subjects: selectedSubjects },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Session added successfully');
            setSessionName('');
            setSelectedSubjects([]);
        } catch (error) {
            toast.error('Failed to add session');
        }
    };

    const handleBulkAddSessions = async () => {
        if (!selectedExam || selectedSubjects.length === 0 || !bulkSessions) {
            toast.error('Please fill all fields');
            return;
        }
        const sessionNames = bulkSessions.split('\n').filter(name => name.trim() !== '');
        try {
            const token = getToken();
            await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/admin/exams/${selectedExam}/create-bulk-sessions`, 
                { names: sessionNames, subjects: selectedSubjects },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Sessions added successfully');
            setBulkSessions('');
            setSelectedSubjects([]);
        } catch (error) {
            toast.error('Failed to add sessions');
        }
    };

    const handleAddExam = async () => {
        if (!newExamName) {
            toast.error('Please enter an exam name');
            return;
        }
        try {
            const token = getToken();
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/exams`, 
                { name: newExamName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Exam added successfully');
            setNewExamName('');
            await fetchExams();
        } catch (error) {
            if (error.response) {
                toast.error(`Failed to add exam: ${error.response.data.message || 'Unknown error'}`);
            } else if (error.request) {
                toast.error('Failed to add exam: No response from server');
            } else {
                toast.error(`Failed to add exam: ${error.message}`);
            }
        }
    };

    const handleAddSubject = async () => {
        if (!selectedExam || !newSubjectName) {
            toast.error('Please select an exam and enter a subject name');
            return;
        }
        try {
            const token = getToken();
            await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/admin/exams/${selectedExam}/subjects`, 
                { name: newSubjectName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Subject added successfully');
            setNewSubjectName('');
            await fetchSubjects(selectedExam);
        } catch (error) {
            toast.error('Failed to add subject');
        }
    };

    if (!dashboardData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-white">Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-[#00BAFA]">Coins Sold Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-white">{dashboardData.coinSoldToday}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-[#00BAFA]">VIP Purchases Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-white">{dashboardData.vipPurchasesCount}</p>
                    </CardContent>
                </Card>
            </div>
            <Card className="mt-8 bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-[#00BAFA]">Daily Coin Sales (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dashboardData.dailyCoinSales}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="_id" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                                    labelStyle={{ color: '#9CA3AF' }}
                                />
                                <Line type="monotone" dataKey="totalCoins" stroke="#00BAFA" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
            <Card className="mt-8 bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-[#00BAFA]">Add Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Select onValueChange={setSelectedExam}>
                            <SelectTrigger className="text-white">
                                <SelectValue placeholder="Select Exam" />
                            </SelectTrigger>
                            <SelectContent>
                                {exams.map(exam => (
                                    <SelectItem key={exam._id} value={exam._id}>{exam.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        {selectedExam && (
                            <div className="space-y-2">
                                <p className="text-white">Select Subjects:</p>
                                {subjects.map(subject => (
                                    <div key={subject._id} className="flex items-center">
                                        <Checkbox 
                                            id={subject._id} 
                                            checked={selectedSubjects.includes(subject._id)}
                                            onCheckedChange={() => handleSubjectChange(subject._id)}
                                            className="border-white text-white focus:ring-white"
                                        />
                                        <label htmlFor={subject._id} className="ml-2 text-white">
                                            {subject.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <Input
                            placeholder="Session Name"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            className="text-white placeholder-gray-400"
                        />
                        
                        <Button onClick={handleAddSession} className="bg-[#00BAFA] hover:bg-[#0095c8]">
                            Add Single Session
                        </Button>
                        
                        <Textarea
                            placeholder="Enter multiple session names (one per line)"
                            value={bulkSessions}
                            onChange={(e) => setBulkSessions(e.target.value)}
                            className="text-white placeholder-gray-400"
                        />
                        
                        <Button onClick={handleBulkAddSessions} className="bg-[#00BAFA] hover:bg-[#0095c8]">
                            Add Bulk Sessions
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <Card className="mt-8 bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-[#00BAFA]">Add Exam</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Input
                            placeholder="Exam Name"
                            value={newExamName}
                            onChange={(e) => setNewExamName(e.target.value)}
                            className="text-white placeholder-gray-400"
                        />
                        <Button onClick={handleAddExam} className="bg-[#00BAFA] hover:bg-[#0095c8]">
                            Add Exam
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <Card className="mt-8 bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-[#00BAFA]">Add Subject</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Select onValueChange={setSelectedExam}>
                            <SelectTrigger className="text-white">
                                <SelectValue placeholder="Select Exam" />
                            </SelectTrigger>
                            <SelectContent>
                                {exams.map(exam => (
                                    <SelectItem key={exam._id} value={exam._id}>{exam.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="Subject Name"
                            value={newSubjectName}
                            onChange={(e) => setNewSubjectName(e.target.value)}
                            className="text-white placeholder-gray-400"
                        />
                        <Button onClick={handleAddSubject} className="bg-[#00BAFA] hover:bg-[#0095c8]">
                            Add Subject
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <div className="mt-8">
                <Button onClick={handleAddCoinClick} className="bg-[#00BAFA] hover:bg-[#0095c8]">
                    Add Coin to User
                </Button>
            </div>
        </div>
    );
};

export default AdminDashboard;
