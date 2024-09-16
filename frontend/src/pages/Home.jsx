import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactGA from 'react-ga4';

import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ChevronDown, ChevronUp, Check, Search, PlusCircle } from 'lucide-react';

const Home = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const dropdownRef = useRef(null);
  const [clubSearchTerm, setClubSearchTerm] = useState("");
  const [filteredClubs, setFilteredClubs] = useState([]);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (clubs.length > 0) {
      const filtered = clubs.filter(club =>
        club.clubName.toLowerCase().includes(clubSearchTerm.toLowerCase())
      );
      setFilteredClubs(filtered);
    }
  }, [clubSearchTerm, clubs]);

  useEffect(() => {
    // Track homepage view
    ReactGA.send({ hitType: "pageview", page: "/home" });
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

  const handleAddClub = () => {
    ReactGA.event({
      category: 'User Interaction',
      action: 'Clicked Add Club',
      label: selectedProvince
    });
    navigate('/add-club', { state: { selectedProvince } });
  };

  const handleClubSearch = (term) => {
    setClubSearchTerm(term);
    // Only track if the search term is not empty
    if (term.trim()) {
      ReactGA.event({
        category: 'User Interaction',
        action: 'Club Search',
        label: term
      });
    }
  };

  const handleViewClubDetails = (clubId, clubName) => {
    ReactGA.event({
      category: 'User Interaction',
      action: 'View Club Details',
      label: clubName
    });
    navigate(`/club/${clubId}`);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <h1 className="text-4xl text-center font-bold mb-6 text-[#00BAFA]">วันนี้ไปร้านไหนกัน?</h1>
        
        <div className="max-w-md mx-auto mb-8" ref={dropdownRef}>
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
                        ReactGA.event({
                          category: 'User Interaction',
                          action: 'Selected Province',
                          label: province
                        });
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

        {selectedProvince && (
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Input
                type="text"
                placeholder="ค้นหาคลับ..."
                value={clubSearchTerm}
                onChange={(e) => handleClubSearch(e.target.value)}
                className="w-full bg-gray-800 border-gray-700 text-white pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        )}

        {loading && <p className="text-white text-center">กำลังโหลด...</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {selectedProvince ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredClubs.length > 0 ? (
              filteredClubs.map((club) => (
                <Card key={club._id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                  <CardContent className="flex flex-col items-start justify-between h-full p-4 relative">
                    <div>
                      <h3 className="text-lg font-semibold text-[#00BAFA]">{club.clubName}</h3>
                      <p className="text-sm text-gray-300">จำนวนคนวันนี้: {club.todayCount}</p>
                    </div>
                    <button
                      onClick={() => handleViewClubDetails(club._id, club.clubName)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-[#00BAFA] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BAFA] mt-4"
                    >
                      ดูรายละเอียด
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                    {!user && (
                      <div className="absolute top-2 right-2">
                        <Lock className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              !loading && (
                <div className="col-span-full text-center">
                  <p className="text-white mb-4">ไม่พบข้อมูลคลับ</p>
                  <Button 
                    onClick={handleAddClub}
                    className="bg-[#00BAFA] hover:bg-[#0095c8] text-white"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    เพิ่มคลับใหม่
                  </Button>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-white text-center">กรุณาเลือกจังหวัดเพื่อดูรายชื่อคลับ</p>
        )}
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