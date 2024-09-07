import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const { getToken } = useAuth();
    const navigate = useNavigate();

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
            console.error('Error fetching dashboard data:', error);
          }
        };
      
        fetchDashboardData();
      
        return () => {
          isMounted = false;
        };
      }, [getToken]);

    const handleAddCoinClick = () => {
        navigate('/admin/add-coin');
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
            <div className="mt-8">
                <Button onClick={handleAddCoinClick} className="bg-[#00BAFA] hover:bg-[#0095c8]">
                    Add Coin to User
                </Button>
            </div>
        </div>
    );
};

export default AdminDashboard;