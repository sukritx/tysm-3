import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddCoin = () => {
    const [username, setUsername] = useState('');
    const [coinAmount, setCoinAmount] = useState('');
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const handleAddCoins = async () => {
        try {
            const token = getToken();
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/add-coins`,
                { username, amount: parseInt(coinAmount) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Successfully added ${coinAmount} coins to ${username}`);
            navigate('/admin/dashboard');
        } catch (error) {
            console.error('Error adding coins:', error);
            toast.error(error.response?.data?.message || 'Failed to add coins');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-[#00BAFA]">Add Coins to User</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-4">
                        <Input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="text-white placeholder-gray-400 bg-gray-700"
                        />
                        <Input
                            type="number"
                            placeholder="Coin Amount"
                            value={coinAmount}
                            onChange={(e) => setCoinAmount(e.target.value)}
                            className="text-white placeholder-gray-400 bg-gray-700"
                        />
                        <Button onClick={handleAddCoins} className="bg-[#00BAFA] hover:bg-[#0095c8]">
                            Add Coins
                        </Button>
                        <Button onClick={() => navigate('/admin/dashboard')} variant="outline">
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AddCoin;