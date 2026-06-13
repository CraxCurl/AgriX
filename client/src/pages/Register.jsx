import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ArrowRight } from 'lucide-react';

export default function Register() {
  const [step, setStep] = useState('register'); // register or otp
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok || response.status === 201) {
        setStep('otp');
      } else {
        setError(data.detail || data.message || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      } else {
        setError(data.detail || data.message || 'OTP verification failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || data.message || 'Failed to resend OTP');
      } else {
        setSuccessMsg("OTP has been resent successfully!");
      }
    } catch (err) {
      setError('An error occurred while resending OTP.');
    } finally {
      setLoading(false);
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
          <div className="absolute top-0 left-0 w-48 h-48 bg-primary-yellow rounded-full border-4 border-black mix-blend-multiply"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-primary-red border-4 border-black mix-blend-multiply rotate-45"></div>
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white border-4 border-black flex items-center justify-center">
             <div className="w-16 h-16 bg-primary-blue border-4 border-black"></div>
          </div>
        </div>

        <h1 className="text-white text-6xl md:text-8xl relative z-10 text-center">AGRIX</h1>
        <p className="text-white text-xl font-bold uppercase tracking-widest mt-4 relative z-10 border-2 border-white px-4 py-2">Join The Future</p>
      </div>

      {/* Right side: Register Form */}
      <div className="w-full md:w-1/2 bg-background p-8 md:p-16 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <Card decoration="triangle" decorationColor="bg-primary-yellow">
            <h2 className="text-4xl mb-6">{step === 'register' ? 'REGISTER' : 'VERIFY OTP'}</h2>
            
            {error && (
              <div className="bg-primary-red text-white p-3 font-bold mb-6">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-primary-blue text-white p-3 font-bold mb-6">
                {successMsg}
              </div>
            )}

            {step === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <label className="block font-bold uppercase tracking-widest mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bauhaus-input w-full"
                    placeholder="John Doe"
                    required
                  />
                </div>
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
                    minLength={6}
                  />
                </div>
                <Button type="submit" variant="primary" className="w-full flex justify-between items-center group" disabled={loading}>
                  <span>{loading ? 'Registering...' : 'Create Account'}</span>
                  <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </Button>
                
                <div className="mt-6 text-center font-bold">
                  Already have an account? <Link to="/login" className="underline hover:text-primary-red">Login here</Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                 <div>
                  <label className="block font-bold uppercase tracking-widest mb-2">Enter OTP</label>
                  <p className="text-sm mb-4">An OTP has been sent to your email address.</p>
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="bauhaus-input text-center text-2xl tracking-widest w-full"
                    placeholder="• • • • • •"
                    maxLength={6}
                    required
                  />
                </div>
                <Button type="submit" variant="yellow" className="w-full flex justify-between items-center group" disabled={loading}>
                  <span>{loading ? 'Verifying...' : 'Verify & Login'}</span>
                  <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </Button>

                <div className="flex justify-between items-center mt-4">
                  <button type="button" onClick={() => setStep('register')} className="text-sm font-bold uppercase underline">
                    Back to Registration
                  </button>
                  <button type="button" onClick={handleResendOTP} disabled={loading} className="text-sm font-bold uppercase underline text-primary-red hover:text-black">
                    Resend OTP
                  </button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
