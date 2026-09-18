'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: '',
    category: 'Technology',
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear token when visiting signup page
  useEffect(() => {
    localStorage.removeItem('agent_auth_token');
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      if (data.token) {
        localStorage.setItem('agent_auth_token', data.token);
      }

      router.push('/admin'); // Redirect to dashboard after signup
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans">
      
      {/* Left Banner - Hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-600 p-12 text-white flex-col justify-between relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-lg border border-white/20">
              <Image src="/logo.png" alt="Bizentrix" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white group-hover:text-emerald-200 transition-colors">Bizentrix Technology</span>
          </Link>
        </div>

        <div className="relative z-10 mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight tracking-tight">
            Supercharge your business <br/>
            with <span className="text-emerald-300">Bizentrix AI</span>
          </h1>
          <p className="text-emerald-100/90 text-lg leading-relaxed max-w-sm mb-12">
            Join hundreds of forward-thinking businesses automating their operations, answering customer FAQs 24/7, and scaling effortlessly.
          </p>
          
          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-emerald-800 bg-emerald-200"></div>
              <div className="w-10 h-10 rounded-full border-2 border-emerald-800 bg-emerald-300"></div>
              <div className="w-10 h-10 rounded-full border-2 border-emerald-800 bg-emerald-400"></div>
              <div className="w-10 h-10 rounded-full border-2 border-emerald-800 bg-emerald-100 flex items-center justify-center text-emerald-800 text-xs font-bold">+99</div>
            </div>
              <p className="text-sm font-semibold text-emerald-100/90">Businesses joined this week</p>
          </div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-24 xl:px-32 relative">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          
          {/* Mobile Header */}
          <div className="md:hidden mb-10 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <span className="font-bold text-2xl tracking-tight text-slate-900">Bizentrix</span>
            </Link>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
            <p className="mt-3 text-sm text-slate-500 font-medium">
              Already have an account?{' '}
              <Link href="/signin" className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors">
                Sign in instead
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50/50 border border-red-200 text-red-600 p-4 rounded-xl flex gap-3 items-start text-sm font-medium">
                  <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="businessName" className="block text-sm font-semibold text-slate-700 mb-1.5">Business Name</label>
                <input id="businessName" name="businessName" type="text" required onChange={handleChange} 
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all sm:text-sm bg-slate-50/50" 
                  placeholder="e.g. Bizentrix Solutions" />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full pl-4 pr-10 py-3 text-base border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm rounded-xl appearance-none bg-slate-50/50 font-medium text-slate-700 cursor-pointer"
                  >
                    <option value="Technology">Technology & Software</option>
                    <option value="Retail">Retail & E-commerce</option>
                    <option value="Healthcare">Healthcare & Wellness</option>
                    <option value="Hospitality">Hospitality & Travel</option>
                    <option value="Finance">Finance & Consulting</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">Your Full Name</label>
                <input id="name" name="name" type="text" required onChange={handleChange} 
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all sm:text-sm bg-slate-50/50" 
                  placeholder="John Doe" />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">Work Email</label>
                <input id="email" name="email" type="email" required onChange={handleChange} 
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all sm:text-sm bg-slate-50/50" 
                  placeholder="admin@business.com" />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <input id="password" name="password" type="password" required onChange={handleChange} 
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all sm:text-sm bg-slate-50/50" 
                  placeholder="••••••••" />
              </div>

              <div className="pt-2">
                <button type="submit" 
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-500/30 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed" 
                  disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Creating Account...
                    </span>
                  ) : 'Create Account'}
                </button>
              </div>
              
              <p className="text-xs text-center text-slate-500 font-medium mt-4">
                By signing up, you agree to our <Link href="#" className="text-emerald-600 hover:underline">Terms of Service</Link> and <Link href="#" className="text-emerald-600 hover:underline">Privacy Policy</Link>.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
