import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Crown } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Sales = () => {
  const { user, getToken, updateUser } = useAuth();

  const buyCoins = async (amount) => {
    try {
      const token = getToken();
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/buy-coins`, 
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser(response.data.user);
      toast.success(`Successfully purchased ${amount} coin${amount > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error('Error buying coins:', error);
      toast.error(error.response?.data?.message || 'Failed to purchase coins');
    }
  };

  const buyVIP = async () => {
    try {
      const token = getToken();
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/buy-vip`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser(response.data.user);
      toast.success('Successfully purchased VIP status!');
    } catch (error) {
      console.error('Error buying VIP:', error);
      toast.error(error.response?.data?.message || 'Failed to purchase VIP status');
    }
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
            <div className="space-y-2">
              <Button onClick={() => buyCoins(10)} className="w-full bg-[#00BAFA] hover:bg-[#0095c8]">
                Buy 10 Coins (10฿)
              </Button>
              <Button onClick={() => buyCoins(50)} className="w-full bg-[#00BAFA] hover:bg-[#0095c8]">
                Buy 50 Coins (50฿)
              </Button>
              <Button onClick={() => buyCoins(100)} className="w-full bg-[#00BAFA] hover:bg-[#0095c8]">
                Buy 100 Coins (100฿)
              </Button>
            </div>
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
            <p className="text-gray-300 mb-4">Your current balance: {user?.coinBalance || 0} coins</p>
            <Button 
              onClick={buyVIP} 
              className="w-full bg-[#00BAFA] hover:bg-[#0095c8]"
              disabled={user?.coinBalance < 99}
            >
              Buy VIP Status (99 coins)
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