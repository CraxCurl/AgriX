import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://agrix-1coj.onrender.com');

export default function Report() {
  const [reportDataList, setReportDataList] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login', { replace: true });
      return;
    }
    
    async function fetchReport() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/user/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.marketData) {
            setReportDataList(Array.isArray(data.marketData) ? data.marketData : [data.marketData]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchReport();
  }, [navigate]);

  if (!reportDataList || reportDataList.length === 0) return <div className="p-12 text-center font-bold text-2xl uppercase">{t('report.loading', 'Loading Report...')}</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-5xl font-black uppercase mb-6 border-b-4 border-black pb-4 text-center">{t('report.title', 'Full Market Report')}</h1>
        {reportDataList.map((reportData, idx) => (
          <Card key={idx} className="bg-white border-4 border-black shadow-bauhaus-md p-8">
            <h2 className="text-3xl font-black uppercase mb-4 text-primary-blue">{t(`settings.${reportData.crop.toLowerCase().replace(/ \/ .*/, '').replace(/ /g, '_')}`, reportData.crop)}</h2>
            <div className="space-y-6 text-xl">
              <p><strong>{t('report.current_price', 'Current Price:')}</strong> ₹{reportData.current_price_per_quintal} / {t('dashboard.qtl', 'Qtl')}</p>
              <p><strong>{t('report.predicted_price', 'Predicted Price Next Month:')}</strong> ₹{reportData.predicted_price_next_month} / {t('dashboard.qtl', 'Qtl')}</p>
              <div className={`p-4 font-bold uppercase ${reportData.advice === 'Hold' ? 'bg-primary-yellow border-4 border-black' : 'bg-primary-red text-white border-4 border-black'}`}>
                {t('report.system_advice', 'System Advice:')} {reportData.advice === 'Hold' ? t('dashboard.hold', 'Hold') : t('dashboard.sell_now', 'Sell Now')}
              </div>
              <div className="mt-8 border-t-4 border-black pt-6">
                <h3 className="text-2xl font-black mb-4">{t('report.historical_trends', 'Historical Trends')}</h3>
                {reportData.historical_data && reportData.historical_data.length > 0 ? (
                  <div className="h-80 bg-white border-4 border-black p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={reportData.historical_data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#000" />
                        <XAxis dataKey="month" stroke="#000" tick={{ fill: '#000', fontWeight: 'bold' }} />
                        <YAxis stroke="#000" tick={{ fill: '#000', fontWeight: 'bold' }} domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '4px solid #000', fontWeight: 'bold', color: '#000' }}
                          itemStyle={{ color: '#000' }}
                        />
                        <Area type="monotone" dataKey="price" stroke="#000" strokeWidth={4} fill="#FFD700" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 bg-gray-100 border-4 border-black flex items-center justify-center text-center p-4 font-bold uppercase">
                    {t('report.no_historical_data', 'No historical data available')}
                  </div>
                )}
                {reportData.graph_explanation && (
                  <div className="mt-6 p-6 bg-gray-100 border-4 border-black font-medium text-lg leading-relaxed shadow-bauhaus-sm">
                    <span className="block font-black uppercase mb-2 text-primary-red">{t('report.ai_analysis', 'AI Analysis')}</span>
                    {reportData.graph_explanation}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
        <div className="mt-8 text-center">
          <Button onClick={() => window.close()} className="w-full sm:w-auto px-12 py-4">{t('report.close_report', 'Close Report')}</Button>
        </div>
      </div>
    </div>
  );
}
