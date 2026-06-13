import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function Settings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [landUnit, setLandUnit] = useState('Acres');
  const [primaryCrop, setPrimaryCrop] = useState('Wheat');
  const [farmDescription, setFarmDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/user/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.farm_description) {
            setFarmDescription(data.farm_description);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    // Sync state with i18n just in case it was changed elsewhere
    setLanguage(i18n.language || 'en');
  }, [i18n.language]);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    i18n.changeLanguage(lang);
    // In a real app, you would also push this change to the backend /api/user/settings here
  };

  const handleSave = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('token');
    
    try {
      // Update farm description via text
      if (farmDescription.trim()) {
        await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/user/farm-description/text`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ description: farmDescription })
        });
      }
      
      setIsSaving(false);
      alert('Preferences saved successfully!');
    } catch (e) {
      console.error(e);
      setIsSaving(false);
      alert('Error saving preferences.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b-4 border-black bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          {/* Bauhaus Logo */}
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-primary-red rounded-full border-2 border-black"></div>
            <div className="w-4 h-4 bg-primary-blue border-2 border-black"></div>
            <div className="w-4 h-4 bg-primary-yellow border-2 border-black" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
          </div>
          <span className="font-black text-2xl uppercase tracking-tighter ml-2">AGRIX</span>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="outline" className="py-2 px-4 text-sm" onClick={() => navigate('/dashboard')}>Back</Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">
          {t('settings.title', 'FARMER SETTINGS')}
        </h1>

        <Card className="bg-white border-4 border-black shadow-bauhaus space-y-8 p-8">
          
          <div className="flex flex-col gap-2">
            <label className="font-bold uppercase tracking-widest text-lg">{t('settings.language', 'Language')}</label>
            <select 
              value={language} 
              onChange={handleLanguageChange}
              className="w-full border-4 border-black p-4 bg-white text-xl font-bold uppercase focus:outline-none focus:ring-4 focus:ring-primary-blue transition-all"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="ta">தமிழ் (Tamil)</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold uppercase tracking-widest text-lg">{t('settings.land_size', 'Land Size Unit')}</label>
            <select 
              value={landUnit} 
              onChange={(e) => setLandUnit(e.target.value)}
              className="w-full border-4 border-black p-4 bg-white text-xl font-bold uppercase focus:outline-none focus:ring-4 focus:ring-primary-blue transition-all"
            >
              <option value="Acres">Acres</option>
              <option value="Hectares">Hectares</option>
              <option value="Bigha">Bigha</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold uppercase tracking-widest text-lg">{t('settings.primary_crop', 'Primary Crop')}</label>
            <select 
              value={primaryCrop} 
              onChange={(e) => setPrimaryCrop(e.target.value)}
              className="w-full border-4 border-black p-4 bg-white text-xl font-bold uppercase focus:outline-none focus:ring-4 focus:ring-primary-blue transition-all"
            >
              <option value="Wheat">Wheat</option>
              <option value="Rice">Rice</option>
              <option value="Sugarcane">Sugarcane</option>
              <option value="Cotton">Cotton</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 border-t-4 border-black pt-6">
            <label className="font-bold uppercase tracking-widest text-lg">Farm Description (Processed by AI)</label>
            <p className="font-medium text-gray-600 mb-2">Update your farm description to automatically detect crops and land size.</p>
            <textarea 
              value={farmDescription} 
              onChange={(e) => setFarmDescription(e.target.value)}
              className="w-full border-4 border-black p-4 bg-white text-xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-blue transition-all"
              rows={4}
              placeholder="E.g., I grow wheat on 5 acres of land..."
            />
          </div>

          <Button 
            className="w-full py-4 text-xl" 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : t('settings.save', 'Save Preferences')}
          </Button>

        </Card>
      </main>
    </div>
  );
}
