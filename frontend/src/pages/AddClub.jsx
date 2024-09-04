import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

const AddClub = () => {
  const location = useLocation();
  const [clubName, setClubName] = useState('');
  const [province, setProvince] = useState(location.state?.selectedProvince || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { getToken } = useAuth();
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
    if (location.state?.selectedProvince) {
      setProvince(location.state.selectedProvince);
    }
  }, [location.state]);

  const filteredProvinces = provinces.filter(prov =>
    prov.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!clubName || !province) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const token = getToken();
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/club/add`, 
        { clubName, province },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 201) {
        navigate('/');  // Redirect to home page after successful creation
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while adding the club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-white">Add New Club</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="clubName" className="block text-sm font-medium text-gray-200">Club Name</label>
              <Input
                id="clubName"
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Enter club name"
                className="mt-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <div ref={dropdownRef}>
              <label htmlFor="province" className="block text-sm font-medium text-gray-200">Province</label>
              <div className="relative mt-1">
                <Button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="w-full justify-between bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                >
                  {province || "Select a province"}
                  {isOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                </Button>
                {isOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg">
                    <Input
                      type="text"
                      placeholder="Search provinces..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="m-2 w-[calc(100%-1rem)] bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                    />
                    <ul className="max-h-60 overflow-auto">
                      {filteredProvinces.map((prov) => (
                        <li
                          key={prov}
                          className="px-4 py-2 hover:bg-gray-600 cursor-pointer flex items-center text-gray-200"
                          onClick={() => {
                            setProvince(prov);
                            setIsOpen(false);
                            setSearchTerm("");
                          }}
                        >
                          {prov}
                          {province === prov && (
                            <Check className="ml-auto h-4 w-4 text-green-500" />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              {loading ? 'Adding...' : 'Add Club'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddClub;
