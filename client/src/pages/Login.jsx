import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ArrowRight, Code } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://agrix-1coj.onrender.com');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      } else {
        setError(data.detail || data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'dev@agrix.com', password: 'sandbox' }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side: Branding / Decorative */}
      <div className="w-full md:w-1/2 bg-primary-blue p-12 flex flex-col justify-center items-center relative overflow-hidden border-b-4 md:border-b-0 md:border-r-4 border-black">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-dot-pattern bg-dot-size opacity-20"></div>
        
        {/* Geometric Abstract Art */}
        <div className="relative w-64 h-64 mb-12">
          <div className="absolute top-0 left-0 w-48 h-48 bg-primary-red rounded-full border-4 border-black mix-blend-multiply"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-primary-yellow border-4 border-black mix-blend-multiply rotate-12"></div>
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white border-4 border-black rotate-45 flex items-center justify-center">
             <div className="w-16 h-16 bg-primary-blue rounded-full border-4 border-black"></div>
          </div>
        </div>

        <h1 className="text-white text-6xl md:text-8xl relative z-10 text-center">AGRIX</h1>
        <p className="text-white text-xl font-bold uppercase tracking-widest mt-4 relative z-10 border-2 border-white px-4 py-2">Smart Farming</p>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full md:w-1/2 bg-background p-8 md:p-16 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <Card decoration="triangle" decorationColor="bg-primary-red">
            <h2 className="text-4xl mb-6">LOGIN</h2>
            
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-primary-red text-white p-3 font-bold">
                  {error}
                </div>
              )}
              <div>
                <label className="block font-bold uppercase tracking-widest mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bauhaus-input w-full"
                  placeholder="farmer@example.com"
                  required
                />
              </div>
              <div>
                <label className="block font-bold uppercase tracking-widest mb-2">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bauhaus-input w-full"
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" variant="primary" className="w-full flex justify-between items-center group" disabled={loading}>
                <span>{loading ? 'Logging in...' : 'Login'}</span>
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Button>
            </form>

            <div className="mt-6 text-center font-bold">
              Don't have an account? <Link to="/register" className="underline hover:text-primary-red">Register here</Link>
            </div>
          </Card>

          {/* Sandbox Login */}
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="h-1 bg-black flex-1"></div>
              <span className="font-bold uppercase tracking-widest">Developers</span>
              <div className="h-1 bg-black flex-1"></div>
            </div>
            <Button onClick={handleSandboxLogin} variant="outline" shape="pill" className="w-full flex justify-center items-center gap-2">
              <Code size={20} />
              Sandbox Login
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
