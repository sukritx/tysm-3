import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from 'lucide-react';

const Home = () => {
  const [selectedProvince, setSelectedProvince] = useState("");
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // List of all 77 provinces in Thailand
  const provinces = [
    "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา",
    // ... (rest of the provinces)
  ];

  useEffect(() => {
    if (selectedProvince) {
      fetchClubs(selectedProvince);
    }
  }, [selectedProvince]);

  const fetchClubs = async (province) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/club`, {
        params: { province: province }
      });
      setClubs(Array.isArray(response.data) ? response.data : [response.data]);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลคลับ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <h1 className="text-4xl text-center font-bold mb-6 text-[#00BAFA]">🪩 วันนี้ไปร้านไหนกัน?</h1>
        
        <div className="mb-8">
          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
            <SelectTrigger className="w-full max-w-md mx-auto bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="เลือกจังหวัด" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectGroup>
                <SelectLabel className="text-gray-400">จังหวัดในประเทศไทย</SelectLabel>
                {provinces.map((province) => (
                  <SelectItem key={province} value={province} className="hover:bg-gray-700">
                    {province}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {loading && <p className="text-white text-center">กำลังโหลด...</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {clubs.length > 0 ? (
            clubs.map((club) => (
              <Card key={club._id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                <CardContent className="flex flex-col items-start justify-between h-full p-4 relative">
                  <div>
                    <h3 className="text-lg font-semibold text-[#00BAFA]">{club.clubName}</h3>
                    <p className="text-sm text-gray-300">จำนวนคนวันนี้: {club.todayCount}</p>
                  </div>
                  <Link
                    to={`/club/${club._id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#00BAFA] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BAFA] mt-4"
                  >
                    ดูรายละเอียด
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                  {!user && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            !loading && <p className="text-white text-center col-span-full">ไม่พบข้อมูลคลับ</p>
          )}
        </div>
      </div>
    </div>
  );
};

function ArrowRightIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

export default Home;