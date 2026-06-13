import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CloudRain, TrendingUp, Scan, Mic } from 'lucide-react';

export default function Dashboard() {
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
             <p className="font-bold uppercase">Location: Modesto, CA</p>
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
            <div className="border-4 border-dashed border-black p-8 text-center bg-gray-50 mb-6 cursor-pointer hover:bg-gray-100 transition-colors">
               <span className="font-bold uppercase tracking-widest">Drop Image Here</span>
            </div>
            <Button variant="primary">Analyze Crop</Button>
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
                <p className="text-5xl font-black mb-2">72°</p>
                <p className="font-bold uppercase">Light Rain Expected</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-widest mb-2">Irrigation Advice</p>
                <div className="bg-white text-black p-4 border-4 border-black font-medium">
                  Delay watering for 48 hours. Soil moisture is optimal at 45%.
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
