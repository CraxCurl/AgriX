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
  const [isSaving, setIsSaving] = useState(false);

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
    // Simulate backend call to save user preferences
    setTimeout(() => {
      setIsSaving(false);
      alert('Preferences saved successfully!');
    }, 800);
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
