import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Crown, Plus, Eye, Ghost, Users, Badge } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import ReactGA from 'react-ga4';

const Sales = () => {
  const { user, getToken, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Track page view
    ReactGA.send({ hitType: "pageview", page: "/sales" });
  }, []);

  const buyVIP = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/sale/buy-vip`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser(response.data.user);
      toast.success('Successfully purchased VIP status!');
      ReactGA.event({
        category: 'Sales',
        action: 'Buy VIP',
        label: 'Success'
      });
    } catch (error) {
      console.error('Error buying VIP:', error);
      toast.error(error.response?.data?.message || 'Failed to purchase VIP status');
      ReactGA.event({
        category: 'Sales',
        action: 'Buy VIP',
        label: 'Error',
        value: error.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  const addLine = () => {
    window.open('https://lin.ee/5Xyg8Yl', '_blank');
    toast.success('Redirecting to add LINE friend...');
    ReactGA.event({
      category: 'Sales',
      action: 'Add LINE',
      label: 'Redirect'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-white">Buy Coins and VIP</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-[#00BAFA]">
              <Coins className="mr-2" />
              Buy Coins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">Your current balance: {user?.coinBalance || 0} coins</p>
            <div className="space-y-2 text-gray-300">
              <p>10 Coins - 10฿</p>
              <p>50 Coins - 50฿</p>
              <p>100 Coins - 100฿</p>
            </div>
            <Button 
              onClick={() => {
                addLine();
                ReactGA.event({
                  category: 'Sales',
                  action: 'Click Buy Coins',
                  label: 'LINE'
                });
              }} 
              className="w-full mt-4 bg-green-500 hover:bg-green-600 flex items-center justify-center"
            >
              <Plus className="mr-2" /> แอดไลน์เติมเหรียญ
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-[#00BAFA]">
              <Crown className="mr-2" />
              Buy VIP Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">VIP Status: 99 coins/month</p>
            <ul className="text-gray-300 mb-4 space-y-2">
              <li className="flex items-center"><Eye className="mr-2" /> See who viewed your profile</li>
              <li className="flex items-center"><Ghost className="mr-2" /> Browse profiles invisibly</li>
              <li className="flex items-center"><Users className="mr-2" /> See who's going to which club</li>
              <li className="flex items-center"><Badge className="mr-2" /> Exclusive VIP badge</li>
            </ul>
            <Button 
              onClick={() => {
                buyVIP();
                ReactGA.event({
                  category: 'Sales',
                  action: 'Click Buy VIP',
                  label: user?.coinBalance >= 99 ? 'Sufficient Coins' : 'Insufficient Coins'
                });
              }} 
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
              disabled={user?.coinBalance < 99 || loading}
            >
              {loading ? 'Processing...' : 'Buy VIP Status (99 coins)'}
            </Button>
            {user?.coinBalance < 99 && (
              <p className="text-red-500 mt-2">Insufficient coins. Please buy more coins.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Sales;