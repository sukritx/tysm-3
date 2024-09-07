import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Crown, Plus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Sales = () => {
  const { user, getToken, updateUser } = useAuth();

  const buyVIP = async () => {
    try {
      const token = getToken();
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/sale/buy-vip`, 
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

  const addLine = () => {
    window.open('https://lin.ee/5Xyg8Yl', '_blank');
    toast.success('Redirecting to add LINE friend...');
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
              onClick={addLine} 
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
            <p className="text-gray-300 mb-4">Your current balance: {user?.coinBalance || 0} coins</p>
            <Button 
              onClick={buyVIP} 
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
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