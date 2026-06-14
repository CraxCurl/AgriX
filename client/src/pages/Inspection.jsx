import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClipboardList, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BrandLogo } from '../components/BrandLogo';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://agrix-1coj.onrender.com');

export default function Inspection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [userProfile, setUserProfile] = useState(null);
  const [scoutChecklist, setScoutChecklist] = useState([]);
  const [isScoutLoading, setIsScoutLoading] = useState(false);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        if (data.routine_checklist) {
          setScoutChecklist(data.routine_checklist);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login', { replace: true });
    } else {
      fetchUser();
    }
  }, [navigate]);

  const handleGenerateChecklist = async () => {
    setIsScoutLoading(true);
    const token = localStorage.getItem('token');
    try {
      // Pass a default 25C and 60% humidity if weather isn't available
      const response = await fetch(`${API_BASE_URL}/api/farming/routine-scout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          crop: userProfile?.crops?.[0] || 'Unknown Crop',
          temperature: 25,
          humidity: 60
        })
      });
      if (response.ok) {
        const data = await response.json();
        const initialChecklist = data.items.map(item => ({ task: item, done: false }));
        setScoutChecklist(initialChecklist);
        await fetch(`${API_BASE_URL}/api/user/routine-checklist`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ checklist: initialChecklist })
        });
      } else {
        throw new Error('Failed to fetch checklist');
      }
    } catch (error) {
      console.error(error);
      const fallback = [
        { task: "Check leaves for spots or discoloration", done: false },
        { task: "Look for insect eggs under leaves", done: false },
        { task: "Inspect stems for holes", done: false },
        { task: "Check soil moisture", done: false },
        { task: "Verify irrigation status", done: false }
      ];
      setScoutChecklist(fallback);
      await fetch(`${API_BASE_URL}/api/user/routine-checklist`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: fallback })
      });
    }
    setIsScoutLoading(false);
  };

  const toggleScoutItem = async (index) => {
    const updatedList = scoutChecklist.map((item, i) => 
      i === index ? { ...item, done: !item.done } : item
    );
    setScoutChecklist(updatedList);
    
    const token = localStorage.getItem('token');
    if (token) {
      await fetch(`${API_BASE_URL}/api/user/routine-checklist`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: updatedList })
      }).catch(console.error);
    }
  };

  return (
    <div className="dashboard-shell min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b-4 border-black bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <BrandLogo tagline="Smart Farming" markClassName="w-11 h-11" />
        <div className="flex items-center gap-4">
           <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex gap-2 py-2 px-4 text-sm items-center">
             <ArrowLeft size={18} />
             <span className="hidden md:inline">{t('nav.back_to_dashboard', 'Back to Dashboard')}</span>
           </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-8">
          {t('inspection.title', 'FIELD INSPECTION')}
        </h1>
        
        <Card decoration="triangle" decorationColor="bg-black" className="bg-white border-4 border-black p-8 shadow-bauhaus-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b-4 border-black pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center shadow-bauhaus-sm">
                <ClipboardList size={24} className="text-black" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-widest text-2xl leading-none">AI CHECKLIST</h3>
                <p className="font-bold text-gray-500 mt-1 uppercase text-sm">Targeting: {userProfile?.crops?.[0] || 'Your Crop'}</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGenerateChecklist} 
              disabled={isScoutLoading}
              className="text-sm py-2 px-4 border-4 uppercase font-black"
            >
              {isScoutLoading ? 'GENERATING...' : 'REGENERATE AI LIST'}
            </Button>
          </div>

          {scoutChecklist.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border-4 border-dashed border-black">
              <p className="font-bold text-lg mb-4">No checklist generated yet.</p>
              <Button onClick={handleGenerateChecklist} disabled={isScoutLoading} className="font-black uppercase tracking-widest">
                {isScoutLoading ? 'Generating...' : 'Generate First Checklist'}
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {scoutChecklist.map((item, idx) => (
                <li 
                  key={idx} 
                  className={`flex gap-4 items-start cursor-pointer p-4 border-4 border-black transition-colors ${item.done ? 'bg-gray-100 opacity-75' : 'bg-white hover:bg-yellow-50 shadow-bauhaus-sm'}`} 
                  onClick={() => toggleScoutItem(idx)}
                >
                  <div className={`mt-1 flex-shrink-0 w-6 h-6 border-4 border-black flex items-center justify-center ${item.done ? 'bg-black' : 'bg-white'}`}>
                    {item.done && <span className="text-white text-sm font-black">✓</span>}
                  </div>
                  <span className={`font-black text-xl leading-tight ${item.done ? 'line-through text-gray-500' : 'text-black'}`}>
                    {item.task}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}
