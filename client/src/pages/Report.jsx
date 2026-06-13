import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://agrix-1coj.onrender.com');

export default function Report() {
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    // Fetch a more detailed report from backend. For now, using mock or same endpoint.
    async function fetchReport() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/farming/price-prediction?crop=Wheat`);
        const data = await response.json();
        setReportData(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchReport();
  }, []);

  if (!reportData) return <div className="p-12 text-center font-bold text-2xl uppercase">Loading Report...</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <Card className="max-w-4xl mx-auto bg-white border-4 border-black shadow-bauhaus-md p-8">
        <h1 className="text-5xl font-black uppercase mb-6 border-b-4 border-black pb-4">Full Market Report</h1>
        <div className="space-y-6 text-xl">
          <p><strong>Primary Crop:</strong> <span className="uppercase">{reportData.crop}</span></p>
          <p><strong>Current Price:</strong> ₹{reportData.current_price_per_quintal} / Qtl</p>
          <p><strong>Predicted Price Next Month:</strong> ₹{reportData.predicted_price_next_month} / Qtl</p>
          <div className={`p-4 font-bold uppercase ${reportData.advice === 'Hold' ? 'bg-primary-yellow border-4 border-black' : 'bg-primary-red text-white border-4 border-black'}`}>
            System Advice: {reportData.advice}
          </div>
          <div className="mt-8 border-t-4 border-black pt-6">
            <h2 className="text-3xl font-black mb-4">Historical Trends</h2>
            <div className="h-64 bg-gray-100 border-4 border-black flex items-center justify-center">
              [Chart Placeholder: Implement Chart.js or Recharts here in future]
            </div>
          </div>
        </div>
        <div className="mt-8 text-center">
          <Button onClick={() => window.close()} className="w-full sm:w-auto px-12 py-4">Close Report</Button>
        </div>
      </Card>
    </div>
  );
}
