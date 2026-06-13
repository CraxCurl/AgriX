import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CloudRain, TrendingUp, Scan, Mic, UploadCloud, MapPin } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const weatherCodeLabels = {
  0: 'Clear Sky',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime Fog',
  51: 'Light Drizzle',
  53: 'Drizzle',
  55: 'Heavy Drizzle',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  80: 'Rain Showers',
  81: 'Heavy Showers',
  82: 'Violent Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm With Hail',
  99: 'Severe Thunderstorm',
};

function getWeatherLabel(code) {
  return weatherCodeLabels[code] || 'Forecast Updated';
}

function buildIrrigationAdvice(forecast) {
  const rainChance = forecast.daily?.precipitation_probability_max?.[0] ?? 0;
  const weatherCode = forecast.current?.weather_code;
  const rainyNow = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode);

  if (rainyNow || rainChance >= 60) {
    return 'Delay watering for 24-48 hours. Rain is likely in this forecast window.';
  }

  if (rainChance >= 30) {
    return 'Use light irrigation and check soil moisture before watering deeply.';
  }

  return 'Water on the next cool morning or evening if the top soil feels dry.';
}

export default function Dashboard() {
  const fileInputRef = useRef(null);
  const cropPreviewRef = useRef('');
  const [cropFile, setCropFile] = useState(null);
  const [cropPreview, setCropPreview] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle');
  const [scanError, setScanError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [locationLabel, setLocationLabel] = useState('Requesting location...');
  const [weather, setWeather] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState('loading');
  const [weatherError, setWeatherError] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      window.setTimeout(() => {
        setWeatherStatus('error');
        setWeatherError('Location access is not supported by this browser.');
        setLocationLabel('Location unavailable');
      }, 0);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          setWeatherStatus('loading');
          const { latitude, longitude } = coords;

          const [forecastResponse, placeResponse] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=auto&forecast_days=3`
            ),
            fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            ),
          ]);

          if (!forecastResponse.ok) {
            throw new Error('Weather forecast could not be loaded.');
          }

          const forecast = await forecastResponse.json();
          const place = placeResponse.ok ? await placeResponse.json() : null;
          const locality = place?.city || place?.locality || place?.principalSubdivision;
          const region = place?.principalSubdivisionCode || place?.principalSubdivision;

          setWeather(forecast);
          setLocationLabel(
            [locality, region].filter(Boolean).join(', ') ||
              `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
          );
          setWeatherStatus('ready');
          setWeatherError('');
        } catch (error) {
          setWeatherStatus('error');
          setWeatherError(error.message || 'Weather forecast could not be loaded.');
          setLocationLabel('Location detected');
        }
      },
      (error) => {
        setWeatherStatus('error');
        setWeatherError(
          error.code === error.PERMISSION_DENIED
            ? 'Allow location access to show your local forecast.'
            : 'Unable to detect your location.'
        );
        setLocationLabel('Location needed');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => () => {
    if (cropPreviewRef.current) {
      URL.revokeObjectURL(cropPreviewRef.current);
    }
  }, []);

  const currentTemperature = useMemo(() => {
    const temp = weather?.current?.temperature_2m;
    return Number.isFinite(temp) ? Math.round(temp) : null;
  }, [weather]);

  const forecastLabel = weather ? getWeatherLabel(weather.current?.weather_code) : 'Waiting For Location';
  const irrigationAdvice = weather ? buildIrrigationAdvice(weather) : 'Share your location to get local irrigation guidance.';

  function handleCropFile(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setScanError('Please upload an image file.');
      return;
    }

    if (cropPreviewRef.current) {
      URL.revokeObjectURL(cropPreviewRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    cropPreviewRef.current = objectUrl;
    setCropFile(file);
    setCropPreview(objectUrl);
    setScanResult(null);
    setScanError('');
    setScanStatus('idle');
  }

  function clearCropFile() {
    if (cropPreviewRef.current) {
      URL.revokeObjectURL(cropPreviewRef.current);
      cropPreviewRef.current = '';
    }

    setCropFile(null);
    setCropPreview('');
    setScanResult(null);
    setScanError('');
    setScanStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function analyzeCrop() {
    if (!cropFile) {
      setScanError('Choose or drop a crop image first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', cropFile);

    try {
      setScanStatus('loading');
      setScanError('');
      const response = await fetch(`${API_BASE_URL}/api/farming/disease-detection`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Crop scan failed. Make sure the backend server is running.');
      }

      const result = await response.json();
      setScanResult(result);
      setScanStatus('success');
    } catch (error) {
      setScanStatus('error');
      setScanError(error.message || 'Crop scan failed.');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b-4 border-black bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {/* Bauhaus Logo */}
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-primary-red rounded-full border-2 border-black"></div>
            <div className="w-4 h-4 bg-primary-blue border-2 border-black"></div>
            <div className="w-4 h-4 bg-primary-yellow border-2 border-black" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
          </div>
          <span className="font-black text-2xl uppercase tracking-tighter ml-2">AGRIX</span>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="ghost" shape="pill" className="hidden md:flex gap-2">
             <Mic size={18} />
             Voice Command
           </Button>
           <Button variant="outline" className="py-2 px-4 text-sm">Logout</Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b-4 border-black">
          <div>
            <h1 className="text-6xl md:text-8xl">FARM<br/>OVERVIEW</h1>
            <p className="text-xl font-bold uppercase tracking-widest mt-4">Welcome back, Developer</p>
          </div>
          <div className="bg-primary-yellow border-4 border-black shadow-bauhaus-md p-4 rotate-2">
             <p className="font-bold uppercase flex items-center gap-2">
               <MapPin size={18} />
               Location: {locationLabel}
             </p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Disease Detection Card */}
          <Card decoration="circle" decorationColor="bg-primary-red" className="lg:col-span-2 group">
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-3xl md:text-4xl">CROP SCAN</h2>
              <div className="w-12 h-12 bg-primary-red border-4 border-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Scan className="text-white" />
              </div>
            </div>
            <p className="font-medium mb-8 max-w-md">Upload an image of your crop leaves to instantly detect diseases using our AI model.</p>
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              onChange={(event) => handleCropFile(event.target.files?.[0])}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                handleCropFile(event.dataTransfer.files?.[0]);
              }}
              className={`border-4 border-dashed border-black p-6 text-center mb-6 cursor-pointer transition-colors min-h-44 flex flex-col items-center justify-center gap-4 ${
                isDragging ? 'bg-primary-yellow' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
               {cropPreview ? (
                 <>
                   <img src={cropPreview} alt="Selected crop preview" className="max-h-56 w-full object-contain border-4 border-black bg-white" />
                   <span className="font-bold uppercase tracking-widest break-all">{cropFile.name}</span>
                 </>
               ) : (
                 <>
                   <UploadCloud size={36} />
                   <span className="font-bold uppercase tracking-widest">Drop Image Here Or Click To Upload</span>
                 </>
               )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <Button variant="primary" onClick={analyzeCrop} disabled={scanStatus === 'loading'}>
                {scanStatus === 'loading' ? 'Analyzing...' : 'Analyze Crop'}
              </Button>
              {cropFile && (
                <Button
                  variant="outline"
                  onClick={clearCropFile}
                >
                  Remove Image
                </Button>
              )}
            </div>
            {scanError && <p className="mt-4 font-bold text-primary-red">{scanError}</p>}
            {scanResult && (
              <div className="mt-6 bg-white border-4 border-black p-4 shadow-bauhaus-md">
                <p className="font-bold uppercase tracking-widest text-gray-500 mb-1">Scan Result</p>
                <p className="text-3xl font-black uppercase">{scanResult.disease}</p>
                <p className="font-bold mt-2">Confidence: {scanResult.confidence}%</p>
                <p className="font-medium mt-2">{scanResult.recommendation}</p>
              </div>
            )}
          </Card>

          {/* Weather & Irrigation */}
          <Card decoration="square" decorationColor="bg-primary-blue" className="bg-primary-blue text-white group">
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-3xl md:text-4xl text-white">WEATHER</h2>
              <div className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center group-hover:scale-110 transition-transform">
                <CloudRain className="text-primary-blue" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="border-b-4 border-black pb-4">
                <p className="text-5xl font-black mb-2">
                  {currentTemperature === null ? '--' : currentTemperature}°
                </p>
                <p className="font-bold uppercase">
                  {weatherStatus === 'loading' ? 'Loading Local Forecast' : forecastLabel}
                </p>
                {weatherError && <p className="font-medium mt-3 text-white">{weatherError}</p>}
              </div>
              <div>
                <p className="font-bold uppercase tracking-widest mb-2">Irrigation Advice</p>
                <div className="bg-white text-black p-4 border-4 border-black font-medium">
                  {irrigationAdvice}
                </div>
              </div>
            </div>
          </Card>

          {/* Price Predictions */}
          <Card decoration="triangle" decorationColor="bg-primary-yellow" className="bg-primary-yellow group lg:col-span-3">
             <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}>
                      <TrendingUp className="text-black" size={20} />
                    </div>
                    <h2 className="text-3xl md:text-4xl">MARKET PRICE</h2>
                  </div>
                  <p className="font-medium max-w-lg mb-6">AI prediction for Wheat prices based on current market trends and historical data.</p>
                  <Button variant="outline">View Full Report</Button>
                </div>
                
                <div className="flex-1 w-full bg-white border-4 border-black p-6 shadow-bauhaus-md flex items-center justify-between">
                   <div>
                     <p className="font-bold uppercase tracking-widest text-gray-500 mb-1">Current Price</p>
                     <p className="text-4xl font-black">$245 / Qtl</p>
                   </div>
                   <div className="w-1 bg-black self-stretch mx-4"></div>
                   <div>
                     <p className="font-bold uppercase tracking-widest text-gray-500 mb-1">Next Month (Est)</p>
                     <p className="text-4xl font-black text-primary-red">$268 / Qtl</p>
                   </div>
                   <div className="bg-black text-white px-4 py-2 uppercase font-bold transform rotate-3">
                      Sell Later
                   </div>
                </div>
             </div>
          </Card>

        </div>
      </main>
    </div>
  );
}
