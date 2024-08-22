import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

const Home = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  // List of all 77 provinces in Thailand
  const provinces = [
    "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา",
    "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก",
    "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน",
    "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา",
    "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต",
    "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี",
    "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ",
    "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี",
    "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
  ];

  useEffect(() => {
    if (selectedProvince) {
      fetchClubs(selectedProvince);
    }
  }, [selectedProvince]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const filteredProvinces = provinces.filter(province =>
    province.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 bg-gray-900 min-h-screen">
      <h1 className="text-4xl text-center font-bold mb-6 text-[#00BAFA]">🪩 วันนี้ไปร้านไหนกัน?</h1>
      
      <div className="max-w-md mx-auto mb-6" ref={dropdownRef}>
        <div className="relative">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          >
            {selectedProvince || "เลือกจังหวัด"}
            {isOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
              <Input
                type="text"
                placeholder="ค้นหาจังหวัด..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="m-2 w-[calc(100%-1rem)] bg-gray-700 text-white"
              />
              <ul className="max-h-60 overflow-auto">
                {filteredProvinces.map((province) => (
                  <li
                    key={province}
                    className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center"
                    onClick={() => {
                      setSelectedProvince(province);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    {province}
                    {selectedProvince === province && (
                      <Check className="ml-auto h-4 w-4 text-[#00BAFA]" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {loading && <p className="text-white text-center">กำลังโหลด...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clubs.length > 0 ? (
          clubs.map((club) => (
            <Card key={club.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
              <CardHeader>
                <CardTitle className="text-[#00BAFA]">{club.clubName}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">จำนวนคนวันนี้: {club.todayCount}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          !loading && <p className="text-white text-center col-span-full">ไม่พบข้อมูลคลับ</p>
        )}
      </div>
    </div>
  );
};

export default Home;